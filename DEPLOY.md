# Orderistan frontend on Cloudflare (Workers)

1. Open `.env.production` and put your Vercel backend URL in `VITE_API_URL` (e.g. https://orderistan-api.vercel.app).
2. Deploy:
   - GitHub + Cloudflare Workers Builds: Build command `npm run build`, Deploy command `npx wrangler deploy`
   - or from this folder: `npm install && npm run build && npx wrangler deploy`
   (Cloudflare build variables also work: add VITE_API_URL there instead of the file.)
3. In Vercel (backend) set ALLOWED_ORIGINS = your exact frontend URL, e.g. https://orderistan-complete.nasirsaeed6767.workers.dev, then redeploy backend.
4. Test: open the site, sign up/log in. If the browser console shows a CORS error, step 3 is wrong.
