# Configuración de tribunales de defensa de TFM

Aplicación web estática de **un solo fichero**, `index.html`, en HTML, CSS y JavaScript nativo. Permite configurar tres fuentes de Google Sheets y consultar vistas de Tutores, Alumnos, TFMs y Disponibilidad. La versión visible de la aplicación se indica en la cabecera; es independiente de la versión del fichero de configuración.

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
2. En Configuración, abre la subpestaña de cada fuente, pega la URL del documento correspondiente y pulsa **Cargar pestañas**.
3. Se carga la pestaña guardada o, si no hay una selección previa, la primera. Usa el selector para consultar otra; cada fuente conserva su propia selección al cambiar entre subpestañas.
4. Abre **Tutores**, **Alumnos**, **TFMs** o **Disponibilidad** en la navegación superior. Las tres primeras vistas usan las pestañas fijas indicadas más adelante; Disponibilidad presenta por separado las pestañas `Disponibilidad_1`, `Disponibilidad_2` y `Disponibilidad_3` que existan.

## Vistas de consulta

- **Tutores** lee `Tutores` del documento de Profesorado y muestra: `correo`, `apellidos`, `nombre`, `correo2`, `Doctorado`, `DNI`, `FIGURA LABORAL`, `ROL`, `Activo`.
- **Alumnos** lee `Alumnos` del documento de Alumnos y entregas y muestra: `CORREO`, `GRUPO`, `NOMBRE COMPLETO`, `DOCUMENTO`, `_CORREO`.
- **TFMs** lee `asignacion alumno-profesor` del documento de Alumnos y entregas y muestra: `e-mail alumno`, `GRUPO`, `alumno`, `e-mail-profesor`, `profesor`, `e-mail profesor2`, `profesor2`, `Doctor`, `tema`, `EMAIL_SENT`, `tribunal`, `nota_1`, `nota_2`, `nota_3`, `Observaciones`.
- **Disponibilidad** lee del documento Otros Datos cada una de las pestañas anteriores que exista y presenta todas sus columnas en tablas independientes.

Los encabezados requeridos de Tutores, Alumnos y TFMs se comparan sin distinguir mayúsculas ni espacios sobrantes; se muestran en el orden especificado. Si falta una pestaña o columna requerida, la vista muestra un error explícito. Estas tablas son vistas de lectura y sus datos no se guardan en el fichero de configuración ni en `localStorage`.

## Guardar y cargar la configuración

En la pestaña **Configuración**, usa **Descargar Configuración** para guardar los ajustes como `MBID_TFMs_Edicion.json`, o **Cargar Configuración** para recuperar un fichero JSON guardado previamente. La configuración incluye:

- El OAuth Client ID.
- La URL de cada documento de Sheets.
- El identificador y el nombre de la pestaña seleccionada para cada fuente.

El JSON tiene la versión `2` e incluye alumnos y entregas, profesorado y Otros Datos. Las configuraciones de versión `1` se aceptan y migran automáticamente; la fuente Otros Datos queda vacía. La versión visible de la aplicación (actualmente `1.2.0`) es independiente. Al cargar un fichero, la página valida su estructura antes de aplicar los cambios. Después de autorizar Google, abre la subpestaña de cada fuente y pulsa **Cargar pestañas**: se restaurará la selección si la pestaña sigue existiendo. Si ya no existe, la página lo indicará y permitirá elegir otra. La configuración también se guarda automáticamente en el almacenamiento local del navegador.

## Datos y privacidad

- El Client ID y la configuración de las fuentes se guardan en `localStorage` de este navegador y en el fichero JSON descargado. El Client ID identifica la aplicación OAuth; no incluyas secretos de cliente.
- El token OAuth se mantiene solo en memoria durante la sesión de la página; no se escribe en `localStorage`, `sessionStorage` ni cookies. Al cerrar o recargar la página será necesario autorizar de nuevo.
- Ni los tokens ni los datos leídos de las hojas se guardan en el JSON de configuración.
- Las hojas se consultan directamente desde el navegador mediante Google Sheets API. El contenido no se envía a un servidor de esta aplicación.

## Estructura

Todo el código de la aplicación (estructura, estilos adaptables, interfaz, OAuth y cliente de Google Sheets API) está integrado en `index.html`. Google Identity Services se carga desde Google como biblioteca externa de autenticación.
