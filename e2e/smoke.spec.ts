import { test, expect } from '@playwright/test';

test('boots, renders the scene, selection syncs, language toggles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toContainText('LABTWIN');
  await expect(page.locator('canvas')).toBeVisible();

  // Entity labels are drei <Html> — proves the R3F scene mounted with all demo entities.
  await expect(page.getByTestId('label-CAB-01')).toBeVisible();
  await expect(page.getByTestId('label-EQP-02')).toBeVisible(); // the GLB sample

  // Select from the list → inspector shows the record.
  await page.getByTestId('row-FHD-01').click();
  await expect(page.getByTestId('inspector')).toContainText('FHD-01');
  await expect(page.getByTestId('inspector')).toContainText('通风柜');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'e2e/__screenshots__/space-top.png' });

  // Perspective preview
  await page.getByTestId('camera-toggle').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'e2e/__screenshots__/space-perspective.png' });

  // Language toggle switches copy (no hard-coded strings).
  await page.getByTestId('lang-toggle').click();
  await expect(page.getByTestId('inspector')).toContainText('Fume hood');
});

test('place a component from the palette, undo, redo, delete', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('label-CAB-01')).toBeVisible();
  const rows = page.getByTestId('inspector').locator('li');
  const before = await rows.count();

  // click the preset, then click the floor inside the room (the canvas centre is in the room)
  await page.getByTestId('preset-cabinet').click();
  await expect(page.getByTestId('hint')).toContainText('放置');
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.4);
  await page.waitForTimeout(150);
  await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.4);

  await expect(rows).toHaveCount(before + 1);
  await expect(page.getByTestId('inspector')).toContainText('CAB-03'); // CAB-01/02 exist → next is 03

  await page.getByTestId('undo').click();
  await expect(rows).toHaveCount(before);
  await page.getByTestId('redo').click();
  await expect(rows).toHaveCount(before + 1);
  await expect(page.getByTestId('label-CAB-03')).toBeVisible();

  await page.keyboard.press('Delete');
  await expect(rows).toHaveCount(before);
});

test('library showroom renders every preset', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('tab-library').click();
  await expect(page.getByTestId('library-canvas')).toBeVisible();
  await expect(page.getByText('旋转蒸发仪（示例）').first()).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'e2e/__screenshots__/library.png' });
});

test('sample 2 (corridor lab from the sketch) loads with door, hung cabinets and glovebox placeholder', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('scene-select').selectOption('corridor');
  await expect(page.getByTestId('label-FHD-01')).toBeVisible();
  await expect(page.getByTestId('label-CAB-03')).toBeVisible();
  const rows = page.getByTestId('inspector').locator('li');
  await expect(rows).toHaveCount(8);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/__screenshots__/corridor-top.png' });
  await page.getByTestId('row-CAB-02').click();
  await expect(page.getByTestId('inspector')).toContainText('↑1.50');
  await page.getByTestId('camera-toggle').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'e2e/__screenshots__/corridor-perspective.png' });
  // switching back restores sample 1 (10 entities)
  await page.getByTestId('scene-select').selectOption('l-shape');
  await expect(rows).toHaveCount(10);
});
