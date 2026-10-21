import { CpModel, CpSolver, sum, weightedSum } from "or-tools-wasm/cp-sat";
const WILDCARD = "xxxx@xxxxxx";
const ROLES = ["P", "S", "V"];
const key = (...parts) => parts.join("|");
function buildCandidates(tfms, configuration, availability, tutors) {
  const utility = window.TribunalGenerator;
  const config = utility.getConfiguration(configuration);
  const dates = utility.allowedDates(config);
  const times = utility.allowedTimes(config);
  const slots = dates.flatMap(date => times.map(time => ({ date, time })));
  const { schedule } = utility.availabilitySlots(availability);
  const roles = utility.tutorRoles(tutors);
  const people = utility.eligibleMembers(availability);
  const options = tfms.records.map(row => slots.map(({ date, time }) =>
    ROLES.map(role => people.filter(person =>
      roles.get(person)?.has(role) &&
      utility.availableAt(schedule, person, date, time) &&
      ![row[0],row[6],row[7]].some(other => String(other ?? "").trim().toLowerCase() === person)
    ))));
  return { slots, options };
}
async function solve(tfms, configuration, availability, tutors) {
  if (!globalThis.crossOriginIsolated) throw new Error(
    "El motor WASM requiere aislamiento COOP/COEP. Prueba en Codespaces con Vite; GitHub Pages no ofrece estas cabeceras directamente."
  );
  const { slots, options } = buildCandidates(tfms, configuration, availability, tutors);
  const model = new CpModel();
  const n = tfms.records.length;
  if (!slots.length) throw new Error("No hay fechas y horas permitidas.");
  if (!n) return { headers: tfms.headers, records: [], status: "EMPTY", vacancies: { P:0,S:0,V:0 } };
  const chosenSlot = new Map();
  const choices = new Map();
  const vacancies = { P:[], S:[], V:[] };
  const slotUse = new Map();
  for (let a=0; a<n; a++) {
    const possibleSlots = [];
    for (let t=0; t<slots.length; t++) {
      const y = model.newBoolVar(key("slot",a,t));
      chosenSlot.set(key(a,t),y);
      possibleSlots.push(y);
      for (let r=0; r<3; r++) {
        const role = ROLES[r], vars = [];
        for (const person of options[a][t][r]) {
          const variable = model.newBoolVar(key(a,t,role,person));
          choices.set(key(a,t,role,person),variable);
          vars.push(variable);
          const occupancyKey=key(t,person);
          if (!slotUse.has(occupancyKey)) slotUse.set(occupancyKey,[]);
          slotUse.get(occupancyKey).push(variable);
        }
        const wildcard=model.newBoolVar(key(a,t,role,WILDCARD));
        choices.set(key(a,t,role,WILDCARD),wildcard);
        vars.push(wildcard);
        vacancies[role].push(wildcard);
        model.addEquality(sum(vars),y);
      }
    }
    model.addExactlyOne(possibleSlots);
  }
  for (const vars of slotUse.values()) if (vars.length>1) model.addAtMostOne(vars);
  const base=n+1;
  const objectiveVars=[...vacancies.P,...vacancies.S,...vacancies.V];
  const coefficients=[...vacancies.P.map(()=>base*base),...vacancies.S.map(()=>base),...vacancies.V.map(()=>1)];
  model.minimize(weightedSum(objectiveVars,coefficients));
  const solver = new CpSolver();
  solver.parameters.numSearchWorkers=1;
  const status=await solver.solve(model);
  const name=solver.statusName(status);
  if (!["FEASIBLE","OPTIMAL"].includes(name)) throw new Error("Solver: "+name);
  const rows=tfms.records.map((row,a)=>{
    const t=slots.findIndex((_,index)=>solver.value(chosenSlot.get(key(a,index)))===1);
    if(t<0)throw new Error("El solver no devolvió horario para "+row[0]);
    const {date,time}=slots[t];
    const assigned=ROLES.map((role,r)=>{
      const person=[...options[a][t][r],WILDCARD].find(candidate=>{
        const variable=choices.get(key(a,t,role,candidate));
        return variable && solver.value(variable)===1;
      });
      if(!person)throw new Error("Falta asignación de "+role+" para "+row[0]);
      return person;
    });
    return [row[0],date,time,...assigned,row[6],row[7]];
  });
  const counts={P:0,S:0,V:0};
  for(const row of rows)ROLES.forEach((role,r)=>{if(row[r+3]===WILDCARD)counts[role]++;});
  return {headers:tfms.headers,records:rows,status:name,vacancies:counts};
}
window.CpSatTribunals={solve,buildCandidates};
