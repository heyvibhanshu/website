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
import { ToolbarIcon } from "@/components/admin/toolbar-icon";
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
  const [imageOpen, setImageOpen] = useState(false);
  const [imageError, setImageError] = useState("");
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const imageSelectionRef = useRef({ start: 0, end: 0 });
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
  useEffect(() => {
    if (imageOpen) imageDialogRef.current?.showModal();
    else imageDialogRef.current?.close();
  }, [imageOpen]);
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
      setImageError("Choose an image and add meaningful alt text first.");
      return;
    }
    setImageError("");
    startTransition(async () => {
      try {
        const form = new FormData();
        form.set("image", file);
        const result = await uploadImage(form);
        if (!result.url) {
          setImageError(result.error || "Couldn’t upload the image. Please try again.");
          return;
        }
        const clean = (text: string) => text.replace(/\[|\]|"|\\|\r|\n/g, " ");
        const markdown = `\n\n![${clean(imageAlt)}](${result.url}${caption ? ` "${clean(caption)}"` : ""})\n\n`;
        const { start, end } = imageSelectionRef.current;
        setContent((current) => current.slice(0, start) + markdown + current.slice(end));
        setDirty(true);
        setFile(null);
        setImageAlt("");
        setCaption("");
        setFileKey((v) => v + 1);
        setImageOpen(false);
        requestAnimationFrame(() => {
          textRef.current?.focus();
          textRef.current?.setSelectionRange(start + markdown.length, start + markdown.length);
        });
        setMessage({
          success: "Image inserted. Save your article to keep the change.",
        });
      } catch {
        setImageError("Couldn’t upload the image. Please try again.");
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
        <h1>{id ? "edit article." : "a new thought."}</h1>
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
        <div className="formatting-toolbar" role="group" aria-label="Markdown formatting">
          {formattingTools.map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              aria-label={label}
              title={label}
              disabled={busy}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => format(kind)}
            >
              <ToolbarIcon kind={kind} />
            </button>
          ))}
          <span className="toolbar-divider" aria-hidden="true" />
          <button
            type="button"
            aria-label="Insert image"
            title="Insert image"
            disabled={busy}
            aria-haspopup="dialog"
            onClick={() => {
              imageSelectionRef.current = {
                start: textRef.current?.selectionStart ?? content.length,
                end: textRef.current?.selectionEnd ?? content.length,
              };
              setImageError("");
              setImageOpen(true);
            }}
          >
            <ToolbarIcon kind="image" />
          </button>
          <button type="button" aria-label="Copy formatting prompt" title="Copy formatting prompt" onClick={copyGuide}>
            <ToolbarIcon kind="copy" />
          </button>
        </div>
        <div className="editor-split">
          <div className="markdown-editor">
            <label htmlFor="article-markdown" className="field-label">Markdown</label>
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
          </div>
          <section className="preview" aria-label="Article preview">
            <span className="field-label">Preview</span>
            {content ? (
              <div className="preview-content" tabIndex={0} role="region" aria-label="Rendered article">
                <Markdown content={content} />
              </div>
            ) : (
              <p className="preview-content preview-empty">Your words, as they’ll appear.</p>
            )}
          </section>
        </div>
        <p className="field-hint markdown-help" id="markdown-help">Select text, then choose a format. Scroll each panel to read longer articles.</p>
        <p className="field-hint" role="status">{guideMessage}</p>
        <details className="editor-details">
          <summary>Markdown examples & LLM formatting guide</summary>
          <p className="field-hint">Copy these rules with your text into an LLM, then paste its Markdown into the editor. This guide is separate from your article.</p>
          <label>
            Supported syntax and examples
            <textarea className="markdown-guide" readOnly value={MARKDOWN_GUIDE} rows={14} onFocus={(event) => event.target.select()} />
          </label>
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
        ref={imageDialogRef}
        className="image-dialog"
        aria-labelledby="image-dialog-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setImageOpen(false);
        }}
        onClose={() => setImageOpen(false)}
      >
        <h2 id="image-dialog-title">insert image.</h2>
        <p className="field-hint">Images become public when uploaded, including images in drafts.</p>
        <form onSubmit={(event) => { event.preventDefault(); insertImage(); }}>
          <label>
            Image (PNG, JPEG, WebP; max 5 MB)
            <input
              key={fileKey}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              disabled={busy}
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label>
            Alt text
            <input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={500} required disabled={busy} />
          </label>
          <label>
            Caption (optional)
            <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} disabled={busy} />
          </label>
          {imageError && <p className="form-error" role="alert">{imageError}</p>}
          <div className="dialog-actions">
            <button className="button" type="button" disabled={busy} onClick={() => setImageOpen(false)}>Cancel</button>
            <button className="button primary" type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload & insert"}</button>
          </div>
        </form>
      </dialog>
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
