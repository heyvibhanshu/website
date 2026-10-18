# Supabase setup

No external service is created or modified by running this application. Configure your own Supabase project before using the CMS.

1. Create a Supabase project. In its SQL editor, run `supabase/migrations/202610180001_notebook.sql`. Alternatively link the Supabase CLI to your project and run `supabase db push` after reviewing the migration. Apply each migration once.
2. Under Authentication → Providers, enable Email/password and **disable new user signups**. Use Authentication → Users to create your owner account with a strong unique password. Confirm its email. This app deliberately provides no public signup or password reset flow; manage recovery through Supabase.
3. Copy the account's UUID, then run the following in the SQL editor, replacing the placeholder locally. Do not commit the resulting personal configuration:

```sql
insert into public.site_owner (singleton, user_id)
values (true, 'YOUR-AUTH-USER-UUID')
on conflict (singleton) do update set user_id = excluded.user_id;
```

The table accepts one owner only. Authenticated users cannot change it. Changing this row revokes the previous owner's content and storage access immediately, independent of existing sessions.

4. Copy the project URL and **publishable key** from Project Settings → API into `.env.local`. Use exactly the variable names in `.env.example`. A legacy public anon key also works. **Never use a secret or service-role key.** None is required by this app.
5. Set Authentication → URL Configuration → Site URL to your production origin. Add `http://localhost:3000` for local development if needed. Password sign-in has no redirect callback route. Review Supabase's auth rate limits and abuse protection before publishing.
6. Restart the application. Visit `/cms-admin`, sign in, and create your first draft.

## Storage

The migration creates the public `article-images` bucket. It accepts PNG, JPEG and WebP files up to 5 MB. Only the owner can insert or delete objects. Files use immutable UUID paths beneath the owner's UUID. The server verifies size, MIME type and file signature before upload. SVG and HTML uploads are rejected.

**All uploads are publicly accessible immediately, including images inserted into drafts.** This bucket is only for assets intended for public publication. Draft Markdown and metadata stay private. Removing a post does not delete image files, since other articles may reference them; remove unused assets through Supabase Storage after checking references. Unpublishing an article does not revoke previously public images.

## Hosted acceptance checks

After connecting a real project:

- Sign in as the authorized owner; create, save, reload, edit, publish, unpublish and delete a post.
- Sign out and verify draft URLs return 404, including metadata. Check published posts in the homepage, year archive, RSS and sitemap.
- Set a future publication date; verify the article stays private until then.
- Attempt database reads and writes using an unrelated authenticated test account. It must see only already-published articles and fail every mutation and upload.
- Verify an anonymous client cannot insert/update/delete posts or storage objects.
- Upload a valid image and check its public URL. Check rejection of a renamed non-image and an oversized upload.
- Verify slug collisions show a friendly error and existing published slugs disappear after rename.
- Verify expired sessions refresh and unauthorized users cannot load the editor or invoke its actions.

## Content availability

Public routes query with an anonymous client and explicit published/date filters. They use uncached server rendering so publish, unpublish, delete and scheduling take effect on the next request without a deployment or webhook. Server actions also revalidate affected paths. Errors from a configured backend show a retry page instead of pretending the archive is empty. Do not configure an external CDN to cache HTML, private responses, RSS or the sitemap.
