# AI Stock Analyst

Plataforma de análisis de acciones con IA. Un solo proyecto Next.js, listo para Vercel.

## Deploy en Vercel (5 pasos)

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ai-stock-analyst.git
git push -u origin main
```

### 2. Importar en Vercel
- Ir a vercel.com → Add New Project
- Seleccionar el repo
- **No cambiar nada** — Vercel detecta Next.js automáticamente
- Click en Deploy

### 3. Agregar variables de entorno
En Vercel → tu proyecto → Settings → Environment Variables:

```
FMP_API_KEY         → tu key de financialmodelingprep.com (gratis)
ANTHROPIC_API_KEY   → tu key de console.anthropic.com
```

### 4. Redeploy
Después de agregar las variables → Deployments → Redeploy

### 5. Listo ✓

---

## Obtener las API Keys

**FMP (datos financieros) — GRATIS**
1. Ir a https://financialmodelingprep.com/developer/docs
2. Registrarse → copiar la API key

**Anthropic Claude (análisis IA)**
1. Ir a https://console.anthropic.com
2. API Keys → Create Key
3. Tiene $5 de crédito inicial gratis

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo de variables
cp .env.example .env.local
# Editar .env.local con tus keys

# Correr en local
npm run dev
```

Abrir http://localhost:3000

---

## Páginas

- `/` — Dashboard con índices, gainers/losers, sectores
- `/stock/AAPL` — Análisis completo de cualquier ticker
- `/screener` — Filtrar acciones por sector, market cap, P/E
- `/watchlist` — Lista de seguimiento (guardada en el browser)
