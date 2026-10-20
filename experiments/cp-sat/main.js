import { CpModel, CpSolver, sum, weightedSum } from "or-tools-wasm/cp-sat";
const output = document.querySelector("#output");
const roles = ["P", "S", "V"];
const teachers = [
  { email: "presidente@ejemplo.es", roles: ["P"] },
  { email: "secretario@ejemplo.es", roles: ["S"] },
  { email: "vocal@ejemplo.es", roles: ["V"] },
];
const students = ["alumno1@ejemplo.es", "alumno2@ejemplo.es"];
const wildcard = "xxxx@xxxxxx";
document.querySelector("#solve").addEventListener("click", async () => {
  output.textContent = "Preparando modelo CP-SAT…";
  try {
    if (!crossOriginIsolated) throw new Error("Faltan cabeceras COOP/COEP: GitHub Pages no las permite configurar directamente. Ejecuta esta prueba con Vite.");
    const model = new CpModel();
    const choices = new Map();
    const vacant = [];
    for (const student of students) {
      for (const role of roles) {
        const possible = teachers.filter(teacher => teacher.roles.includes(role));
        const vars = [];
        for (const teacher of possible) {
          const variable = model.newBoolVar(student + "_" + role + "_" + teacher.email);
          choices.set(student + "|" + role + "|" + teacher.email, variable);
          vars.push(variable);
        }
        const empty = model.newBoolVar(student + "_" + role + "_comodin");
        choices.set(student + "|" + role + "|" + wildcard, empty);
        vacant.push({ role, variable: empty });
        model.addExactlyOne([...vars, empty]);
      }
    }
    // Una persona real no puede estar en dos tribunales a la misma hora.
    for (const teacher of teachers) {
      const occupied = students.flatMap(student => roles.map(role =>
        choices.get(student + "|" + role + "|" + teacher.email)).filter(Boolean));
      model.addAtMostOne(occupied);
    }
    // Prioridad estricta P>S>V: para n alumnos, el peso de P domina todas las vacantes inferiores.
    const base = students.length + 1;
    const score = weightedSum(vacant.map(item => item.variable),
      vacant.map(item => item.role === "P" ? base * base : item.role === "S" ? base : 1));
    model.minimize(score);
    const solver = new CpSolver();
    solver.parameters.numSearchWorkers = 1;
    const status = await solver.solve(model);
    const statusName = solver.statusName(status);
    if (!["OPTIMAL", "FEASIBLE"].includes(statusName)) throw new Error("No se encontró solución: " + statusName);
    const assigned = students.map(student => Object.fromEntries(roles.map(role => {
      const found = [...teachers.map(t => t.email), wildcard].find(email => {
        const variable = choices.get(student + "|" + role + "|" + email);
        return variable && solver.value(variable) === 1;
      });
      return [role, found];
    })));
    output.textContent = JSON.stringify({ status: statusName, assignment: assigned, score: solver.objectiveValue() }, null, 2);
  } catch (error) {
    output.textContent = "Error: " + error.message;
    console.error(error);
  }
});
