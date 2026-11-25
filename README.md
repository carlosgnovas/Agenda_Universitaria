# Agenda Universitaria — Tauri 2.0 · 2026–2030

Aplicación de escritorio para organizar la universidad en **Debian y Windows**: calendario diario/semanal/mensual/anual, clases recurrentes, exámenes, entregas, tareas, asignaturas, calificaciones ponderadas y objetivos de aprobado. Interfaz oscura en español, con colores por asignatura.

> **Estado de esta entrega:** código fuente completo y pruebas automatizadas de cálculo y recurrencias. No se incluyen ejecutables compilados: el entorno en el que se generó no tiene Rust ni acceso a npm. La aplicación **debe compilarse en tu ordenador** con los comandos indicados; la compilación nativa y la sincronización con un proyecto Supabase real no han podido verificarse aquí.

## 1. Primera ejecución (sin Supabase)

1. Instala Node.js 20.19+ o 22.12+ (se recomienda Node 22 LTS) y npm. Instala Rust para el modo de escritorio (véase el apartado correspondiente a cada sistema).
2. Descomprime el proyecto, abre una terminal en esta carpeta y ejecuta:

```bash
npm install
npm run desktop:dev
```

La aplicación se abrirá en una ventana Tauri. Puedes usar todas las funciones desde el primer momento en **modo local**: los datos se guardan en este dispositivo hasta que configures Supabase.

Se crean de entrada las cinco asignaturas que comentaste: AEDII, ACII, Estadística, Lógica Computacional y Sistemas Digitales, con las notas que conocíamos. Puedes modificar o eliminar estos datos cuando quieras. No se inventan fechas de exámenes.

Para abrir solamente la interfaz en un navegador (útil para comprobaciones rápidas):

```bash
npm run dev
# Abre http://localhost:1420
```

## 2. Configurar Supabase para sincronizar Debian y Windows

**No necesitas pagar un servidor ni alojar nada en la Raspberry.** Necesitarás crear un proyecto en [Supabase](https://supabase.com/dashboard/projects).

1. Crea un proyecto, preferentemente en una región de la Unión Europea.
2. Abre **SQL Editor** y ejecuta **una vez** el contenido de `supabase/migrations/20261123000000_agenda.sql`. Crea la tabla `agenda_entries` y las políticas RLS que impiden leer o escribir datos ajenos.
3. Ve a **Project Settings → API Keys** (la ubicación exacta puede cambiar). Copia la URL del proyecto y la **clave pública** `publishable` (o `anon` legacy).
4. Abre la aplicación → **Configuración → Sincronización**, introduce ambos valores y pulsa «Guardar conexión».
5. Crea tu cuenta con correo y contraseña. Dependiendo de la configuración de Supabase Auth, te pedirá confirmar el correo antes de iniciar sesión.
6. Repite el paso 4 e inicia sesión con **la misma cuenta** en el segundo ordenador.

Cuando la nube está vacía, la aplicación transfiere automáticamente las asignaturas locales iniciales. Si ya había datos en Supabase, se mantienen los datos de la nube. Existe una opción explícita «Importar datos locales a la nube» en Configuración para incorporar información local posteriormente.

**Seguridad:** jamás pegues la `service_role key`, `sb_secret_*`, contraseñas de la base de datos ni credenciales administrativas en la aplicación. Usa únicamente una clave pública de cliente. Mantén las políticas RLS activas.

**Sincronización:** cada operación se envía a Supabase y el segundo equipo consulta los cambios al recuperar el foco y, mientras esté abierto, cada 30 segundos. Los cambios pendientes se conservan localmente y se reintentan; si dos equipos editan *exactamente la misma entrada* simultáneamente, prevalece la última escritura que llega al servidor. No se implementa todavía resolución de conflictos por campo.

**Plan gratuito:** los límites y la eventual pausa por inactividad los establece Supabase y pueden cambiar. Si la nube está pausada, la aplicación permite visualizar la caché de ese dispositivo y avisa del error de sincronización.

## 3. Instalación de dependencias en Debian 12/13

Instala Node.js y Rust siguiendo los canales oficiales de cada proyecto. Para Tauri en Debian, instala dependencias de compilación habituales:

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev librsvg2-dev libayatana-appindicator3-dev
```

Instala Rust si no lo tienes:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

Compila e instala el paquete Debian:

```bash
npm install
npm run desktop:build -- --bundles deb
sudo apt install ./src-tauri/target/release/bundle/deb/*.deb
```

## 4. Instalación en Windows 10/11

Necesitas Node.js, Rust (toolchain MSVC), Microsoft C++ Build Tools y WebView2, tal como se indica en la [guía oficial de Tauri](https://v2.tauri.app/start/prerequisites/).

En PowerShell, en la carpeta del proyecto:

```powershell
npm install
npm run desktop:build -- --bundles nsis
```

El instalador `.exe` aparecerá en `src-tauri\target\release\bundle\nsis\`.

**Compilar para Windows desde Debian no se ofrece automáticamente.** Para evitar instalar compiladores en Windows, puedes utilizar el flujo manual `.github/workflows/build-installers.yml` en un repositorio GitHub y descargar el artefacto construido para Windows (sujeto a los permisos y límites de GitHub Actions).

## 5. Reglas académicas y datos iniciales

La ponderación tiene dos niveles: **bloques** (porcentaje en la nota final) y **pruebas** (porcentaje dentro del bloque). Cada bloque puede exigir una media mínima; cada prueba puede exigir también un mínimo individual.

- **AEDII:** 35/30/35, con 6,5 y 2,5 cargados.
- **ACII:** teoría 60% (dos pruebas) y prácticas 40% (dos pruebas); primer práctico 9. La posibilidad de examen global se gestiona creando o modificando bloques/pruebas manualmente, no mediante una conversión automática.
- **Estadística:** 30/30/40, con 8,75 inicial y mínimo 3,5 en cada parcial.
- **Lógica Computacional:** teoría 60%, prácticas 40%; primer práctico 10. **Se ha asumido provisionalmente un reparto igual entre las 3 prácticas**, ya que no se conoce aquí su ponderación individual. Comprueba esta configuración antes de utilizar el resultado como definitivo.
- **Sistemas Digitales:** un examen global del 100%.

El objetivo por defecto es 5/10. Cuando hay varias notas pendientes, el indicador «Objetivo en pendientes» muestra la **misma nota necesaria en todas**, respetando mínimos individuales; no significa que no puedas compensarlas de otras maneras. La aplicación no deduce reglas complejas de recuperación ni interpreta automáticamente guías docentes.

## 6. Funciones y límites actuales

**Incluye:** gestionar cursos, asignaturas y colores, grupos y pruebas de evaluación, notas editables, tareas con prioridad y fecha, eventos y clases recurrentes (diarios, semanales, mensuales o anuales), excepciones en una recurrencia, cuatro vistas de calendario, y sincronización mediante autenticación de Supabase.

**No incluye:** notificaciones, integración con calendarios externos, archivos adjuntos, estadísticas de productividad, importación automatizada de guías docentes ni sincronización completamente offline sin iniciar sesión. Tampoco hay una opción de cambio de tema claro/oscuro: el tema inicial es oscuro tal como pediste.

**Intervalo:** 1 de enero de 2026 a 31 de diciembre de 2030, ambos incluidos. Todos los registros se muestran en la zona horaria local del ordenador. Para que coincidan entre dispositivos, configura la misma zona horaria (por ejemplo Europe/Madrid).

## 7. Estructura del proyecto

- `src/App.tsx`: disposición general y navegación.
- `src/features/calendar/`: calendario y creación/edición de eventos.
- `src/features/subjects/` y `src/features/grades/`: fichas y notas.
- `src/features/tasks/`: tareas.
- `src/features/settings/`: Supabase, cursos y categorías.
- `src/lib/grades.ts`: motor de cálculo puro.
- `src/lib/recurrence.ts`: recurrencias y excepciones.
- `src/lib/useAgenda.ts`: almacenamiento local, autenticación y sincronización.
- `src-tauri/`: envoltura nativa Rust y empaquetado.
- `supabase/migrations/`: esquema SQL de la base de datos.

## 8. Comprobaciones

```bash
npm run check
npm run test:logic
npm run build
```

`test:logic` comprueba ejemplos de notas (incluido el 5,65 de AEDII y el 3,5 de Estadística) y de recurrencias semanales con excepciones.

El código se entrega para desarrollarlo y modificarlo. Está preparado para migrar el almacenamiento a infraestructura propia en un futuro, aunque ese traslado requeriría trabajo adicional en la autenticación y sincronización.

## 9. Instalación sencilla (Debian y Windows)

Consulta **[INSTALACION_FACIL.md](INSTALACION_FACIL.md)**. Incluye el procedimiento para generar instaladores `.deb` y `.exe` automáticamente en GitHub Actions sin instalar compiladores en tus ordenadores, así como los scripts `Instalar-Debian.sh` y `Instalar-Windows.cmd` para compilación local asistida.
