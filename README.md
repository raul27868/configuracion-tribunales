# Configuración de tribunales de defensa de TFM

Aplicación web estática de **un solo fichero**, `index.html`, en HTML, CSS y JavaScript nativo. Permite consultar dos fuentes de Google Sheets: alumnos y entregas de TFM, y profesorado (directores y miembros de tribunales). Esta primera fase permite seleccionar pestañas, detectar encabezados y ver los registros; todavía no asigna tribunales.

## Requisitos

- Un navegador actualizado.
- Un proyecto de Google Cloud con Google Sheets API habilitada.
- Un OAuth 2.0 Client ID de tipo **Aplicación web**.
- Una cuenta de Google con acceso de lectura a las hojas privadas que se vayan a consultar.

## Configurar Google Cloud

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto y habilita **Google Sheets API**.
2. Configura la pantalla de consentimiento OAuth. Si la aplicación está en modo de pruebas, añade como usuario de prueba cada cuenta que vaya a autorizarse.
3. Crea un cliente OAuth de tipo **Aplicación web** y añade el origen donde se ejecutará esta página a **Orígenes autorizados de JavaScript**. Para el servidor local recomendado, añade `http://localhost:8000`.
4. Copia el Client ID (no el secreto del cliente) y pégalo en el campo de autorización de la aplicación.

La aplicación solicita únicamente el permiso `https://www.googleapis.com/auth/spreadsheets.readonly`. Cada usuario debe autorizar con una cuenta que tenga acceso a los documentos privados. No hace falta publicar las hojas.

## Ejecutar localmente

Desde la raíz del repositorio, inicia un servidor HTTP estático:

```sh
python3 -m http.server 8000
```

Abre <http://localhost:8000> en el navegador. También se puede usar cualquier otro servidor estático, siempre que su origen esté registrado en el cliente OAuth. No abras el archivo directamente con `file://`, ya que Google Identity Services necesita un origen web autorizado.

1. Introduce el OAuth Client ID y pulsa **Autorizar lectura**; completa el consentimiento de Google.
2. Pega la URL de cada documento de Sheets en su fuente y pulsa **Cargar pestañas**.
3. La primera pestaña se carga automáticamente. Usa el selector para consultar otra; cada fuente conserva su propia pestaña seleccionada mientras la página está abierta.

## Datos y privacidad

- Las URL de los documentos se guardan en `localStorage` de este navegador.
- El Client ID se mantiene en la página y no se guarda localmente.
- El token OAuth se mantiene solo en memoria durante la sesión de la página; no se escribe en `localStorage`, `sessionStorage` ni cookies. Al cerrar o recargar la página será necesario autorizar de nuevo.
- Las hojas se consultan directamente desde el navegador mediante Google Sheets API. El contenido no se envía a un servidor de esta aplicación.

## Estructura

Todo el código de la aplicación (estructura, estilos adaptables, interfaz, OAuth y cliente de Google Sheets API) está integrado en `index.html`. Google Identity Services se carga desde Google como biblioteca externa de autenticación.
