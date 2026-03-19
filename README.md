# Diabetes Risk Assessment – Admin Dashboard

React + Vite + Tailwind CSS admin dashboard for managing users who took the Diabetes Risk Assessment. Connects to your existing Supabase project.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_KEY` (use the **service role** key for full read/write access)

3. **Database**
   - The app reads from `user_profiles` and `home_test_bookings`.
   - To enable the **Status** dropdown (Fresh / Pending / Completed), add the `admin_status` column if it doesn’t exist. Run in Supabase SQL Editor:
   ```sql
   -- See supabase_admin_status_migration.sql
   ALTER TABLE user_profiles
   ADD COLUMN IF NOT EXISTS admin_status text DEFAULT 'fresh';
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. http://localhost:5173).

## Features

- **Users table**: All completed assessments (`user_profiles` where `name` is not null)
- **Risk score & level**: Calculated client-side from the same logic as the assessment (0–100, LOW → HIGH)
- **Home test**: “Yes” if a row exists in `home_test_bookings` for that profile; click “Yes” to see booking details in a modal
- **Status**: Dropdown (Fresh / Pending / Completed) stored in `user_profiles.admin_status`
- **Row click**: Opens a detail modal with all assessment answers and human-readable labels
- **Search** by name or phone
- **Sort** by date, name, score, risk level
- **Pagination**: 20 rows per page
- **Auto-refresh**: Data refetches every 30 seconds
- **Export CSV**
- **Responsive** layout (sidebar + table)

## Build

```bash
npm run build
npm run preview   # preview production build
```
