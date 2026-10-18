import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
const owner = "11111111-1111-4111-8111-111111111111";
const stranger = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
async function asRole<T>(
  role: "anon" | "authenticated",
  uid: string,
  fn: () => Promise<T>,
) {
  await db.exec(
    `set role ${role}; select set_config('request.jwt.claim.sub', '${uid}', false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
    grant usage on schema public, auth, storage to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/'); $$;
    insert into auth.users values ('${owner}'), ('${stranger}');
  `);
  const migrationDir = new URL("../supabase/migrations/", import.meta.url);
  for (const filename of (await readdir(migrationDir)).filter(name => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(filename, migrationDir), "utf8"));
  }
  await db.exec(`insert into public.site_owner values (true, '${owner}');
    insert into public.posts (slug,title,content,status,published_at) values
      ('draft','Private draft','secret draft','draft',null),
      ('published','Published writing','public writing','published',now()-interval '1 day'),
      ('scheduled','Future writing','future secret','published',now()+interval '1 day');`);
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("PostgreSQL row level security", () => {
  it("uses caller privileges and blocks anonymous owner RPC access", async () => {
    const result = await db.query("select prosecdef from pg_proc where oid = 'public.is_site_owner()'::regprocedure");
    expect(result.rows).toEqual([{ prosecdef: false }]);
    await asRole('anon', '', async () => {
      await expect(db.query('select public.is_site_owner()')).rejects.toThrow();
    });
  });

  it("exposes only already-published writing to anonymous and unrelated users", async () => {
    for (const [role, uid] of [
      ["anon", ""],
      ["authenticated", stranger],
    ] as const) {
      const result = await asRole(role, uid, () =>
        db.query<{ slug: string }>("select slug from public.posts"),
      );
      expect(result.rows.map((r) => r.slug)).toEqual(["published"]);
    }
  });
  it("allows the owner to read all states", async () => {
    const result = await asRole("authenticated", owner, () =>
      db.query("select * from public.posts"),
    );
    expect(result.rows).toHaveLength(3);
  });
  it("blocks non-owner mutations and owner escalation", async () => {
    await asRole("authenticated", stranger, async () => {
      await expect(
        db.exec(
          "insert into public.posts (slug,title) values ('intrusion','Intrusion')",
        ),
      ).rejects.toThrow();
      expect(
        (await db.query("update public.posts set title='Hacked' returning id"))
          .rows,
      ).toHaveLength(0);
      expect(
        (await db.query("delete from public.posts returning id")).rows,
      ).toHaveLength(0);
      await expect(
        db.exec(`update public.site_owner set user_id='${stranger}'`),
      ).rejects.toThrow();
      expect(
        (await db.query("select public.is_site_owner() as owner")).rows,
      ).toEqual([{ owner: false }]);
    });
    await asRole("anon", "", async () => {
      await expect(
        db.exec(
          "insert into public.posts (slug,title) values ('anonymous','Anonymous')",
        ),
      ).rejects.toThrow();
    });
  });
  it("allows owner create, publish, unpublish and deletion with immediate public visibility", async () => {
    await asRole("authenticated", owner, () =>
      db.exec(
        "insert into public.posts (slug,title,content) values ('lifecycle','Lifecycle','Some words')",
      ),
    );
    await asRole("authenticated", owner, () =>
      db.exec(
        "update public.posts set status='published',published_at=now() where slug='lifecycle'",
      ),
    );
    expect(
      (
        await asRole("anon", "", () =>
          db.query("select slug from public.posts where slug='lifecycle'"),
        )
      ).rows,
    ).toHaveLength(1);
    await asRole("authenticated", owner, () =>
      db.exec("update public.posts set status='draft' where slug='lifecycle'"),
    );
    expect(
      (
        await asRole("anon", "", () =>
          db.query("select slug from public.posts where slug='lifecycle'"),
        )
      ).rows,
    ).toHaveLength(0);
    await asRole("authenticated", owner, () =>
      db.exec("delete from public.posts where slug='lifecycle'"),
    );
  });
  it("enforces unique slugs and publication constraints in the database", async () => {
    await asRole("authenticated", owner, async () => {
      await expect(
        db.exec(
          "insert into public.posts (slug,title) values ('draft','Duplicate')",
        ),
      ).rejects.toThrow();
      await expect(
        db.exec(
          "insert into public.posts (slug,title,status) values ('empty','Empty','published')",
        ),
      ).rejects.toThrow();
    });
  });
  it("restricts storage writes to the owner folder and disallows overwrites", async () => {
    await asRole("authenticated", stranger, async () => {
      await expect(
        db.exec(
          `insert into storage.objects (bucket_id,name) values ('article-images','${stranger}/bad.png')`,
        ),
      ).rejects.toThrow();
    });
    await asRole("authenticated", owner, async () => {
      await db.exec(
        `insert into storage.objects (bucket_id,name) values ('article-images','${owner}/allowed.png')`,
      );
      await expect(
        db.exec(
          "insert into storage.objects (bucket_id,name) values ('article-images','wrong-folder/bad.png')",
        ),
      ).rejects.toThrow();
      expect(
        (
          await db.query(
            "update storage.objects set name='overwrite.png' returning id",
          )
        ).rows,
      ).toHaveLength(0);
      expect(
        (await db.query("delete from storage.objects returning id")).rows,
      ).toHaveLength(1);
    });
  });
  it("revokes the previous owner immediately when authorization changes", async () => {
    await db.exec(`update public.site_owner set user_id='${stranger}'`);
    const result = await asRole("authenticated", owner, () =>
      db.query("select slug from public.posts"),
    );
    expect(result.rows).toEqual([{ slug: "published" }]);
    await db.exec(`update public.site_owner set user_id='${owner}'`);
  });
});
