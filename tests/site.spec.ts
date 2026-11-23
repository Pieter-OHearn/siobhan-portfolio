import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Any path other than the home page falls through to 404.html, which renders
// the same holding page.
const unknownRoutes = ["./work/", "./work/some-project/", "./about/"];

test("home is the holding page with a LinkedIn link", async ({ page }) => {
  const response = await page.goto("./");
  expect(response?.ok()).toBeTruthy();

  await expect(page).toHaveTitle("Siobhan Herne — Portfolio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Siobhan Herne\s*Portfolio, back soon\./
  );

  const linkedin = page.getByRole("link", { name: /LinkedIn/ });
  await expect(linkedin).toHaveAttribute(
    "href",
    /^https:\/\/www\.linkedin\.com\/in\//
  );
  await expect(linkedin).toHaveAttribute("target", "_blank");
  await expect(linkedin).toHaveAttribute("rel", /noopener/);

  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("@");
});

test("the build publishes nothing beyond the holding page", () => {
  const allowed = [
    /^index\.html$/,
    /^404\.html$/,
    /^robots\.txt$/,
    /^favicon\.svg$/,
    /^_astro\/[\w.-]+\.css$/
  ];
  const published = readdirSync("dist", { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative("dist", join(entry.parentPath, entry.name)).split(sep).join("/")
    );

  expect(published).toContain("index.html");
  expect(
    published.filter((file) => !allowed.some((pattern) => pattern.test(file)))
  ).toEqual([]);
});

test("home links nowhere else on the site", async ({ page }) => {
  await page.goto("./");

  const internalLinks = await page
    .locator("a[href]")
    .evaluateAll((links) =>
      (links as HTMLAnchorElement[])
        .filter((link) => link.origin === location.origin)
        .map((link) => link.pathname)
    );
  expect(internalLinks).toEqual([]);
});

for (const route of unknownRoutes) {
  test(`${route} shows the holding page with a 404 status`, async ({ page }) => {
    const response = await page.goto(route);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Siobhan Herne"
    );
  });
}

for (const route of ["./", "./work/"]) {
  test(`${route} opts out of search indexing`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow, noarchive, nosnippet, noimageindex"
    );
  });
}

test("robots.txt lets crawlers see noindex and advertises no sitemap", async ({
  request
}) => {
  const response = await request.get("./robots.txt");

  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toBe("User-agent: *\nAllow: /\n");
});

for (const width of [320, 390, 768, 1280, 1470, 1920]) {
  test(`holding page avoids horizontal overflow at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}

test("holding page has no serious automated accessibility violations", async ({
  page
}) => {
  await page.goto("./");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations
    .filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? "")
    )
    .map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target.map(String).join(" "))
    }));
  expect(serious).toEqual([]);
});
