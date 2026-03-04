# Synthera — con Supabase

## 1. Crear tablas en Supabase
Ve a **Supabase Dashboard → SQL Editor** y ejecuta todo el contenido de `supabase_schema.sql`.
Esto crea las tablas y carga los datos de prueba.

## 2. Instalar dependencias
```bash
npm install
```

## 3. Desarrollo local
```bash
npm run dev
```

## 4. Deploy en Vercel

### Opción A — desde GitHub (recomendado)
```bash
git init
git add .
git commit -m "init synthera-db"
# Crea el repo en GitHub y haz push
# En vercel.com → Add New Project → importa el repo
```
En Vercel, añade las variables de entorno:
- `VITE_SUPABASE_URL` = `https://hmuzkfvfqabdvbolpihg.supabase.co`
- `VITE_SUPABASE_KEY` = `sb_publishable_HrcqAqw5YiVzwgD4Gz036g_q0ddoEI7`

> ⚠️ No subas el archivo `.env` a GitHub. El `.gitignore` ya lo excluye.

### Opción B — Vercel CLI
```bash
npm i -g vercel
vercel --prod
# Cuando pregunte por env vars, añade las dos de arriba
```

## Estructura
```
synthera-db/
├── src/
│   ├── App.jsx          ← app completa con Supabase
│   ├── main.jsx
│   └── lib/
│       ├── supabase.js  ← cliente Supabase
│       └── db.js        ← todas las operaciones de BD
├── supabase_schema.sql  ← SQL para crear tablas en Supabase
├── .env                 ← credenciales (NO subir a git)
├── vercel.json
├── package.json
└── index.html
```

## Cómo funciona
- Al cargar la app, se hace un `loadAll()` que trae todos los datos de Supabase
- Cada acción (crear reserva, editar entorno, etc.) actualiza el estado local **y** persiste en Supabase
- El patrón es "optimistic update": la UI responde inmediatamente, Supabase se actualiza en background
