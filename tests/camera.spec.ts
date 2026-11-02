import { test, expect } from "@playwright/test";
test("DSLR loads and primary controls operate without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".nav-count")).toHaveText("25", { timeout: 60000 });
  await page.screenshot({ path: "test-results/assembled.png" });
  const canvas = page.locator("canvas");
  const image = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  await page.mouse.move(1000, 440);
  await page.mouse.down();
  await page.mouse.move(1100, 480, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
    .not.toBe(image);
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.waitForTimeout(1300);
  await page.getByRole("button", { name: "Explode", exact: false }).click();
  await expect(page.locator("#intensity")).toHaveValue("100");
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "test-results/exploded.png" });
  await page.locator("#intensity").fill("50");
  await expect(page.locator(".assembly-status small")).toHaveText(
    "50% separation",
  );
  await page.getByRole("button", { name: "Assemble", exact: true }).click();
  await expect(page.locator("#intensity")).toHaveValue("0");
  await page.getByRole("button", { name: "Components", exact: false }).click();
  await page.getByRole("textbox", { name: "Search components" }).fill("sensor");
  await expect(page.locator(".component-list button")).toHaveCount(1);
  await page.locator(".component-list button").click();
  await expect(page.locator(".component-detail h3")).toHaveText(
    "CMOS image sensor",
  );
  await page
    .getByRole("combobox", { name: "Component category" })
    .selectOption("Power");
  await expect(page.locator(".component-list button")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search components" }).fill("");
  await expect(page.locator(".component-list button")).toHaveCount(1);
  await page.getByRole("button", { name: "Close components" }).click();
  for (const angle of [
    "Front",
    "Back",
    "Left",
    "Right",
    "Top",
    "Bottom",
    "Internal",
    "Three-quarter",
  ])
    await page
      .getByRole("combobox", { name: "Viewing angle" })
      .selectOption(angle);
  await page.getByRole("button", { name: "Toggle X-ray" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByLabel("Optical connections").check();
  await page.getByLabel("Engineering labels").check();
  await page.getByLabel("Simplified rendering").check();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: "Take a guided tour" }).click();
  for (let i = 0; i < 4; i++)
    await page.locator(".guide-footer>button").last().click();
  await expect(page.locator(".guide h3")).toHaveText("Capture the image");
  await page.locator(".guide-footer>button").last().click();
  await expect(page.locator(".guide")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Capture screenshot" }).click();
  expect((await download).suggestedFilename()).toBe("camera-lab.png");
  await page
    .getByRole("button", { name: "Presentation mode", exact: true })
    .click();
  await expect(page.locator("main")).toHaveClass(/presentation/);
  await page
    .getByRole("button", { name: "Exit presentation", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset camera and assembly" }).click();
  await expect(page.locator(".assembly-status span")).toHaveText("ASSEMBLED");
  await page.getByRole("button", { name: "Close components" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png" });
  expect(errors).toEqual([]);
});
test("independent parts return exactly home after repeated and interrupted assembly", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".nav-count")).toHaveText("25", { timeout: 60000 });
  const result = await page.evaluate(async () => {
    // Vite serves the application modules; exercise the same model and animation used by the viewer.
    const model = await import(/* @vite-ignore */ "/src/models/camera.ts");
    const animation = await import(
      /* @vite-ignore */ "/src/animations/assembly.ts"
    );
    const { parts } = model.createCamera();
    const snapshot = parts.map((p: any) => p.home.toArray());
    let moved = 0;
    for (let i = 0; i < 3; i++) {
      await Promise.all(
        animation.animateAssembly(parts, 100).map((t: any) => t.then()),
      );
      moved = parts.filter(
        (p: any) => p.group.position.distanceTo(p.home) > 0.2,
      ).length;
      await Promise.all(
        animation.animateAssembly(parts, 0).map((t: any) => t.then()),
      );
    }
    animation.animateAssembly(parts, 100);
    await new Promise((r) => setTimeout(r, 150));
    await Promise.all(
      animation.animateAssembly(parts, 0).map((t: any) => t.then()),
    );
    return {
      moved,
      unique: new Set(parts.map((p: any) => p.id)).size,
      count: parts.length,
      drift: Math.max(
        ...parts.map((p: any, i: number) =>
          p.group.position.distanceTo({
            x: snapshot[i][0],
            y: snapshot[i][1],
            z: snapshot[i][2],
          }),
        ),
      ),
    };
  });
  expect(result.count).toBe(25);
  expect(result.unique).toBe(25);
  expect(result.moved).toBe(25);
  expect(result.drift).toBeLessThan(0.00001);
});
