# Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel. Select the Next.js framework and Node.js **24.x** (or supported 22.x).
2. Complete [Supabase setup](setup.md) and add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `CMS_ADMIN_PATH` to Vercel's environment variables. Set them for the intended environments only. Use a separate Supabase project for preview testing if previews need data access.
3. Deploy with the default `npm run build` and Next.js output settings. No static export is used: the CMS and live content require server execution.
4. In Vercel → Project → Settings → Domains add `vibhanshurathod.com`. Set the exact DNS records shown by Vercel at your DNS provider; do not assume fixed IPs. Optionally add `www.vibhanshurathod.com` and redirect it to the apex domain. Wait for domain verification and TLS issuance.
5. Update Supabase Auth's Site URL to `https://vibhanshurathod.com`. Verify canonical URLs, `/sitemap.xml`, `/robots.txt`, `/rss.xml`, and the `/blog` permanent redirects.
6. Sign in at the path configured in `CMS_ADMIN_PATH` and complete the hosted acceptance checks in the setup guide.

`content/site.ts` centralizes the canonical origin. Keep it set to the public domain. Preview deployments should be access-controlled in Vercel and excluded from search indexing using Vercel's preview controls.

No deployment or Supabase project change is performed automatically by this repository. Environment changes require a new Vercel deployment. Writing changes do not.

## Operational notes

Vercel provides automatic DDoS mitigation. Add a per-IP WAF rate-limit rule for Next.js action POST requests and desk form submissions; an environment-configured URL does not replace abuse protection. Match the desk's framework route rather than its configured URL so path rotation keeps the rule effective. Supabase Auth also has its own rate limits. Avoid publishing the configured desk path in robots.txt or public documentation.

Supabase handles database backups according to your plan; export Markdown periodically. Retain the lockfile and run `npm audit` during maintenance. Security headers are in `next.config.ts`. The CSP allows Next.js inline hydration scripts; raw Markdown HTML is disabled independently. Production does not allow script eval. Add new external media providers only after explicitly updating both rendering code and the CSP allowlist.
