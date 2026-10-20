# Experimento CP-SAT en navegador

Prueba aislada, sin alumnos ni profesores reales y sin conexión a Google Sheets.
No es todavía un optimizador para producción.

Ejecutar en GitHub Codespaces:

```bash
cd experiments/cp-sat
npm install
npm run dev
```

Abrir en Ports el puerto 5173. Vite añade las cabeceras COOP/COEP necesarias.
Comprobar en la consola `crossOriginIsolated === true`. Pulsa «Resolver».
Se espera que los seis puestos queden representados y que los tres docentes reales
no se repitan en la misma hora. Los otros tres puestos son comodines. El orden
lexicográfico privilegia P sobre S y S sobre V.

**Limitación de publicación:** GitHub Pages no ofrece control directo sobre las
cabeceras necesarias para esta compilación con hilos de WebAssembly. No se ha
probado aún la ejecución real de la compilación WASM desde esta sesión y no se
debe publicar como si fuera compatible con Pages.

Siguiente fase: comprobar POC en Codespaces Chromium/Firefox; estudiar un
compilado WASM sin hilos, alternativa de hosting estático con COOP/COEP o
mantener comparación con backtracking 100% JavaScript.
