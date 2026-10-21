/* Backtracking exacto con poda lexicográfica; ejecución en Web Worker. Sin APIs externas. */
"use strict";
const WILDCARD = "xxxx@xxxxxx";
const ROLES = ["P", "S", "V"];
const compare = (a,b) => a[0]-b[0] || a[1]-b[1] || a[2]-b[2];
self.onmessage = ({data}) => {
  const {students,slots,options,timeLimitMs=10000} = data;
  const started=Date.now(), limit=Math.min(Math.max(timeLimitMs,100),600000);
  const n=students.length, occupied=new Set(), current=new Array(n), counts=[0,0,0];
  let best=null, bestCounts=[n+1,n+1,n+1], nodes=0, complete=true, lastProgress=started, currentDepth=0;
  const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>{
    const score=i=>options[i].reduce((sum,slot)=>sum+slot.reduce((s,people)=>s+people.length,0),0);
    return score(a)-score(b);
  });
  const slotOrder=order.map(i=>slots.map((_,t)=>t).sort((a,b)=>{
    const quality=t=>options[i][t].reduce((s,people)=>s+Math.min(people.length,3),0);
    return quality(b)-quality(a);
  }));
  function snapshot(){
    if(compare(counts,bestCounts)<0){
      bestCounts=[...counts];
      best=current.map(row=>[...row]);
      progress('improvement');
    }
  }
  function progress(reason){
    const now=Date.now();
    if(reason!=="improvement" && now-lastProgress<750)return;
    lastProgress=now;
    self.postMessage({type:"progress",reason,nodes,elapsedMs:now-started,
      depth:currentDepth,students:n,vacancies:{P:bestCounts[0],S:bestCounts[1],V:bestCounts[2]}});
  }
  function timedOut(){
    if((nodes & 4095)!==0)return false;
    progress("heartbeat");
    return Date.now()-started>=limit;
  }
  function dfs(depth){
    nodes++;
    currentDepth=depth;
    if(timedOut()){complete=false;return;}
    if(compare(counts,bestCounts)>=0)return;
    if(depth===n){snapshot();return;}
    const a=order[depth];
    for(const t of slotOrder[depth]){
      if(!complete)return;
      const picked=[], assigned=[];
      function fill(r){
        if(!complete)return;
        if(r===3){
          current[a]=[t,...assigned];
          dfs(depth+1);
          return;
        }
        const choices=options[a][t][r].filter(p=>!picked.includes(p) && !occupied.has(t+"|"+p));
        for(const person of choices){
          picked.push(person);assigned.push(person);occupied.add(t+"|"+person);
          fill(r+1);
          occupied.delete(t+"|"+person);assigned.pop();picked.pop();
          if(!complete)return;
          if(bestCounts.every(x=>x===0))return;
        }
        assigned.push(WILDCARD);counts[r]++;
        if(compare(counts,bestCounts)<0)fill(r+1);
        counts[r]--;assigned.pop();
      }
      fill(0);
      if(bestCounts.every(x=>x===0))return;
    }
  }
  // Asignación provisional completa y válida incluso si no hay profesores.
  best=students.map(()=>[0,WILDCARD,WILDCARD,WILDCARD]);
  bestCounts=[n,n,n];
  if(n)dfs(0);
  // Mejorar la solución provisional puede requerir explorar, y la primera solución
  // plenamente asignada puede ser encontrada antes del límite.
  self.postMessage({type:'result',rows:best, vacancies:{P:bestCounts[0],S:bestCounts[1],V:bestCounts[2]},nodes,
    optimal:complete || bestCounts.every(x=>x===0),elapsedMs:Date.now()-started});
};
