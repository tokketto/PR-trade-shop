# Parmigiano Reggiano Trade Shop

## Deploy to Vercel in 5 steps

### 1. Install dependencies locally (to test)
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 2. Push to GitHub
- Create a new repo on github.com (private recommended)
- Push this folder to it

### 3. Connect to Vercel
- Go to vercel.com → Add New Project
- Import your GitHub repo
- Vercel auto-detects Next.js — no config needed

### 4. Add your environment variable
In the Vercel dashboard → Settings → Environment Variables, add:

```
Name:  PARTNER_CODES
Value: Milano Foods:YOUR-CODE-HERE,Roma Distributors:ROM-XXXX,Admin:YOUR-ADMIN-CODE
```

Format: `Partner Name:CODE` separated by commas.
**Never prefix with NEXT_PUBLIC_ or codes will be exposed.**

### 5. Redeploy
Vercel → Deployments → Redeploy. Done.

---

## Adding / changing partners
1. Go to Vercel → Settings → Environment Variables
2. Edit `PARTNER_CODES`
3. Redeploy (takes ~30 seconds)

## Local development
Create `.env.local` in the root (already gitignored):
```
PARTNER_CODES=Milano Foods:MIL-2026,Roma Distributors:ROM-7734,Admin:ADMIN-PR2026
```
