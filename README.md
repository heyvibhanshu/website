# A personal notebook

[Vibhanshu Rathod](https://vibhanshurathod.com)’s personal website. Next.js App Router, TypeScript, Tailwind CSS, Geist, Newsreader, and a small Supabase writing desk.

## Run locally

Use Node.js **22 or newer** (24 LTS recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Without environment variables, the public pages show a genuine empty writing archive and `/cms-admin` explains setup. With Supabase configured, all public writing comes from the database. No sample articles are published.

## Publish your first article

1. Follow [Supabase setup](docs/setup.md): apply the migration, create your account, and authorize its UUID in the database.
2. Open `/cms-admin` and sign in with your owner email and password.
3. Choose **New article**, write Markdown, and **Save draft**. The slug is suggested from the title and can be edited.
4. Add images with meaningful alt text and optional captions. Check the preview.
5. Choose **Publish article**. Leave the date blank for immediate publication or choose a future date to schedule it.

Return to the writing desk to edit, unpublish, or permanently delete an article after confirmation. `/admin` redirects to `/cms-admin`. Private routes are absent from navigation and marked `noindex`.

## Edit the site

- `content/site.ts`: greeting, homepage copy, navigation, domain, contact links, SEO defaults. Add the exact LinkedIn URL here when available; the link stays hidden until configured.
- `content/about.ts`: introduction, About sections, photograph and alt text.
- `public/portrait-placeholder.svg`: an explicitly labeled local placeholder. Replace with your real photo and update the configuration.
- `app/globals.css`: typography, spacing and color tokens.
- `supabase/migrations/`: schema, owner authorization, RLS, storage.

[Deployment and custom domain](docs/deployment.md) · [Writing guide](docs/writing.md) · [Security model](SECURITY.md)

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
# With npm run start running in another terminal:
npx playwright install chromium
npx playwright test
```

Browser tests cover the unconfigured public site, responsive layouts, route boundaries, redirects, RSS and sitemap. Database tests exercise the migration against an isolated PostgreSQL engine with stubbed Supabase auth/storage schemas. The real hosted auth and storage flow additionally requires the connected project; see setup for the acceptance checklist.

## License

[MIT](LICENSE). Credentials, local environment files, private writing and generated build output do not belong in this repository.
