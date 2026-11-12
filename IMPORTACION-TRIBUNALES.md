# Importación de tribunales y fechas/horas bloqueadas (experimental)

La rama procede de `feature/backtracking-tribunales`. No se ha integrado en `main`.

## Uso
1. Abrir «Tribunales» y cargar los TFMs Presentados desde Google Sheets.
2. «Importar Tribunales»: escoger CSV con cabeceras `Alumno;Fecha;Hora;Presidente;Secretario;Vocal;Tutor1;Tutor2` (acepta también delimitador coma).
3. El CSV se asocia **por correo Alumno**; se conservan Tutor1/Tutor2 del origen de Google Sheets. Filas desconocidas o duplicadas se rechazan. Se admiten CSV parciales para visualización.
4. Marcar «Fijar alumno, fecha y hora importados al optimizar» si se desea impedir que cambien los horarios comunicados. Para bloquear todos los horarios, el archivo debe contener todos los alumnos actuales con fecha y hora.
5. Pulsar «Optimizar tribunales». El optimizador vuelve a determinar Presidente, Secretario y Vocal, respetando roles, disponibilidad, tutores, solapamientos y las franjas bloqueadas. Los miembros importados **no** se consideran asignaciones fijas; pueden cambiar. Las vacantes aparecen como `xxxx@xxxxxx`.
6. «Descargar CSV»: exportar la tabla de Tribunales que se muestra (UTF-8 BOM, separador punto y coma).

Los CSV se procesan únicamente en el navegador. Nada se guarda en Google Sheets; al recargar la página se pierde el estado en memoria. La importación no implica que los integrantes anteriores estén confirmados.

## Límites y riesgos
- Las fechas bloqueadas deben pertenecer al calendario y horario de Configuración (fechas YYYY-MM-DD o DD/MM/YYYY; horas HH:MM). Si no encajan, se detiene la optimización y se indica el alumno afectado.
- No se realiza una comprobación de que los miembros importados cumplan las restricciones **hasta volver a optimizar**; las filas importadas son datos de referencia, no una solución verificada.
- La rama remota base todavía no contenía un botón «Descargar CSV»; se añade en esta rama. Si la copia local del usuario ya tiene un exportador CSV propio, resolver la integración para no crear dos botones.
- No se ha ejecutado la aplicación contra Google Sheets reales ni desde navegador con OAuth en esta sesión.

## Pruebas
Comprobadas: sintaxis JS, importación CSV, asociación de alumnos por correo independientemente del orden, y búsqueda con dos alumnos cuyas franjas están bloqueadas en distinto orden. Pendiente prueba funcional de navegador y regresión con 47 alumnos.
