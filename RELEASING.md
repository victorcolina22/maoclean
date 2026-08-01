# Forzar actualización de la app (retirar versiones viejas)

La app se distribuye como APK directo (no Play Store), así que un link de
descarga viejo siempre va a poder instalar esa versión vieja — no se puede
invalidar el archivo en sí. Lo que sí se puede hacer es que la app vieja
**deje de funcionar** al abrirla, obligando a actualizar.

Esto se controla desde el documento `config/appVersion` en Firestore
(ver `services/appVersionService.ts` y `app/_layout.tsx`).

## Pasos, cada vez que saques un build que querés que sea el único válido

1. Corré el build:
   ```
   eas build --platform android --profile production
   ```
2. Anotá el **número de build de Android** (`versionCode`) que EAS le asignó
   — sale en el output de la terminal y en el dashboard de
   [expo.dev](https://expo.dev) (detalle del build → "Version code").
3. Copiá el **link de descarga** del build (el mismo que le mandás a la
   gente hoy).
4. En Firebase Console → Firestore Database → documento `config/appVersion`
   (crealo si no existe), seteá:
   ```
   minBuildNumber: <el versionCode del paso 2>
   latestApkUrl: <el link del paso 3>
   ```
5. Listo. Cualquier instalación con un `versionCode` menor al que pusiste va
   a ver una pantalla de "Actualización requerida" bloqueante la próxima vez
   que abra la app, con un botón que descarga la versión nueva.

## Notas

- Esto **no** requiere subir nada a mano en `app.json` — `eas.json` ya tiene
  `"appVersionSource": "remote"`, así que EAS incrementa el `versionCode`
  solo en cada build.
- Si Firestore no responde (sin internet al abrir la app, etc.), el chequeo
  **falla abierto**: deja entrar en vez de bloquear a todos por un problema
  de red. Solo bloquea cuando confirma que la versión instalada es vieja.
- No hay forma de escribir `config/appVersion` desde la app (a propósito,
  ver `firestore.rules`) — se edita siempre a mano en la consola, porque es
  algo poco frecuente y de bajo riesgo hacerlo manualmente.
