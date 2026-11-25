AGENDA UNIVERSITARIA - INSTRUCCIONES DE INSTALACIÓN Y SUPABASE
Versión de proyecto 1.0.0 | Debian y Windows | Calendario 2026-2030
==================================================================

1. IMPORTANTE: QUÉ CONTIENE CADA ZIP

- Este ZIP de código incluye la aplicación Tauri 2.0 y todo lo necesario
  para GENERAR los instaladores. NO contiene archivos .deb, .exe ni .msi
  precompilados. Se necesitan equipos de compilación Linux y Windows.
- El proceso de GitHub Actions incluido puede generar automáticamente un
  SEGUNDO ZIP con instaladores reales:
    Instaladores/Debian/*.deb
    Instaladores/Windows/*.exe
  y este README, además de los scripts SQL para Supabase.
- Si ya tienes la agenda instalada en Debian, no necesitas reinstalarla
  para usar Supabase. Tus datos remotos permanecen en tu proyecto.

2. INSTALACIÓN DE LA APLICACIÓN

Debian 12/13 (64 bits):
  Si dispones de un instalador .deb compilado, ábrelo desde el gestor
  de paquetes o instala desde su carpeta con:
    sudo apt install ./NOMBRE_REAL_DEL_ARCHIVO.deb
  No escribas literalmente el nombre de ejemplo: usa el .deb descargado.

Windows 10/11 (64 bits):
  Ejecuta con doble clic el archivo .exe (NSIS) obtenido de GitHub Actions.
  No es necesario instalar Node.js ni Rust para utilizar la app compilada.
  Windows puede pedir confirmación si no hay firma digital de código.

Alternativa: compilar en tu ordenador usando los scripts incluidos:
  Debian:  bash ./Instalar-Debian.sh
  Windows: doble clic en Instalar-Windows.cmd
  Estos scripts necesitan Internet y herramientas de desarrollo. No son
  instaladores finales precompilados.

3. CONFIGURAR SUPABASE POR PRIMERA VEZ

A. Entra en https://supabase.com/dashboard y crea o abre un proyecto.
B. En el proyecto abre "Connect" o "Project Settings > Data API" y copia
   la URL del proyecto, con forma https://xxxxxxxx.supabase.co.
C. Abre "Project Settings > API Keys" y copia únicamente la clave pública
   publishable (sb_publishable_...) o la clave legada anon.
   NUNCA copies la clave service_role ni una clave secreta a la agenda.
D. En Supabase > SQL Editor > New Query, abre el archivo:
     supabase/migrations/20261123000000_agenda.sql
   Copia todo su contenido, pégalo y pulsa Run.
   Ese SQL crea la tabla agenda_entries, activa la seguridad RLS, crea
   cuatro políticas por usuario y CONCEDE los permisos necesarios.
E. Abre Agenda Universitaria > Configuración > Sincronización con Supabase.
   Introduce URL y clave pública y pulsa "Guardar conexión".
F. Crea una cuenta o inicia sesión con correo y contraseña.
   Si tienes activada la confirmación de email en Supabase, confirma el
   correo antes de acceder. Pulsa "Sincronizar" si es necesario.
G. Comprueba que aparezca "Sincronizado".

4. SI YA TENÍAS SUPABASE CONFIGURADO Y FUNCIONANDO

NO crees otro proyecto, NO borres agenda_entries y NO vuelvas a registrarte
con otro usuario. Usa la MISMA URL, clave pública y cuenta que ya tienes
en el portátil Debian. En Windows instala la app y sigue los pasos E-G.
Tus datos están asociados a la cuenta de usuario, no al instalador.

Si te aparece "Error de conexión" y ya existen tabla y 4 políticas,
en Supabase > SQL Editor ejecuta SOLO este script de permisos:
     supabase/Permisos_Existentes.sql
Contiene:
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.agenda_entries TO authenticated;
Estos permisos no desactivan RLS ni eliminan registros. Si falla, comprueba
también la URL, la clave y la sesión del usuario.

5. CÓMO CREAR UN ZIP CON .DEB Y .EXE SIN COMPILAR EN TU PC

1) Crea un repositorio de GitHub, preferentemente PRIVADO.
2) Sube el contenido de la carpeta agenda-universitaria a la RAÍZ del repo
   (incluida .github/workflows/build-installers.yml). No subas tus claves.
   Es importante subir los archivos, NO el ZIP comprimido sin extraer.
3) En GitHub abre "Actions" > "Generar instaladores de Agenda Universitaria".
4) Pulsa "Run workflow" y ejecuta el flujo sobre la rama principal.
5) Cuando los tres trabajos terminen con éxito, entra en la ejecución y
   descarga el artefacto "Agenda_Universitaria_Instaladores_Debian_Windows".
   Dentro habrá un ZIP real con .deb, .exe, README.txt y SQL.
6) Descomprime ese ZIP, instala en cada equipo y configura Supabase.

La compilación se realiza en los servidores Linux y Windows de GitHub.
Los instaladores deben comprobarse en los sistemas de destino. Si Actions
falla, consulta el paso rojo de la ejecución: no se habrán creado aún.

6. SEGURIDAD Y CONSERVACIÓN DE DATOS

- No compartas contraseñas, JWT, service_role ni secret keys.
- Si ejecutas la app en un segundo equipo, usa la misma cuenta Supabase.
- La app tiene datos locales y modo nube: sincroniza antes de cambiar de PC.
- El instalador no contiene tus notas personales, contraseñas ni claves;
  estas se configuran DESPUÉS de instalar en cada dispositivo.
- RLS protege los registros por usuario. Revisa las políticas si las editas.
- Haz copias periódicas de tus datos importantes en Supabase.
- El plan gratuito puede pausarse por inactividad y tiene límites.

7. AYUDA RÁPIDA

Error "[object Object]": esta entrega mejora la visualización del error.
"Tabla no encontrada": verifica el SQL de creación en el SQL Editor.
"permission denied": ejecuta Permisos_Existentes.sql, si la tabla existe.
"Invalid API key": usa la clave publishable/anon del mismo proyecto.
"Invalid login credentials": revisa el correo, contraseña y confirmación.
"No se sincroniza": pulsa Sincronizar y verifica Internet y la sesión.

Código: React + TypeScript + Tauri 2.0; nube: Supabase / PostgreSQL.
Este paquete contiene código fuente, NO compilaciones nativas verificadas.
