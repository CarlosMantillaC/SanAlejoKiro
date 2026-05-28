# Requirements Document

## Introduction

Este feature cubre la configuración de EAS Build (Expo Application Services) para el proyecto SanAlejo, una aplicación React Native / Expo. El objetivo es habilitar la compilación del APK de Android en la nube usando EAS Build, de modo que el desarrollador pueda generar y descargar el archivo APK sin necesidad de tener Android Studio ni el SDK de Android instalados localmente.

El proyecto usa Expo SDK ~54, expo-router ~6, expo-sqlite y React Native 0.81.5 con la nueva arquitectura habilitada (`newArchEnabled: true`).

## Glossary

- **EAS**: Expo Application Services — plataforma en la nube de Expo para compilar, enviar y actualizar aplicaciones.
- **EAS Build**: Servicio de EAS que compila la aplicación en servidores remotos y produce artefactos binarios (APK, AAB, IPA).
- **EAS CLI**: Herramienta de línea de comandos (`eas-cli`) para interactuar con los servicios de EAS.
- **eas.json**: Archivo de configuración de EAS Build que define los perfiles de compilación.
- **app.json**: Archivo de configuración de Expo que define metadatos de la aplicación (nombre, slug, versión, íconos, etc.).
- **APK**: Android Package — formato de archivo instalable para Android.
- **AAB**: Android App Bundle — formato de distribución para Google Play Store.
- **Build Profile**: Configuración nombrada dentro de `eas.json` que define el tipo y las opciones de una compilación (ej. `development`, `preview`, `production`).
- **Internal Distribution**: Modalidad de distribución de EAS Build que permite compartir el APK directamente sin pasar por una tienda de aplicaciones.
- **applicationId**: Identificador único de la aplicación Android (ej. `com.sanalejo.app`), requerido para compilar.
- **Managed Workflow**: Flujo de trabajo de Expo donde la configuración nativa es gestionada por Expo, sin exponer las carpetas `android/` e `ios/` directamente.
- **Developer**: El desarrollador que configura y ejecuta EAS Build para el proyecto SanAlejo.

## Requirements

### Requirement 1: Instalación y autenticación de EAS CLI

**User Story:** Como desarrollador, quiero instalar EAS CLI y autenticarme con mi cuenta de Expo, para poder usar los servicios de EAS Build desde la terminal.

#### Acceptance Criteria

1. THE Developer SHALL instalar `eas-cli` globalmente usando `npm install -g eas-cli`.
2. WHEN el Developer ejecuta `eas login`, THE EAS CLI SHALL solicitar las credenciales de la cuenta de Expo y autenticar al Developer.
3. IF el Developer no tiene una cuenta de Expo, THEN THE EAS CLI SHALL redirigir al Developer a `https://expo.dev/signup` para crear una cuenta.
4. WHEN la autenticación es exitosa, THE EAS CLI SHALL confirmar la sesión activa mostrando el nombre de usuario.

---

### Requirement 2: Configuración del identificador de aplicación Android

**User Story:** Como desarrollador, quiero definir un `applicationId` único para la aplicación Android en `app.json`, para que EAS Build pueda identificar y compilar la aplicación correctamente.

#### Acceptance Criteria

1. THE `app.json` SHALL contener el campo `expo.android.package` con un valor en formato de dominio inverso (ej. `com.sanalejo.app`).
2. WHEN el campo `expo.android.package` está ausente en `app.json`, THE EAS CLI SHALL mostrar un error descriptivo indicando que el campo es requerido antes de compilar.
3. THE valor de `expo.android.package` SHALL ser único y no contener espacios ni caracteres especiales fuera del conjunto `[a-z0-9._]`.

---

### Requirement 3: Inicialización del proyecto en EAS

**User Story:** Como desarrollador, quiero vincular el proyecto SanAlejo con EAS, para que las compilaciones queden asociadas a mi cuenta y proyecto en el dashboard de Expo.

#### Acceptance Criteria

1. WHEN el Developer ejecuta `eas init` en el directorio `SanAlejo/`, THE EAS CLI SHALL crear o vincular el proyecto con la cuenta de Expo y registrar un `projectId` único.
2. WHEN la inicialización es exitosa, THE EAS CLI SHALL agregar el campo `expo.extra.eas.projectId` en `app.json` con el identificador del proyecto.
3. IF el proyecto ya tiene un `projectId` registrado en `app.json`, THEN THE EAS CLI SHALL reutilizar el proyecto existente sin crear uno duplicado.

---

### Requirement 4: Creación del archivo de configuración eas.json

**User Story:** Como desarrollador, quiero tener un archivo `eas.json` con perfiles de compilación definidos, para poder generar un APK de Android con el perfil adecuado según el propósito (pruebas internas o producción).

#### Acceptance Criteria

1. THE `eas.json` SHALL existir en el directorio raíz del proyecto (`SanAlejo/eas.json`).
2. THE `eas.json` SHALL contener al menos un perfil de compilación llamado `preview` configurado para producir un APK de Android con distribución interna (`distribution: "internal"`, `buildType: "apk"`).
3. THE `eas.json` SHALL contener un perfil de compilación llamado `production` configurado para producir un AAB de Android apto para Google Play Store.
4. WHEN el Developer ejecuta `eas build --platform android --profile preview`, THE EAS Build SHALL usar la configuración del perfil `preview` para generar el APK.
5. THE perfil `preview` SHALL especificar `android.buildType: "apk"` para garantizar que el artefacto generado sea un APK instalable directamente.

---

### Requirement 5: Ejecución de la compilación Android y descarga del APK

**User Story:** Como desarrollador, quiero ejecutar una compilación de Android en EAS Build y descargar el APK resultante, para poder instalar y probar la aplicación en un dispositivo físico.

#### Acceptance Criteria

1. WHEN el Developer ejecuta `eas build --platform android --profile preview` en el directorio `SanAlejo/`, THE EAS Build SHALL iniciar una compilación remota en los servidores de Expo.
2. WHILE la compilación está en progreso, THE EAS CLI SHALL mostrar el estado de la compilación en tiempo real con un enlace al dashboard de Expo.
3. WHEN la compilación finaliza exitosamente, THE EAS Build SHALL generar un APK descargable y THE EAS CLI SHALL mostrar la URL de descarga del artefacto.
4. WHEN el Developer accede a la URL de descarga, THE EAS Build SHALL permitir descargar el APK generado.
5. IF la compilación falla, THEN THE EAS CLI SHALL mostrar el mensaje de error y un enlace a los logs completos en el dashboard de Expo.
6. THE APK generado SHALL ser compatible con dispositivos Android con API level 24 (Android 7.0) o superior.

---

### Requirement 6: Compatibilidad con la nueva arquitectura de React Native

**User Story:** Como desarrollador, quiero que la configuración de EAS Build sea compatible con `newArchEnabled: true`, para que el APK generado use la nueva arquitectura de React Native sin errores de compilación.

#### Acceptance Criteria

1. THE `app.json` SHALL mantener el campo `expo.newArchEnabled: true` durante la configuración de EAS Build.
2. WHEN EAS Build compila el proyecto con `newArchEnabled: true`, THE EAS Build SHALL completar la compilación sin errores relacionados con la nueva arquitectura.
3. IF alguna dependencia del proyecto es incompatible con la nueva arquitectura, THEN THE Developer SHALL documentar la incompatibilidad y evaluar desactivar `newArchEnabled` solo como último recurso.

---

### Requirement 7: Gestión de credenciales de firma Android

**User Story:** Como desarrollador, quiero que EAS Build gestione automáticamente las credenciales de firma (keystore) de Android, para no tener que configurar manualmente un keystore local.

#### Acceptance Criteria

1. WHEN el Developer ejecuta la primera compilación de Android, THE EAS Build SHALL ofrecer la opción de generar y gestionar automáticamente el keystore de firma en los servidores de Expo.
2. WHERE el Developer elige la gestión automática de credenciales, THE EAS Build SHALL generar un keystore, almacenarlo de forma segura en los servidores de Expo y usarlo para firmar el APK.
3. THE keystore gestionado por EAS SHALL ser reutilizado en compilaciones posteriores del mismo proyecto para garantizar la consistencia de la firma.
4. IF el Developer prefiere usar un keystore propio, THEN THE EAS CLI SHALL permitir subir un keystore existente mediante el comando `eas credentials`.
