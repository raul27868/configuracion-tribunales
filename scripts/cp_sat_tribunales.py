"""Planificador CP-SAT de prueba: entrada y salida JSON, sin acceso a Google Sheets.

Requiere: pip install ortools
Uso: python scripts/cp_sat_tribunales.py entrada.json --output solucion.json
"""
import argparse
import json
from collections import defaultdict
from pathlib import Path

from ortools.sat.python import cp_model

ROLES = ("Presidente", "Secretario", "Vocal")
ROLE_CODES = ("P", "S", "V")
WILDCARD = "xxxx@xxxxxx"


def normalized_email(value):
    return str(value or "").strip().lower()


def validate_input(data):
    slots = data.get("slots", [])
    defenses = data.get("defenses", [])
    teachers = data.get("teachers", [])
    if not slots or not isinstance(slots, list):
        raise ValueError("Debe existir al menos una franja en slots.")
    if not isinstance(defenses, list) or not isinstance(teachers, list):
        raise ValueError("defenses y teachers deben ser listas.")
    slot_ids = [str(s["id"]) for s in slots]
    if len(slot_ids) != len(set(slot_ids)):
        raise ValueError("Identificadores de slots duplicados.")
    defense_ids = [str(d["id"]) for d in defenses]
    if len(defense_ids) != len(set(defense_ids)):
        raise ValueError("Identificadores de defensas duplicados.")
    addresses = [normalized_email(p["email"]) for p in teachers]
    if not all(addresses) or len(addresses) != len(set(addresses)):
        raise ValueError("Correos de profesor vacíos o duplicados.")
    if WILDCARD in addresses:
        raise ValueError("El comodín no puede ser un profesor real.")
    if not all(set(t.get("roles", [])).issubset(set(ROLE_CODES)) for t in teachers):
        raise ValueError("ROL no válido; se admiten P, S, V.")
    if any(str(d.get("student", "")).strip() == "" for d in defenses):
        raise ValueError("Todas las defensas necesitan el correo de alumno.")
    for teacher in teachers:
        if len(set(teacher.get("available_slots", []))) != len(teacher.get("available_slots", [])):
            raise ValueError("Franjas repetidas para " + teacher["email"])
        if not set(map(str, teacher.get("available_slots", []))).issubset(set(slot_ids)):
            raise ValueError("Profesor con disponibilidad fuera de slots: " + teacher["email"])
    return slots, defenses, teachers


def solve(data, time_limit=30, workers=8):
    slots, defenses, teachers = validate_input(data)
    model = cp_model.CpModel()
    n = len(defenses)
    by_teacher = {normalized_email(p["email"]): p for p in teachers}
    assignments = {}
    vacant = {}
    selected = {}

    for a, defense in enumerate(defenses):
        student = normalized_email(defense["student"])
        tutors = {normalized_email(v) for v in defense.get("tutors", []) if v}
        for t, slot in enumerate(slots):
            sid = str(slot["id"])
            selected[a, t] = model.NewBoolVar(f"defense_{a}_slot_{t}")
            for role_index, code in enumerate(ROLE_CODES):
                vacant[a, t, role_index] = model.NewBoolVar(f"vacant_{a}_{t}_{code}")
                eligible = []
                for teacher_index, teacher in enumerate(teachers):
                    address = normalized_email(teacher["email"])
                    if (
                        code in teacher.get("roles", [])
                        and sid in {str(x) for x in teacher.get("available_slots", [])}
                        and address not in tutors
                        and address != student
                    ):
                        x = model.NewBoolVar(f"x_{a}_{t}_{teacher_index}_{code}")
                        assignments[a, t, teacher_index, role_index] = x
                        eligible.append(x)
                # Un puesto se cubre con un profesor real o con el comodín.
                model.Add(sum(eligible) + vacant[a, t, role_index] == selected[a, t])
        model.Add(sum(selected[a, t] for t in range(len(slots))) == 1)

    # Un profesor real no puede aparecer simultáneamente en diferentes
    # tribunales ni ejercer dos roles dentro del mismo tribunal.
    for t in range(len(slots)):
        for p in range(len(teachers)):
            model.Add(sum(var for (a2, t2, p2, _), var in assignments.items()
                          if t2 == t and p2 == p) <= 1)

    role_vacancies = []
    for r in range(3):
        role_vacancies.append(sum(v for (a, t, role), v in vacant.items() if role == r))

    # Base N+1 garantiza estrictamente prioridad P > S > V
    # para N defensas: una vacante P importa más que todas las S y V posibles.
    base = n + 1
    model.Minimize(base * base * role_vacancies[0] + base * role_vacancies[1] + role_vacancies[2])
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit)
    solver.parameters.num_search_workers = int(workers)
    status = solver.Solve(model)
    status_name = solver.StatusName(status)
    output = {
        "status": status_name,
        "optimality_proven": status == cp_model.OPTIMAL,
        "wildcard": WILDCARD,
        "duration_minutes": 60,
        "assignments": [],
        "vacancies": {},
    }
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        output["message"] = "No se encontró ninguna solución dentro del límite; revise configuración y tiempo."
        return output

    for a, defense in enumerate(defenses):
        t = next(t for t in range(len(slots)) if solver.Value(selected[a, t]))
        row = {"id": defense["id"], "Alumno": defense["student"],
               "Fecha": slots[t]["date"], "Hora": slots[t]["time"],
               "Tutor1": (defense.get("tutors", []) + ["", ""])[0],
               "Tutor2": (defense.get("tutors", []) + ["", ""])[1]}
        for r, label in enumerate(ROLES):
            if solver.Value(vacant[a, t, r]):
                row[label] = WILDCARD
            else:
                idx = next(p for (a2, t2, p, r2), var in assignments.items()
                           if a2 == a and t2 == t and r2 == r and solver.Value(var))
                row[label] = teachers[idx]["email"]
        output["assignments"].append(row)

    output["vacancies"] = {label: sum(row[label] == WILDCARD for row in output["assignments"])
                           for label in ROLES}
    output["message"] = ("Óptimo demostrado." if status == cp_model.OPTIMAL else
                         "Solución factible, pero la optimalidad no está demostrada.")
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--time-limit", type=float, default=30)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    result = solve(data, args.time_limit, args.workers)
    serialized = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(serialized + "\n", encoding="utf-8")
    else:
        print(serialized)


if __name__ == "__main__":
    main()
