/* Adaptador del optimizador: los datos se leen en index.html y se procesan localmente. */
(function(root){
  "use strict";
  const WILDCARD="xxxx@xxxxxx", ROLES=["P","S","V"];
  function build(tfms,configuration,availability,tutors){
    const helper=root.TribunalGenerator;
    const config=helper.getConfiguration(configuration);
    const slots=helper.allowedDates(config).flatMap(date=>helper.allowedTimes(config).map(time=>({date,time})));
    const {schedule}=helper.availabilitySlots(availability);
    const roles=helper.tutorRoles(tutors), people=helper.eligibleMembers(availability);
    const email=x=>String(x??"").trim().toLowerCase();
    const options=tfms.records.map(row=>slots.map(({date,time})=>{
      const forbidden=new Set([row[0],row[6],row[7]].map(email).filter(Boolean));
      return ROLES.map(role=>people.filter(person=>
        !forbidden.has(person) && roles.get(person)?.has(role) &&
        helper.availableAt(schedule,person,date,time)));
    }));
    if(!slots.length)throw Error("No existen franjas válidas en Configuración.");
    return {students:tfms.records.map(row=>email(row[0])),slots,options};
  }
  function optimize(tfms,configuration,availability,tutors,timeLimitMs=10000){
    const data=build(tfms,configuration,availability,tutors);
    return new Promise((resolve,reject)=>{
      const worker=new Worker("./tribunal-backtracking-worker.js");
      let finished=false;
      const finish=(err,result)=>{
        if(finished)return;
        finished=true;worker.terminate();
        if(err)reject(err);else resolve(result);
      };
      worker.onerror=event=>finish(new Error("Error en Web Worker: "+event.message));
      worker.onmessage=({data:out})=>{
        try{
          if(!Array.isArray(out.rows)||out.rows.length!==tfms.records.length)throw Error("Resultado incompleto.");
          const used=new Set();
          const rows=out.rows.map((choice,i)=>{
            const [t,...assigned]=choice;
            const slot=data.slots[t];if(!slot||assigned.length!==3)throw Error("Franja o composición inválida.");
            const real=assigned.filter(p=>p!==WILDCARD);
            if(new Set(real).size!==real.length)throw Error("Profesor duplicado dentro del tribunal.");
            assigned.forEach((person,r)=>{
              if(person===WILDCARD)return;
              if(!data.options[i][t][r].includes(person))throw Error("Incumplimiento de rol, tutoría o disponibilidad.");
              const key=t+"|"+person;
              if(used.has(key))throw Error("Profesor solapado en dos tribunales.");
              used.add(key);
            });
            return [tfms.records[i][0],slot.date,slot.time,...assigned,tfms.records[i][6],tfms.records[i][7]];
          });
          const counts=ROLES.map((role,r)=>rows.filter(row=>row[r+3]===WILDCARD).length);
          if(counts.some((n,r)=>n!==out.vacancies[roleIndex(r)]))throw Error("El recuento de vacantes es inconsistente.");
          finish(null,{headers:tfms.headers,records:rows,...out});
        }catch(e){finish(e);}
      };
      function roleIndex(r){return ROLES[r];}
      worker.postMessage({...data,timeLimitMs});
    });
  }
  root.TribunalBacktracking={optimize,build};
})(window);
