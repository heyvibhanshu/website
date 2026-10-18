"use client";
import { useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Markdown } from "@/components/writing/markdown";
import { savePost, deletePost, uploadImage } from "@/app/[desk]/actions";
import { useAdminPath } from "@/components/admin/admin-path";
import { slugify, formatDate } from "@/lib/utils";
import type { Post, ActionResult } from "@/lib/types";
import { formattingTools, formatMarkdown, type Format } from "@/lib/markdown-editor";
import { MARKDOWN_EXAMPLE, MARKDOWN_GUIDE } from "@/content/markdown-guide";
function localDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function Editor({ post }: { post?: Post }) {
  const adminPath = useAdminPath();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [id, setId] = useState(post?.id || "");
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [customSlug, setCustomSlug] = useState(Boolean(post));
  const [content, setContent] = useState(post?.content ?? MARKDOWN_EXAMPLE);
  const [publishedPath, setPublishedPath] = useState(
    post?.status === "published" && post.published_at &&
      new Date(post.published_at) <= new Date()
      ? `/writing/${post.slug}` : "",
  );
  const [guideMessage, setGuideMessage] = useState("");
  const [status, setStatus] = useState(post?.status || "draft");
  const [date, setDate] = useState(localDate(post?.published_at));
  const [message, setMessage] = useState<ActionResult>({});
  const [dirty, setDirty] = useState(false);
  const [busy, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (deleteOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [deleteOpen]);
  function save(nextStatus: "draft" | "published") {
    if (!formRef.current?.reportValidity()) return;
    const form = new FormData(formRef.current!);
    form.set("id", id);
    form.set("status", nextStatus);
    form.set("published_at", date ? new Date(date).toISOString() : "");
    startTransition(async () => {
      setMessage({});
      try {
        const result = await savePost(form);
        setMessage(result);
        if (result.id) {
          setId(result.id);
          setStatus(nextStatus);
          setPublishedPath(result.publishedPath || "");
          setDirty(false);
          if (!date && nextStatus === "published")
            setDate(localDate(new Date().toISOString()));
          if (!id) router.replace(`${adminPath}/${result.id}`);
          router.refresh();
        }
      } catch {
        setMessage({
          error: "Couldn’t save. Your writing is still here; please try again.",
        });
      }
    });
  }
  function format(kind: Format) {
    const input = textRef.current;
    if (!input) return;
    const result = formatMarkdown(content, input.selectionStart, input.selectionEnd, kind);
    setContent(result.value);
    setDirty(true);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(result.start, result.end);
    });
  }
  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(MARKDOWN_GUIDE);
      setGuideMessage("Guide copied. Paste it into your LLM with your article text.");
    } catch {
      setGuideMessage("Select and copy the guide below.");
    }
  }
  function insertImage() {
    if (!file || !imageAlt.trim()) {
      setMessage({
        error: "Choose an image and add meaningful alt text first.",
      });
      return;
    }
    startTransition(async () => {
      try {
        const form = new FormData();
        form.set("image", file);
        const result = await uploadImage(form);
        if (!result.url) {
          setMessage(result);
          return;
        }
        const clean = (text: string) => text.replace(/\[|\]|"|\\|\r|\n/g, " ");
        const markdown = `\n\n![${clean(imageAlt)}](${result.url}${caption ? ` "${clean(caption)}"` : ""})\n\n`;
        const start = textRef.current?.selectionStart ?? content.length;
        const end = textRef.current?.selectionEnd ?? start;
        setContent(content.slice(0, start) + markdown + content.slice(end));
        setDirty(true);
        setFile(null);
        setImageAlt("");
        setCaption("");
        setFileKey((v) => v + 1);
        setMessage({
          success: "Image inserted. Save your article to keep the change.",
        });
      } catch {
        setMessage({ error: "Couldn’t upload the image. Please try again." });
      }
    });
  }
  function remove() {
    startTransition(async () => {
      try {
        const result = await deletePost(id);
        if (result.error) {
          setMessage(result);
          setDeleteOpen(false);
          return;
        }
        setDirty(false);
        router.push(adminPath);
        router.refresh();
      } catch {
        setMessage({
          error: "Couldn’t delete this article. Please try again.",
        });
        setDeleteOpen(false);
      }
    });
  }
  return (
    <>
      <Link
        className="text-link"
        href={adminPath}
        onClick={(event) => {
          if (dirty && !window.confirm("Leave without saving your changes?"))
            event.preventDefault();
        }}
      >
        ← writing desk
      </Link>
      <div className="editor-heading">
        <h1>{id ? "Edit article." : "A new thought."}</h1>
        <span className="status">
          {status}
          {dirty ? " · unsaved" : ""}
        </span>
      </div>
      <form
        ref={formRef}
        onChange={() => setDirty(true)}
        onSubmit={(event) => {
          event.preventDefault();
          save("draft");
        }}
        className="editor-form"
      >
        <label>
          Title
          <input
            name="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!customSlug) setSlug(slugify(event.target.value));
            }}
            required
            maxLength={200}
          />
        </label>
        <label>
          Slug
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setCustomSlug(true);
              setSlug(event.target.value);
            }}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={120}
          />
          <span className="field-hint">/writing/{slug || "your-article"}</span>
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={post?.description || ""}
            rows={2}
            maxLength={500}
          />
        </label>
        <div className="editor-split">
          <div className="markdown-editor">
            <label htmlFor="article-markdown" className="field-label">Markdown</label>
            <div className="formatting-toolbar" role="group" aria-label="Markdown formatting">
              {formattingTools.map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  title={`Insert ${label.toLowerCase()}`}
                  disabled={busy}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => format(kind)}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              id="article-markdown"
              ref={textRef}
              className="markdown-input"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              aria-describedby="markdown-help"
              spellCheck
            />
            <p className="field-hint" id="markdown-help">Select text, then choose a format. New articles start with examples to replace before publishing.</p>
          </div>
          <section className="preview" aria-label="Article preview">
            <span className="field-label">Preview</span>
            {content ? (
              <Markdown content={content} />
            ) : (
              <p className="preview-empty">Your words, as they’ll appear.</p>
            )}
          </section>
        </div>
        <details className="editor-details">
          <summary>Markdown examples & LLM formatting guide</summary>
          <p className="field-hint">Copy these rules with your text into an LLM, then paste its Markdown into the editor. This guide is separate from your article.</p>
          <button className="button" type="button" onClick={copyGuide}>Copy formatting prompt</button>
          <p className="field-hint" aria-live="polite">{guideMessage}</p>
          <label>
            Supported syntax and examples
            <textarea className="markdown-guide" readOnly value={MARKDOWN_GUIDE} rows={14} onFocus={(event) => event.target.select()} />
          </label>
        </details>
        <details className="editor-details">
          <summary>Insert an image</summary>
          <p className="field-hint">
            Images are uploaded to a public bucket immediately, including images
            in drafts. Only upload material you intend to share.
          </p>
          <label>
            Image (PNG, JPEG, WebP; max 5 MB)
            <input
              key={fileKey}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label>
            Alt text
            <input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              maxLength={500}
            />
          </label>
          <label>
            Caption (optional)
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={500}
            />
          </label>
          <button
            type="button"
            className="button"
            onClick={insertImage}
            disabled={busy}
          >
            Upload & insert
          </button>
        </details>
        <details className="editor-details">
          <summary>Publication & search settings</summary>
          <label>
            Publication date (your local time)
            <input
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <span className="field-hint">
              Leave blank to use the time you first publish. A future date
              schedules publication.
            </span>
          </label>
          <label>
            Cover image URL (optional)
            <input
              name="cover_image"
              type="url"
              defaultValue={post?.cover_image || ""}
              maxLength={2048}
              placeholder="https://…"
            />
          </label>
          <label>
            SEO title
            <input
              name="seo_title"
              defaultValue={post?.seo_title || ""}
              maxLength={200}
            />
          </label>
          <label>
            SEO description
            <textarea
              name="seo_description"
              defaultValue={post?.seo_description || ""}
              maxLength={500}
              rows={2}
            />
          </label>
        </details>
        <div className="editor-actions">
          <button className="button" type="submit" disabled={busy}>
            {status === "published" ? "Unpublish & save draft" : "Save draft"}
          </button>
          <button
            className="button primary"
            type="button"
            disabled={busy}
            onClick={() => save("published")}
          >
            {busy
              ? "Working…"
              : status === "published"
                ? "Update published article"
                : "Publish article"}
          </button>
          {publishedPath && (
            <a className="button" href={publishedPath} target="_blank" rel="noopener noreferrer">
              View article ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {id && (
            <button
              className="text-button danger"
              type="button"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
            >
              Delete article
            </button>
          )}
        </div>
        <div className="form-message" aria-live="polite">
          {message.error && (
            <p className="form-error" role="alert">
              {message.error}
            </p>
          )}
          {message.success && <p>{message.success}</p>}
        </div>
        {post && (
          <p className="field-hint">
            Created {formatDate(post.created_at, "full")} · Updated{" "}
            {formatDate(post.updated_at, "full")}
          </p>
        )}
      </form>
      <dialog
        ref={dialogRef}
        onCancel={() => setDeleteOpen(false)}
        onClose={() => setDeleteOpen(false)}
      >
        <h2>Delete this article?</h2>
        <p>“{title}” will be permanently removed. This cannot be undone.</p>
        <div className="dialog-actions">
          <button
            className="button"
            onClick={() => setDeleteOpen(false)}
            disabled={busy}
            autoFocus
          >
            Keep article
          </button>
          <button className="button danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}
