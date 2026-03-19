# Render Setup: Chatbot Backend Environment Variables

The Chatbot backend needs these environment variables in Render for documents and leads to work.

## Add in Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Open your **chatbot-api** service (or create it from the Blueprint)
3. Go to **Environment** in the left sidebar
4. Add these variables:

### Required Variables

Add these in Render Dashboard → chatbot-api → Environment. Copy values from `chatbot-backend/.env`:

| Key | Where to get the value |
|-----|------------------------|
| **DB_CONNECTION** | `chatbot-backend/.env` (or Supabase → Project `mktzrhqaxxclisxckmed` → Settings → Database → URI; change `postgresql://` to `postgresql+psycopg://`) |
| **SUPABASE_KEY** | `chatbot-backend/.env` (or Supabase → Settings → API → anon key) |

**Note:** `SUPABASE_URL` is already set in `render.yaml`.

## After Adding

1. Click **Save Changes**
2. Render will automatically redeploy the service
3. Copy your service URL (e.g. `https://chatbot-api-xxxx.onrender.com`)
4. Add to **Vercel** → Project Settings → Environment Variables:
   - `VITE_CHATBOT_API_URL` = your Render URL
5. Redeploy the Vercel frontend

## Verify

- Visit `https://your-chatbot-api.onrender.com/` – should return `{"status":"Chatbot API is running"}`
- The Chatbot Admin module in the dashboard should load leads and documents once the frontend is pointing to this URL.
