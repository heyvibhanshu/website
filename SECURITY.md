# Security

Please avoid public issues containing credentials or private content. Contact the maintainer at hey@vibhanshurathod.com for sensitive reports.

- Supabase Row Level Security is the authorization boundary. Public reads allow only `published` posts whose publication date has arrived. Drafts and scheduled posts remain owner-only.
- One explicitly authorized auth UUID lives in `site_owner`. Only a trusted SQL operator can change authorization. The `is_site_owner` function uses caller privileges, an empty search path and qualified names. Its lookup respects RLS, and anonymous users cannot execute it.
- Every private page and every content/upload mutation checks the current user with Supabase Auth and checks owner authorization. Mutation input is validated with Zod. No service-role key is used.
- Public content caches contain only results from a separate anonymous Supabase client, never the owner's cookies. CMS mutations immediately expire the tagged public cache, including unpublished articles. Private routes are dynamic and return private/no-store cache headers.
- Next.js Server Actions enforce same-origin requests. The app does not expose unauthenticated write APIs. Supabase SSR refreshes cookies on CMS routes.
- The desk path is required server-side configuration with no built-in default. Unknown paths return 404; robots.txt does not publish the configured address. A URL is not a security boundary: owner authorization and platform rate limiting protect access. Changing the URL does not protect against DDoS.
- Raw Markdown HTML is disabled except for bare underline pairs, which are converted to safe syntax nodes without interpreting HTML attributes; JavaScript URLs and unapproved images are blocked. Embeds accept only validated YouTube IDs. JSON-LD and RSS escape user-authored values.
- Images are public at upload time; do not upload private material. Only the owner can write to storage; size/MIME/signatures are checked server-side and bucket limits also apply. Deleting a post retains potentially shared images.
- `.env*`, keys, dependency folders, deployment metadata and generated files are ignored. `.env.example` contains placeholders only. Keep Supabase credentials and private writing out of Git, screenshots, tests and issue reports.

The application requires a configured project and the supplied migration to enforce these policies. The local unconfigured mode is read-only and cannot log in or save content.
