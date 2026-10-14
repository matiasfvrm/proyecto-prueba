# FigTalent

App web (instalable en el celular) que conecta jóvenes talentos ecuatorianos con academias, clubes y familias.

## Archivos

- `index.html`: la app (perfiles, filtros, registro y contacto).
- `validacion.js`: revisa el nombre, el correo y el WhatsApp antes de enviar.
- `vendor/libphonenumber-max-1.11.4.js`: base de datos de números telefónicos de todos los países (libphonenumber-js, licencia MIT).
- `manifest.webmanifest`, `sw.js`, `icons/`: permiten instalar la app ("Agregar a pantalla de inicio").

## Solicitudes por correo

Los formularios de registro y de contacto envían las solicitudes a **figtalenpft@gmail.com** mediante [FormSubmit](https://formsubmit.co) (gratis, sin servidor propio).

**Primera vez:** después del primer envío, FormSubmit manda un correo de activación a figtalenpft@gmail.com. Hay que abrirlo y confirmar. Desde ese momento todas las solicitudes llegan a esa bandeja.

El envío solo funciona con la página publicada en internet (por ejemplo, con GitHub Pages). No funciona si se abre el archivo `index.html` directamente desde la computadora.

## Qué se verifica

| Campo | Verificación |
|---|---|
| Nombre | Nombre y apellido con solo letras. Rechaza nombres inventados o de prueba ("asdf", "test", "aaa", golpes de teclado). |
| Correo | Revisa el formato, corrige errores de escritura ("gmial.com") y bloquea correos temporales. También consulta el DNS para confirmar que el dominio existe y recibe correos. |
| WhatsApp | Acepta cualquier país. El número tiene que existir en el plan de numeración oficial de ese país. Rechaza teléfonos fijos y números falsos como 0999999999 o 0991234567. |

Límites: desde una página web no es posible confirmar que una persona en particular existe, que el buzón exacto existe o que el número tiene WhatsApp activo. Para eso se necesita un servidor que envíe un código de verificación por correo o por WhatsApp.
