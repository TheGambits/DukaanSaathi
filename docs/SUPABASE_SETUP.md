# Supabase Authentication Setup Guide — Dukaan Saathi

Dukaan Saathi uses Supabase Auth for email/password authentication, registration, session persistence, and password recovery. All shop inventory, bills, and Udhaar records continue to stay in local browser storage.

## Step 1: Create a Supabase project
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose your organization, enter a project name (e.g. `dukaan-saathi`), set a strong database password, and select a region close to India (e.g. **Mumbai `ap-south-1`**).

## Step 2: Open Project Settings / Connect
1. In your Supabase project dashboard, open **Project Settings** → **API Keys** (or click the **Connect** button at the top).

## Step 3: Copy Project URL
1. Copy the **Project URL** (for example: `https://your-project-ref.supabase.co`).

## Step 4: Copy Publishable API Key
1. Copy the **Publishable Key** (`sb_publishable_...`).
2. **Never** copy or expose the `secret` or `service_role` key in frontend code or `.env.local`.

## Step 5: Create `.env.local` in the Vite project root
Create a file named `.env.local` in the root of this repository (next to `package.json`). `.env.local` is ignored by Git via `.gitignore`.

Add your own project's values (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key_here
```

## Step 6: Enable Email authentication in Supabase
1. Go to **Authentication** → **Providers** → **Email**.
2. Ensure **Enable Email provider** is turned **ON**.
3. Configure **Confirm email** as desired (when enabled, new users receive a verification email before signing in; the Dukaan Saathi signup screen handles both modes).

## Step 7: Configure the local development URL
1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to:
   ```text
   http://localhost:5173
   ```

## Step 8: Configure allowed redirect URLs
In **Authentication** → **URL Configuration** → **Redirect URLs**, add:

```text
http://localhost:5173
http://localhost:5173/login
http://localhost:5173/reset-password
```

(Also add your production URLs if deploying, e.g. `https://your-domain.com/reset-password`.)

## Step 9: Restart the development server
After saving `.env.local`, restart Vite so environment variables reload:

```bash
npm run dev
```

## Step 10: Register a new account and test login
1. Open `http://localhost:5173`.
2. Click **Create account** to register with Owner Name, Shop Name, Email, and Password.
3. Verify your email if confirmation is enabled in Supabase.
4. Sign in with your email and password.
5. Confirm that refreshing the browser keeps you logged in, **Forgot password** sends a recovery link to `/reset-password`, and **Logout** returns to `/login` without clearing local shop data.

> Note: No custom SQL tables are required for basic Supabase Auth.
