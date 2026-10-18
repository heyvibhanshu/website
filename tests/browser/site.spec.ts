import { test, expect } from "@playwright/test";
const desk = process.env.CMS_ADMIN_PATH;
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
      page.getByRole("heading", { name: heading, exact: true }),
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
