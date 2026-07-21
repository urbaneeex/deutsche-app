# Despliegue en Vercel — Deutschlernen

Guía paso a paso para publicar la app y conectarla a tu dominio (ej. `deutsch.arkapp.com` si el raíz ya está ocupado).

## Requisitos previos

- Cuenta en [vercel.com](https://vercel.com)
- Proyecto Supabase ya creado (el que usas en local)
- Repo en GitHub **recomendado** (Vercel despliega automáticamente en cada push)

---

## 1. Subir el código a GitHub

Si aún no tienes remoto:

```bash
# En github.com crea un repo vacío (ej. deutsch-app)
git add .
git commit -m "App Deutschlernen lista para producción"
git remote add origin git@github.com:TU_USUARIO/deutsch-app.git
git push -u origin main
```

---

## 2. Importar en Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Elige el repo
3. Framework: **Next.js** (detectado solo)
4. **No cambies** Build Command (`npm run build`) ni Output Directory
5. Antes de **Deploy**, abre **Environment Variables** y añade:

| Variable | Entorno | ¿Obligatoria? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Sí (IA + API) |
| `GROQ_API_KEY` | Production, Preview, Development | Sí (si usas Groq) |
| `GROQ_MODEL` | Production, Preview, Development | Opcional (`llama-3.3-70b-versatile`) |
| `OPENAI_API_KEY` | Production, Preview, Development | Solo si no usas Groq |

Copia los valores desde tu `.env.local` local.

**No subas** `DATABASE_URL` a Vercel: solo la usas en tu PC para migraciones.

6. Pulsa **Deploy** y espera ~2 minutos.

Tu app quedará en una URL tipo: `https://deutsch-app-xxxxx.vercel.app`

---

## 3. Base de datos (una sola vez)

Desde **tu máquina**, con `.env.local` apuntando al mismo Supabase de producción:

```bash
npm run db:migrate
npm run db:seed
```

Esto crea tablas y carga vocabulario, lecciones y situaciones.

---

## 4. Supabase Auth (importante)

En [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **Authentication** → **URL Configuration**:

| Campo | Valor |
|---|---|
| **Site URL** | `https://TU-DOMINIO` (ej. `https://deutsch.arkapp.com`) |
| **Redirect URLs** | Añade ambas: |
| | `https://TU-DOMINIO/**` |
| | `https://deutsch-app-xxxxx.vercel.app/**` |

Sin esto el login por email puede fallar en producción.

Opcional: **Authentication → Providers → Email** — confirma si quieres confirmación de email activada o desactivada (en dev a veces se desactiva por rate limit).

---

## 5. Dominio personalizado (arkapp)

Si `arkapp.com` (o tu dominio raíz) ya apunta a otra web, usa un **subdominio**:

1. Vercel → tu proyecto → **Settings** → **Domains**
2. Añade: `deutsch.arkapp.com` (o `app.arkapp.com`, `learn.arkapp.com`, etc.)
3. Vercel te muestra el registro DNS. En tu proveedor (Cloudflare, Namecheap, etc.):

| Tipo | Nombre | Valor |
|---|---|---|
| **CNAME** | `deutsch` | `cname.vercel-dns.com` |

4. Espera propagación DNS (minutos u horas)
5. Vercel activa HTTPS automáticamente
6. Actualiza **Site URL** en Supabase al dominio final

---

## 6. PWA en Android

1. Abre la URL de producción en **Chrome**
2. Menú **⋮** → **Añadir a pantalla de inicio**
3. El service worker solo se registra en producción (`NODE_ENV=production`)

---

## 7. Despliegues siguientes

Con GitHub conectado, cada `git push` a `main` redeploya solo.

Para desplegar desde terminal (alternativa):

```bash
npm i -g vercel@latest
vercel login
vercel --prod
```

Las variables de entorno se configuran en el dashboard o con:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

---

## Checklist rápido

- [ ] Repo en GitHub
- [ ] Proyecto importado en Vercel
- [ ] 4–6 variables de entorno en Vercel
- [ ] Primer deploy OK (`npm run build` pasa)
- [ ] `npm run db:migrate` + `npm run db:seed` ejecutados
- [ ] Site URL + Redirect URLs en Supabase
- [ ] (Opcional) Subdominio CNAME → Vercel
- [ ] Probar registro, login, tarjetas e IA en la URL de producción

---

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Pantalla en blanco / error Supabase | Faltan `NEXT_PUBLIC_*` en Vercel o redeploy tras añadirlas |
| Login no funciona | Revisa Redirect URLs en Supabase |
| IA no genera | Falta `GROQ_API_KEY` o `SUPABASE_SERVICE_ROLE_KEY` en Vercel |
| No hay contenido | Ejecuta `npm run db:seed` contra el Supabase de prod |
| PWA no instala en dev | Normal: instala solo en la URL de producción |
