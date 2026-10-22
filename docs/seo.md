# SEO foundation

## Scope and status

Production rollout was authorized on 22 October 2026. The outbox migration and production worker environment have been configured. Google/Bing webmaster verification and external-host redirects still require the account/domain steps below. The existing Next.js previews, page design, source article titles, analytics, speed monitoring, image optimization, and public caching remain in place. No runtime dependency was added.

Already present: canonical links for main pages and articles, server-rendered content, published-only public reads, RSS, sitemap, robots.txt, article social cards, and a BlogPosting block.

Added/corrected: one typed identity configuration (`content/seo.ts`), page-specific Open Graph/X metadata, `en-IN`/`en_IN`, X site account, stable connected JSON-LD builders, application metadata/manifest, an Apple icon derived from the existing “v.” identity, canonical-host redirects, preview noindex, noindex on utilities, image alt metadata, sitemap partitioning, safe body heading levels, truthful modification timestamps, and a transactional IndexNow outbox.

This is a personal website. The WebSite publisher and article author/publisher are a Person, not Maturate. The supplied affiliation is represented by an Organization with only its existing public name and supplied URL. Existing copy spells the name “Maturate”; its legal name, official logo, organization social profiles, and any employment title were not verified and are omitted. Personal socials are used only for the Person. No Instagram profile was supplied. Product information is retained in configuration for reuse but no Product/SoftwareApplication schema is emitted on these personal pages. No unsupported pricing, platform availability, reviews, or ratings are asserted.

## Reusing the foundation

- Change site identity and static page SEO in `content/seo.ts`. `content/site.ts` reuses it without changing visible copy.
- New public pages call `pageMetadata()` and render exactly one `SeoJsonLd` with `pageGraph()`. Register genuine static public pages in `seo.pages` (and its typed page-name union) for discovery. Add a crawlable link from an existing page.
- Existing articles automatically use `articleMetadata()` and `articleGraph()`, saved publication/modification dates, unique canonical slugs, author-selected image alt text, existing generated preview images, adjacent-article links, and sitemap inclusion. SEO title/description fields remain editable. If both saved descriptions are empty, a deterministic title/author fallback is used; no AI prose is published.
- A future CMS content type needs its own eligibility/publication transition wired to the outbox and sitemap source; helpers alone do not publish or index a page. Never register drafts, private paths, search/filter variants, or empty programmatic pages.
- Article source titles are retained. Browser titles stay capitalized without a full stop; displayed page headings keep the established lowercase/full-stop treatment. Body `#` headings render as H2 to retain one page H1.

## Canonicals and discovery

Primary domain: `https://vibhanshurathod.com/`.

- `https://vibhanshurathod.com/sitemap.xml` remains the submission/discovery URL.
- Up to 45,000 URLs, it is a URL set. Above that it becomes a sitemap index with `/sitemaps/0.xml`, `/sitemaps/1.xml`, etc. Each shard is capped at 45,000 entries, below the 50,000-URL protocol limit. The implementation currently reuses the cached public summary list; at very large scale, move the archive and sitemap data source to paginated database queries to bound server memory.
- Only already-published content is read anonymously. Drafts, future articles, private/auth pages, utility endpoints, and redirects are absent. Static pages omit lastmod because no reliable editorial modification timestamp exists. Articles use their stored updated_at. The migration prevents a no-op save from advancing it.
- Existing tag/path invalidation updates lists, article pages, sitemap/shards, RSS, and preview images on CMS saves without redeploying. Scheduled content becomes public through the existing 60-second revalidation.
- Known alternate application hosts and www have permanent redirects to the apex host. Vercel handles HTTP→HTTPS. Localhost and arbitrary preview deployment hosts are preserved for testing; preview metadata and robots disable indexing.
- The configured private desk URL is never listed in robots, sitemap, JSON-LD, or this document. Authentication/RLS remain the access controls; robots is not security.

The supplied `https://superos.to/founder` and `https://superos.to/vibe` belong to a different host. Their redirects must be configured in the superos.to project, mapping **only those exact paths** permanently to `https://vibhanshurathod.com/`. This repository cannot redirect traffic arriving at that external host. Do not add organization/product domains as alternate personal-domain host aliases.

## IndexNow: production activation after approval

The implementation follows [the official IndexNow protocol](https://www.indexnow.org/documentation). It sends one batch (up to 100 outbox rows plus collection URLs) to `https://api.indexnow.org/indexnow`. No Google Indexing API is used. HTTP 200 means received; 202 means received with key validation pending. Neither means indexed.

1. Review and apply `supabase/migrations/20261022135441_seo_indexnow_outbox.sql` to the existing project before enabling the application changes. Also apply the follow-up `20261022135742_indexnow_static_page_paths.sql` migration to allow the existing About page. The outbox migration creates owner-only RLS outbox rows, worker-only lease/acknowledgement RPCs and rate-limit state, a security-invoker publication trigger, and the modification-timestamp correction. All functions use a fixed search_path and caller privileges; no SECURITY DEFINER is introduced.
2. Run Supabase database advisors against the target project after applying the migration. Remote security/performance advisors were checked after migration. The worker-only control table intentionally has RLS with no client policies; the new ready-queue index is retained despite its initial unused-index informational notice. Existing leaked-password-protection and overlapping authenticated-read-policy warnings are outside this SEO change. Local PostgreSQL tests verify role grants, RLS, trigger behavior, scheduling, leases, and race-safe acknowledgements.
3. Two independent random values were generated in the ignored, mode-0600 `.env.seo.local`: `INDEXNOW_KEY` and `CRON_SECRET`. This file is not automatically loaded by Next.js. Add the values as **Production-only** Vercel environment variables using the dashboard/secure CLI; never paste them into source or logs. You can instead generate new independent values with `openssl rand -hex 32`. Never reuse the verification key as the worker secret.
4. Add `SUPABASE_SERVICE_ROLE_KEY` from the existing Supabase project as a **server-only, Production-only** Vercel variable. This credential is needed only for the worker. Do not prefix it with NEXT_PUBLIC_. Public pages and the CMS continue using the existing public key and owner session. The existing Supabase–Vercel integration already supplies this Production secret; its value was not read, printed, or committed during rollout.
5. Deploy after approval. Confirm `https://vibhanshurathod.com/indexnow-key.txt` returns HTTP 200, plain UTF-8 text containing only INDEXNOW_KEY. Missing/malformed keys return 404. This ownership proof is publicly retrievable by design but excluded from indexing via a response header. The worker fetches and checks that exact canonical resource with redirects disabled before submitting anything.
6. The approved deployment installs a daily Vercel cron at 03:00 UTC (08:30 India) for `/api/indexnow`. The route requires `Authorization: Bearer <CRON_SECRET>`. Next.js `after()` also wakes the worker following authenticated saves/deletions. The daily cadence works with Hobby scheduling limits. A more frequent retry/scheduled-publication poll can be selected on a supporting plan, without changing submission logic. Do not assume second-accurate cron execution.
7. Verify a real publication change after deployment. Check Vercel logs for `IndexNow` outcomes/counts/statuses; keys, URLs and content are never logged. Automated network tests use mocks; real production submission status is verified separately from those tests. Do not create or publish a test article on the real site just for validation.

Changes are queued in the same transaction as the post mutation. Draft-only edits and no-op saves do not enqueue. Scheduled articles wait until their publication timestamp; withdrawing an unseen schedule cancels it. Renames queue the old public URL as removed plus the new public URL. Unpublishing/deleting a formerly public article sends its old URL so engines can observe its removal. Rescheduling a formerly public article notifies removal first and retains a future-publication event. Collections are deduplicated alongside articles.

Claims use row locks, SKIP LOCKED, five-minute leases, and per-path versions. A stale acknowledgement cannot delete a newer update. Crashed workers leave recoverable leases. Submission failures use persisted exponential backoff, honor seconds/date Retry-After and a shared cooldown; no timers run inside a request. After eight transient attempts, or a permanent protocol error, jobs remain with failed=true for review rather than looping indefinitely. Retry due jobs run on the next cron or publication wake; retries are not promised to run exactly at available_at.

For trusted operator monitoring (not a public endpoint):

```sql
select kind, failed, last_status, count(*)
from public.indexnow_jobs group by kind, failed, last_status;
```

After diagnosing and correcting a permanent configuration error, a trusted SQL operator may rearm failed jobs:

```sql
update public.indexnow_jobs
set failed=false, attempts=0, available_at=now(), lease_token=null, lease_until=null
where failed;
```

## Google Search Console — exact manual steps

1. Open [Search Console](https://search.google.com/search-console). Add property → **Domain** → enter `vibhanshurathod.com` (no scheme/path).
2. Copy the unique TXT value Google supplies, typically `google-site-verification=...`.
3. At the authoritative DNS provider, add a TXT record at the apex (`@`, or the provider's equivalent blank host) with that exact value. Keep existing MX/TXT records; append the record rather than replacing the zone. The unique value cannot be determined until you create the property.
4. Return to Google and select Verify after DNS has propagated. Leave the verification record in DNS.
5. In the verified property, Sitemaps → submit `https://vibhanshurathod.com/sitemap.xml`.
6. URL Inspection → inspect the homepage and one already-published article → Test live URL → check canonical, crawlability, and rendered content → Request indexing if appropriate. A request does not guarantee indexing.
7. Use [Rich Results Test](https://search.google.com/test/rich-results) on the deployed About/profile page and a published article. Use [Schema.org Validator](https://validator.schema.org/) for WebSite/Organization/WebPage semantics beyond Google's supported rich-result types. Monitor Pages and Enhancements reports after recrawling.

Alternative: add an HTTPS URL-prefix property and use the HTML-tag method. Set only the token (not the entire tag) as GOOGLE_SITE_VERIFICATION before an approved redeployment. That alternative does not verify the entire domain like the DNS Domain property.

## Bing Webmaster Tools — exact manual steps

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters/). Sign in and select Import from Google Search Console after Google verification; authorize the import and choose this site's property. This path normally avoids an additional DNS record.
2. Alternatively, manually add `https://vibhanshurathod.com/`. Select HTML Meta Tag verification and place the supplied `msvalidate.01` token in BING_SITE_VERIFICATION before an approved redeployment, then Verify. If choosing Bing's DNS/CNAME method instead, copy the exact unique name/target Bing provides to the authoritative DNS zone; there is no universal record value to fabricate here.
3. Sitemaps → submit `https://vibhanshurathod.com/sitemap.xml` (or confirm the imported sitemap is present).
4. Inspect the homepage and one published article with Bing's URL Inspection/Site Scan. Check IndexNow reporting after a confirmed production submission. IndexNow ownership and Bing webmaster ownership are separate checks.

## Validation and remaining external work

Automated checks cover metadata, preview references, schema IDs/escaping, private/preview boundaries, canonical validation, sitemap partitioning/dates, ownership-key responses, IndexNow HTTP outcomes/retries, and local PostgreSQL publication/RLS/concurrency behavior. Production-mode browser checks inspect rendered HTML, canonical/social tags and JSON-LD on the homepage, About, Writing, and a local article fixture; status/redirect behavior, robots/sitemap/key endpoints, mobile layout, and navigation are also checked. Existing analytics imports and social-image renderer are preserved.

Final local result: **67 automated tests, nine browser checks, lint, TypeScript checks, and a clean production build passed**. The homepage social preview PNG was compared byte-for-byte with the existing live preview and is unchanged. The complete SEO configuration is passed only through server-rendered pages; client navigation receives just its link list rather than importing the configuration.

Google/Bing ownership, external schema validation, DNS verification, external-host redirects, and actual indexing require separate confirmation; a deployed page or successful IndexNow receipt is not proof of indexing. Production environment variables and migrations are configured by the approved rollout. Remaining manual inputs are search-console verification values/account access and control of the external superos.to redirect routes. There is no paid provider or second analytics integration to configure.
