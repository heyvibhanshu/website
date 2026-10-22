import { test, expect } from "@playwright/test";
const desk = process.env.CMS_ADMIN_PATH;
test("public landing pages do not load editor styles or article font definitions", async ({ page }) => {
  const styles: Promise<string>[] = [];
  page.on("response", (response) => {
    if (new URL(response.url()).pathname.endsWith(".css"))
      styles.push(response.text());
  });
  await page.goto("/");
  await page.waitForTimeout(2000);
  const css = (await Promise.all(styles)).join("\n");
  expect(css).not.toContain(".formatting-toolbar");
  expect(css).not.toContain("font-family:Newsreader");
  expect(css).not.toContain("font-family:Geist Mono");
  if (desk) {
    await page.goto(`${desk}/login`);
    await expect(page.locator(".setup-note")).toHaveCSS("border-top-style", "solid");
    const allCss = (await Promise.all(styles)).join("\n");
    expect(allCss).toContain(".formatting-toolbar");
    expect(allCss).toContain("font-family:Newsreader");
    // Exercise the moved editor rules without signing in or saving content.
    await page.locator(".admin-area").evaluate((area) => {
      area.insertAdjacentHTML("beforeend", '<div class="editor-split"><textarea class="markdown-input" aria-label="Style check"></textarea><div class="preview"><div class="preview-content"><div class="prose"><p>Preview</p></div></div></div></div>');
    });
    await expect(page.getByRole("textbox", { name: "Style check" })).toHaveCSS("resize", "none");
    await expect(page.getByRole("textbox", { name: "Style check" })).toHaveCSS("font-size", "12px");
    await expect(page.getByRole("textbox", { name: "Style check" })).toHaveCSS("font-family", /Geist Mono/);
    await expect(page.locator(".preview .prose")).toHaveCSS("font-family", /Newsreader/);
    const input = await page.getByRole("textbox", { name: "Style check" }).boundingBox();
    const preview = await page.locator(".preview-content").boundingBox();
    expect(input!.height).toBe(preview!.height);
  }
});

test("home prefetching does not download other pages' images", async ({ page }) => {
  const images: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "image") images.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  // Allow production route prefetches and their resource hints to finish.
  await page.waitForTimeout(2000);
  expect(images.filter((url) => !new URL(url).pathname.endsWith("icon.svg"))).toEqual([]);
  await page.getByRole("link", { name: "about", exact: true }).click();
  await expect(page.locator(".about-introduction img")).toBeVisible();
  await expect.poll(() => page.locator(".about-introduction img").evaluate(
    (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
  )).toBe(true);
  expect(images.some((url) => new URL(url).pathname === "/_next/image")).toBe(true);
});

test("public notebook and private route boundaries", async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "hey, i'm vibhanshu." }),
  ).toBeVisible();
  await expect(page.getByText("A quiet page, for now.")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(250, 249, 246)",
  );
  const main = await page.locator("main").boundingBox();
  const header = await page.locator(".header-inner").boundingBox();
  expect(Math.abs(main!.x - header!.x)).toBeLessThan(1);
  for (const path of [
    "/",
    "/writing",
    "/about",
    ...(desk ? [desk] : []),
    ...(desk ? [`${desk}/new`] : []),
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  if (desk) {
    await expect(page).toHaveURL(`${desk}/login`);
    await expect(page.getByRole("heading", { name: "A little setup first." })).toBeVisible();
  }
  await page.goto("/about");
  await expect(page.getByRole("img")).toBeVisible();
  const article = await request.get("/writing/this-does-not-exist");
  expect(article.status()).toBe(404);
  for (const [path, target] of [
    ["/blog", "/writing"],
    ["/blog/hello", "/writing/hello"],
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(target);
  }
  const rss = await request.get("/rss.xml");
  expect(rss.status()).toBe(200);
  expect(await rss.text()).not.toContain("<item>");
  const sitemap = await request.get("/sitemap.xml");
  if (desk) expect(await sitemap.text()).not.toContain(desk);
  for (const path of ["/admin", "/admin/login", "/unconfigured-desk", "/unconfigured-desk/new"]) {
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
  }
  await page.goto("/");
  await page.screenshot({
    path: `/private/tmp/website-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("main tabs preserve the document and shared header", async ({ page }) => {
  const documents: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documents.push(request.url());
  });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.dataset.navigationMarker = "preserved";
  });
  const header = await page.locator(".site-header").elementHandle();
  for (const [label, heading] of [
    ["writing", "writing."],
    ["about", "about me."],
    ["writing", "writing."],
  ]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: new RegExp(`^${heading.replace(/\./g, "\\.")}$`, "i") }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.dataset.navigationMarker,
      ),
    ).toBe("preserved");
    expect(await header!.evaluate((element) => element.isConnected)).toBe(true);
  }
  await page
    .getByRole("link", { name: "vibhanshu rathod", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "hey, i'm vibhanshu." }),
  ).toBeVisible();
  expect(documents).toHaveLength(1);
});
