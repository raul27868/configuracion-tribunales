# Prototipo CP-SAT — tribunales TFM

Esta prueba de concepto **no está conectada todavía a la interfaz HTML ni a Google Sheets**.
Trabaja sobre JSON generado externamente y no incluye datos personales reales.

## Ejecución en GitHub Codespaces

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install ortools
python scripts/cp_sat_tribunales.py examples/cp-sat-ejemplo.json --output /tmp/solucion.json
cat /tmp/solucion.json
```

## Contrato de entrada

- `slots`: lista de franjas permitidas de 60 minutos, con `id`, `date` (YYYY-MM-DD), `time` (HH:MM). El exportador de Sheets debe quitar sábados y domingos y ajustar el rango de Configuración.
- `defenses`: TFM presentados, con `id`, `student` (correo) y `tutors` (hasta dos correos).
- `teachers`: lista de profesores con `email`, `roles` (valores P,S,V) y `available_slots` (identificadores de franjas correspondientes a `Disponibilidad_n` de índice máximo).

El formato de JSON es deliberadamente independiente de Google Sheets: habrá que implementar el conversor, sin publicar datos personales.

## Restricciones

Para cada defensa: una franja; un profesor real distinto para P, S y V, o el comodín `xxxx@xxxxxx` para cada puesto sin cubrir.

Cada profesor real solo puede ocupar un puesto por franja en todas las defensas, debe tener el rol, estar disponible durante los 60 minutos y no ser tutor del alumno. El comodín es reutilizable.

**Optimización lexicográfica estricta** de vacantes `(presidentes, secretarios, vocales)`. Se usa una suma ponderada exacta con base `N+1` (N=defensas): `(N+1)^2 * vacantes_P + (N+1) * vacantes_S + vacantes_V`. La prioridad es correcta para los límites de 0 a N.

Un estado `FEASIBLE` devuelve la mejor solución encontrada, **sin garantía de optimalidad**. `OPTIMAL` demuestra que el vector es óptimo. No hay preferencias blandas implementadas todavía.

## Limitaciones de esta primera prueba

- No existe todavía un botón CP-SAT en la página pública.
- No se comprueba la asistencia/disponibilidad de los tutores: únicamente se prohíbe que formen parte del tribunal que dirigen.
- No se incorporan descansos, festivos, preferencias o carga equilibrada.
- No se introducen datos de alumnos reales en el repositorio.
- Es necesario instalar OR-Tools en un entorno Python (Codespaces o servidor); GitHub Pages no ejecuta Python.
- Pendiente ejecutar pruebas reales con OR-Tools y contrastar resultados con un verificador independiente.
