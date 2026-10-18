import { getPublishedPost } from "@/lib/posts";
import { socialImage } from "@/lib/social-image";
export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return socialImage(post.title, post.description);
}
