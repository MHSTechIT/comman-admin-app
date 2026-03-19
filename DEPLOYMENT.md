# Deployment Guide: Vercel + Render

This project deploys the **frontend dashboard** on **Vercel** and the **chatbot backend** on **Render**.

---

## 1. Deploy Frontend to Vercel

### Option A: Vercel CLI

```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login

# Deploy from project root
cd "e:\overall dashboard"
vercel

# Production deploy
vercel --prod
```

### Option B: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. Click **Add New** → **Project**.
3. Import your Git repo: `MHSTechIT/comman-admin-app`.
4. **Root Directory:** leave as `.` (project root).
5. **Framework Preset:** Vite (auto-detected).
6. **Environment Variables:** Add these (from your `.env`):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase URL |
   | `VITE_SUPABASE_SERVICE_KEY` | Your Supabase service key |
   | `VITE_SUPABASE_FI_APP_URL` | Fi App Supabase URL |
   | `VITE_SUPABASE_FI_APP_ANON_KEY` | Fi App anon key |
   | `VITE_CHATBOT_API_URL` | **Your Render backend URL** (see step 2) |

7. Click **Deploy**.

Your dashboard will be live at `https://your-project.vercel.app`.

---

## 2. Deploy Chatbot Backend to Render

1. Go to [render.com](https://render.com) and sign in (GitHub).
2. Click **New +** → **Blueprint**.
3. Connect the repo `MHSTechIT/comman-admin-app`.
4. Render will read `render.yaml`. If not using Blueprint:
   - **New +** → **Web Service**
   - Connect repo, set **Root Directory** to `chatbot-backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Runtime:** Python 3

5. **Environment Variables** (Render Dashboard → your service → Environment):

   | Key | Value |
   |-----|-------|
   | `DB_CONNECTION` | `postgresql+psycopg://user:pass@host:5432/db?sslmode=require` |
   | `SUPABASE_URL` | Your Supabase URL |
   | `SUPABASE_KEY` | Your Supabase anon/service key |
   | `CORS_ORIGINS` | `*` (or leave empty to allow vercel.app + onrender.com) |

6. Deploy. Your API will be at `https://chatbot-api-xxxx.onrender.com`.

7. **Update Vercel:** In your Vercel project, add or update:
   - `VITE_CHATBOT_API_URL` = `https://chatbot-api-xxxx.onrender.com`
   - Redeploy the frontend so it points to the live API.

---

## 3. Post-Deploy Checklist

- [ ] Chatbot backend env vars set on Render (`DB_CONNECTION`, `SUPABASE_URL`, `SUPABASE_KEY`)
- [ ] Frontend env vars set on Vercel (all `VITE_*` vars)
- [ ] `VITE_CHATBOT_API_URL` on Vercel points to your Render backend URL
- [ ] Run `fi-app-supabase-rls.sql` in Fi App Supabase if not done already

---

## Optional: Deploy Frontend on Render (Static Site)

If you prefer everything on Render:

1. **New +** → **Static Site**
2. Connect repo, Root Directory: `.`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. Add the same env vars as Vercel.
6. On the chatbot backend, `CORS_ORIGINS` will already allow `*.onrender.com`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Chatbot API returns 404 | Ensure `VITE_CHATBOT_API_URL` has no trailing slash |
| CORS errors | Set `CORS_ORIGINS=*` on Render, or add your Vercel URL to the list |
| Build fails on Vercel | Check all `VITE_*` vars are set; build uses `npm run build` |
| Render backend sleeps | Free tier sleeps after 15 min idle; first request may be slow |
