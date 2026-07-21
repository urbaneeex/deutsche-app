# 🇩🇪 Deutschlernen

Una PWA para aprender alemán de verdad: de cero a nativo, con una ruta de
aprendizaje por niveles (estilo Busuu/Duolingo), flashcards de repetición
espaciada por categorías (con generación de tarjetas nuevas por IA a
demanda), situaciones reales y práctica de pronunciación con el micrófono.

La pestaña **Aprender** (`/learn`) es la pantalla principal: eliges un nivel
(A1, A2...) y avanzas por una secuencia de pasos bloqueados que se desbloquean
en orden. Cada paso combina una mini-explicación de gramática, las tarjetas de
vocabulario del tema, una práctica de pronunciación con las frases de ejemplo
y un mini-quiz final. El progreso se guarda por usuario y se muestra como
porcentaje completado de cada nivel.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase** (Auth + Postgres + Storage)
- **Groq API** (recomendado) u **OpenAI** para generar tarjetas, situaciones y feedback de pronunciación
- Web Speech API + MediaRecorder para pronunciación (nativas del navegador, gratis)
- PWA instalable (manifest + service worker propio, sin dependencias externas)

## Puesta en marcha

### 1. Crear el proyecto de Supabase

1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un proyecto nuevo (plan gratuito).
2. En **Project Settings → API** copia `Project URL`, `anon public key` y `service_role key`.
3. Aplica el esquema de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) de una de estas dos formas:
   - Copiando y pegando el archivo en el **SQL Editor** del dashboard, o
   - Añadiendo `DATABASE_URL` a tu `.env.local` (la sacas de **Project Settings → Database**) y ejecutando `npm run db:migrate`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena `.env.local` con las claves de Supabase y, para la generación con IA:

```env
# Groq (recomendado, gratis con límites) — https://console.groq.com/keys
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Alternativa opcional
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Si tienes `GROQ_API_KEY`, la app usa Groq. Si no, intenta OpenAI. Sin ninguna key, todo funciona salvo el botón **✨ Generar** y los consejos de pronunciación por IA.

### 3. Instalar dependencias y cargar contenido semilla

```bash
npm install
npm run db:seed
```

Esto carga el vocabulario A1, las lecciones de gramática y las situaciones
reales que ya vienen escritas en `src/data/seed/`.

### 4. Arrancar la app

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), crea tu cuenta (email +
contraseña) y empieza a aprender.

### 5. Instalarla en tu Android

Con la app en producción (o en `npm run dev` desde el propio móvil en la
misma red), abre la URL en Chrome y usa **⋮ → Añadir a pantalla de inicio**.
Se instalará como una app con icono propio y pantalla completa.

## Estructura del proyecto

```
src/app/            páginas (learn, flashcards, lessons, review, situations, pronunciation)
src/components/      AuthProvider, NavBar, RequireAuth...
src/lib/data/        funciones que leen/escriben en Supabase
src/lib/srs.ts        algoritmo SM-2 de repetición espaciada
src/lib/speech.ts      Web Speech API (síntesis + comparación de pronunciación)
src/data/seed/         contenido semilla en JSON (vocab, gramática, situaciones)
supabase/migrations/   esquema SQL con RLS
scripts/seed.ts        script que carga el contenido semilla en Supabase
```

## Cómo funciona el contenido generado por IA

Las "Tarjetas" (pide un tema, ej. "ropa" o "el médico") y "Situaciones
reales" tienen un botón para generar contenido nuevo. La llamada va a
`/api/generate` (server-side, nunca expone la API key), que pide a Groq u OpenAI
una respuesta en JSON y la guarda en Supabase con `source: "ai"`. Así el
contenido generado queda disponible para siempre sin volver a pagar por él.

## Próximos pasos sugeridos

- Añadir más mazos de vocabulario (A2, B1...) en `src/data/seed/cards.json` y volver a correr `npm run db:seed`.
- Sustituir `speechSynthesis` por audios nativos reales si quieres mejor calidad de pronunciación de referencia.
- Desplegar en Vercel (`vercel deploy`) para tener la PWA accesible desde cualquier sitio.
