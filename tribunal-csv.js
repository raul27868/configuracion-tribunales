/* Importación local de CSV de tribunales; no se transmite el archivo. */
(function(root){
"use strict";
const HEADERS=["Alumno","Fecha","Hora","Presidente","Secretario","Vocal","Tutor1","Tutor2"];
const norm=x=>String(x??"").trim().toLowerCase();
function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,"");
  const first=text.split(/\r?\n/,1)[0];
  const delimiter=first.includes("\t")?"\t":(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?";":",";
  const rows=[];let row=[],value="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){
      if(quoted && text[i+1]==='"'){value+='"';i++;}
      else quoted=!quoted;
    }else if(c===delimiter && !quoted){row.push(value);value="";}
    else if((c==="\n"||c==="\r")&&!quoted){
      if(c==="\r" && text[i+1]==="\n")i++;
      row.push(value);value="";
      if(row.some(cell=>cell!==""))rows.push(row);
      row=[];
    }else value+=c;
  }
  if(quoted)throw Error("CSV con comillas sin cerrar.");
  row.push(value);if(row.some(cell=>cell!==""))rows.push(row);
  if(rows.length<2)throw Error("El CSV no contiene registros.");
  const headings=rows.shift().map(x=>norm(x).replace(/\s+/g," "));
  const idx=HEADERS.map(h=>headings.indexOf(norm(h)));
  if(idx.some(i=>i<0))throw Error("El CSV debe contener Alumno, Fecha, Hora, Presidente, Secretario, Vocal, Tutor1 y Tutor2.");
  const seen=new Set();
  return rows.map((cells,n)=>{
    const result=idx.map(i=>String(cells[i]??"").trim());
    const email=norm(result[0]);
    if(!email || seen.has(email))throw Error("Alumno vacío o duplicado en CSV (fila "+(n+2)+").");
    seen.add(email);
    if(Boolean(result[1])!==Boolean(result[2]))throw Error("Fecha y Hora deben estar ambas rellenas o vacías para "+result[0]+".");
    return result;
  });
}
function merge(base, imported){
  const rowsByStudent=new Map(imported.map(row=>[norm(row[0]),row]));
  const expected=new Set(base.records.map(row=>norm(row[0])));
  for(const student of rowsByStudent.keys())if(!expected.has(student))throw Error("El CSV contiene un alumno que no está en TFMs Presentados: "+student);
  if(new Set(base.records.map(row=>norm(row[0]))).size!==base.records.length)throw Error("Hay alumnos duplicados en TFMs Presentados.");
  return base.records.map(row=>{
    const found=rowsByStudent.get(norm(row[0]));
    return found?[row[0],...found.slice(1,6),row[6],row[7]]:[...row];
  });
}
function download(rows){
  const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const csv="\uFEFF"+[HEADERS,...rows].map(row=>row.map(quote).join(";")).join("\r\n");
  const a=document.createElement("a");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.href=url;a.download="tribunales.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
root.TribunalCSV={parseCSV,merge,download,headers:HEADERS};
})(window);
