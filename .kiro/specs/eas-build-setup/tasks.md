# Plan de Implementación: EAS Build Setup

## Overview

Configuración de EAS Build para el proyecto SanAlejo (Expo SDK ~54, React Native 0.81.5, `newArchEnabled: true`). El objetivo es habilitar la generación de un APK de Android en la nube sin necesidad de Android Studio ni el SDK de Android instalados localmente.

Este feature es principalmente de configuración de archivos (`app.json`, `eas.json`) y comandos de terminal que el desarrollador ejecuta manualmente. Las tareas de código consisten en modificar/crear los archivos de configuración y un script de verificación; los comandos EAS CLI se documentan como pasos manuales.

## Tasks

- [x] 1. Instalar EAS CLI y autenticarse (pasos manuales)
  - Ejecutar en la terminal: `npm install -g eas-cli`
  - Verificar instalación: `eas --version` (debe mostrar >= 16.0.0)
  - Autenticarse: `eas login` (solicita credenciales de la cuenta de Expo)
  - Si no tienes cuenta, crear una en https://expo.dev/signup
  - Verificar sesión activa: `eas whoami` (debe mostrar el nombre de usuario)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Configurar `app.json` con los campos requeridos por EAS Build
  - [x] 2.1 Agregar `expo.android.package` en `app.json`
    - Añadir el campo `"package": "com.sanalejo.app"` dentro de `expo.android` en `SanAlejo/app.json`
    - El valor debe seguir el formato de dominio inverso `[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+`
    - Verificar que `expo.newArchEnabled` permanece en `true`
    - _Requirements: 2.1, 2.3, 6.1_

  - [ ]* 2.2 Escribir smoke test para validar `app.json`
    - Crear `SanAlejo/__tests__/smoke/easConfig.test.ts`
    - Verificar que `expo.android.package` existe y tiene formato válido (`/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/`)
    - Verificar que `expo.newArchEnabled` es `true`
    - _Requirements: 2.1, 2.3, 6.1_

- [x] 3. Crear el archivo `eas.json` con los perfiles de compilación
  - [x] 3.1 Crear `SanAlejo/eas.json` con los perfiles `preview` y `production`
    - Crear el archivo `SanAlejo/eas.json` con la estructura de perfiles definida en el diseño
    - Perfil `preview`: `distribution: "internal"`, `android.buildType: "apk"`
    - Perfil `production`: `android.buildType: "app-bundle"`
    - Incluir `cli.version: ">= 16.0.0"`
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 3.2 Escribir smoke test para validar `eas.json`
    - Ampliar `SanAlejo/__tests__/smoke/easConfig.test.ts`
    - Verificar que `eas.json` existe y es JSON válido
    - Verificar que el perfil `preview` tiene `android.buildType === "apk"` y `distribution === "internal"`
    - Verificar que el perfil `production` existe
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 4. Checkpoint — Verificar configuración de archivos
  - Ejecutar los smoke tests: `cd SanAlejo && npx jest __tests__/smoke/easConfig.test.ts --run`
  - Verificar manualmente con Node.js:
    - `node -e "const a = require('./app.json'); console.log(a.expo.android.package)"` → debe mostrar `com.sanalejo.app`
    - `node -e "const a = require('./app.json'); console.log(a.expo.newArchEnabled)"` → debe mostrar `true`
    - `node -e "const e = require('./eas.json'); console.log(e.build.preview.android.buildType)"` → debe mostrar `apk`
  - Asegurarse de que todos los tests pasan; preguntar al usuario si surgen dudas.

- [x] 5. Vincular el proyecto con EAS (paso manual)
  - Ejecutar en el directorio `SanAlejo/`: `eas init`
  - EAS CLI creará o vinculará el proyecto con la cuenta de Expo y registrará un `projectId`
  - Tras ejecutar `eas init`, el campo `expo.extra.eas.projectId` se agrega automáticamente en `app.json`
  - Verificar que el UUID fue agregado: `node -e "const a = require('./app.json'); console.log(a.expo.extra?.eas?.projectId)"`
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Actualizar smoke test para validar `projectId` en `app.json`
  - Ampliar `SanAlejo/__tests__/smoke/easConfig.test.ts`
  - Verificar que `expo.extra.eas.projectId` existe y tiene formato UUID válido (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`)
  - _Requirements: 3.2_

- [x] 7. Ejecutar la primera compilación Android y gestionar credenciales (pasos manuales)
  - [x] 7.1 Iniciar la compilación de preview (APK)
    - Ejecutar en `SanAlejo/`: `eas build --platform android --profile preview`
    - En la primera compilación, EAS CLI preguntará por el keystore de firma
    - Seleccionar la opción **"Generate new keystore"** para que EAS gestione las credenciales automáticamente
    - EAS generará el keystore, lo almacenará en los servidores de Expo y firmará el APK
    - _Requirements: 5.1, 5.2, 7.1, 7.2_

  - [x] 7.2 Monitorear la compilación y descargar el APK
    - Mientras la compilación está en progreso, EAS CLI muestra el estado en tiempo real con un enlace al dashboard de Expo
    - Cuando la compilación finalice, EAS CLI mostrará la URL de descarga del APK
    - Descargar el APK desde la URL provista
    - Instalar el APK en un dispositivo Android (API level 24 / Android 7.0 o superior)
    - Si la compilación falla, revisar los logs completos en el dashboard de Expo (URL provista por EAS CLI)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8. Checkpoint final — Verificar checklist completo
  - Ejecutar todos los smoke tests: `cd SanAlejo && npx jest __tests__/smoke/easConfig.test.ts --run`
  - Verificar el checklist completo:
    - `eas --version` muestra >= 16.0.0
    - `eas whoami` muestra el nombre de usuario de Expo
    - `app.json` contiene `expo.android.package` con formato válido
    - `app.json` mantiene `expo.newArchEnabled: true`
    - `app.json` contiene `expo.extra.eas.projectId` (UUID)
    - `eas.json` existe con perfiles `preview` y `production`
    - Build de `preview` completó exitosamente
    - APK descargado e instalable en dispositivo Android (API 24+)
    - Keystore gestionado por EAS visible en https://expo.dev/accounts/<usuario>/projects/SanAlejo/credentials
  - Asegurarse de que todos los tests pasan; preguntar al usuario si surgen dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Los pasos manuales (EAS CLI) requieren conexión a internet y una cuenta de Expo activa
- `eas init` modifica `app.json` automáticamente; hacer commit de ese cambio junto con `eas.json`
- El perfil `production` (AAB) es para distribución futura en Google Play Store; no se compila en este feature
- Si alguna dependencia resulta incompatible con `newArchEnabled: true`, documentar en `design.md` antes de desactivarla
- Los smoke tests en `easConfig.test.ts` validan la configuración estática sin necesidad de ejecutar EAS Build
