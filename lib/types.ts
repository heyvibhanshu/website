export type Post = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  cover_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
};
export type PostSummary = Pick<
  Post,
  "id" | "slug" | "title" | "description" | "published_at" | "updated_at"
>;
export type ActionResult = {
  error?: string;
  success?: string;
  id?: string;
  url?: string;
};
