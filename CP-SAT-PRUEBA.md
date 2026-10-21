# Prueba integrada CP-SAT

Esta rama es experimental y **no está publicada en GitHub Pages**.

En Codespaces:

```bash
git fetch origin
git switch experiment/cp-sat-browser
npm install
npm run dev
```

Abre el puerto 5173. En la aplicación normal configura las tres fuentes, autoriza Google y entra en **Tribunales**. Pulsa **Probar optimización CP-SAT**: lee los mismos TFMs presentados, Configuración, Tutores y la mayor pestaña Disponibilidad_n. El motor usa las franjas de 60 min, roles y disponibilidad reales. Los puestos no cubiertos muestran `xxxx@xxxxxx`, priorizando Presidente, Secretario y Vocal.

La página debe servirse por Vite durante esta prueba: su cabecera COOP/COEP habilita el runtime multihilo WASM, a diferencia del alojamiento GitHub Pages. Puede requerir configuración adicional de recursos externos y OAuth; no se ha verificado todavía el runtime real con los Google Sheets del usuario. La optimización puede ser lenta en instancias grandes; es una prueba, no producción.

No se envían datos al servidor Vite para optimizarlos: Vite solo sirve archivos estáticos y CP-SAT se ejecuta en el navegador. Los datos de Google Sheets se cargan directamente mediante su API y OAuth.

No se ha hecho merge a main ni incremento de versión pública.
