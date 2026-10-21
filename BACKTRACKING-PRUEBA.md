# Prueba del optimizador por backtracking

Rama independiente de `main`. Sin instalación de Node, Vite ni WebAssembly.

## Instrucciones de Codespaces

```bash
git fetch origin
git switch feature/backtracking-tribunales
python3 -m http.server 8000
```

Abrir el puerto 8000 en **Ports** y utilizar la URL HTTPS del Codespace. Como en toda ejecución desde un origen nuevo, debe estar registrado en **Orígenes autorizados de JavaScript** del cliente OAuth en Google Cloud. También puede usarse Live Server con un puerto autorizado.

En Configuración, conectar Google y las tres hojas habituales. Abrir Tribunales, esperar la carga de TFMs presentados y pulsar **Optimizar tribunales**. El botón aleatorio anterior sigue disponible para comparar.

## Contrato

- Intervalo y fechas de Configuración, sin sábados ni domingos; defensas de 60 minutos.
- Selecciona la pestaña Disponibilidad_n de mayor número entre 1, 2 y 3.
- Personas reales: rol habilitado en Tutores; disponibilidad horaria; no tutores del alumno; nadie en dos tribunales en la misma franja; tres docentes distintos por tribunal.
- Una fila por alumno, con fecha/hora y P, S, V. Vacantes: `xxxx@xxxxxx`.
- Prioridad estricta lexicográfica: número de Presidentes vacantes, luego Secretarios, luego Vocales.
- Búsqueda en Web Worker, MRV estático, propagación de ocupación y poda por la mejor solución. Límite de 10 segundos. Se entrega una asignación válida aunque se agote el tiempo, y se informa de si se ha demostrado óptimo.
- No escribe en Sheets ni almacena los datos fuera de memoria del navegador.

## Verificación

El adaptador comprueba todas las asignaciones reales antes de mostrarlas y recalcula los comodines. Se han ejecutado pruebas sintéticas del trabajador para: una franja con profesor compartido; dos franjas distintas; ausencia total de profesores. **Todavía no se ha probado con datos reales ni medido su rendimiento**.

## Límites conocidos

- No se optimizan aún restricciones blandas ni se garantiza que la solución sea óptima cuando termina por tiempo.
- MRV se calcula a partir de la disponibilidad inicial; se puede mejorar con reordenación dinámica y propagación más fuerte.
- No existen restricciones de aulas o simultaneidad de alumnos entre sí: solo se controla el solapamiento de profesores y la composición de los tribunales.
- La aplicación presupone que cada alumno está identificado por una fila en TFMs Presentados.
