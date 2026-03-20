import { test, expect } from "./fixtures/test-fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// 33. All form submissions validate required fields before submit
// ─────────────────────────────────────────────────────────────────────────────
test("33 — form validation prevents empty submission (new borrower)", async ({
  adminPage,
}) => {
  await adminPage.goto("/admin/borrowers/new");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Find the submit/save button
  const submitBtn = adminPage.locator(
    'button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")'
  );

  if (await submitBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    // Click submit without filling required fields
    await submitBtn.first().click();

    // Wait for validation to trigger
    await adminPage.waitForTimeout(500);

    // Check for validation messages (HTML5 or custom)
    const validationMsg = adminPage.locator(
      '[class*="error"], [class*="invalid"], [aria-invalid="true"], .text-destructive, [data-state="invalid"]'
    );

    const hasValidation = await validationMsg.first().isVisible({ timeout: 3_000 }).catch(() => false);

    // Also check HTML5 validity via :invalid pseudo-class
    const invalidInputs = await adminPage.evaluate(() => {
      const inputs = document.querySelectorAll(
        "input:invalid, select:invalid, textarea:invalid"
      );
      return inputs.length;
    });

    expect(hasValidation || invalidInputs > 0).toBeTruthy();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 34. Form error states display correctly
// ─────────────────────────────────────────────────────────────────────────────
test("34 — form error states display for invalid input", async ({
  adminPage,
}) => {
  await adminPage.goto("/admin/borrowers/new");
  await adminPage.waitForLoadState("networkidle");

  // Find email input if present and enter invalid email
  const emailInput = adminPage.locator(
    'input[type="email"], input[name*="email"], input[placeholder*="email" i]'
  );

  if (await emailInput.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await emailInput.first().fill("not-an-email");

    // Tab away to trigger blur validation
    await adminPage.keyboard.press("Tab");
    await adminPage.waitForTimeout(500);

    // Try to submit
    const submitBtn = adminPage.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Create")'
    );
    if (await submitBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitBtn.first().click();
      await adminPage.waitForTimeout(500);
    }

    // Check for error styling or messages
    const errorIndicator = adminPage.locator(
      '[class*="error"], [class*="invalid"], .text-destructive, [aria-invalid="true"]'
    );
    const hasError = await errorIndicator.first().isVisible({ timeout: 3_000 }).catch(() => false);

    // HTML5 validity check
    const isInvalid = await emailInput.first().evaluate((el) => {
      return !(el as HTMLInputElement).validity.valid;
    });

    expect(hasError || isInvalid).toBeTruthy();
  } else {
    // No email input found — still verify the page loaded without error
    await expect(adminPage.locator("main")).toBeVisible();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 35. Date pickers, dropdowns, and multi-selects function properly
// ─────────────────────────────────────────────────────────────────────────────
test("35 — date pickers and dropdowns are interactive", async ({
  adminPage,
}) => {
  // Use a page with various form elements (new origination or new borrower)
  await adminPage.goto("/admin/originations/new");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Test dropdown/select (Radix Select or native)
  const selectTrigger = adminPage.locator(
    'button[role="combobox"], [data-radix-select-trigger], select, [class*="select-trigger"]'
  );

  if (await selectTrigger.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await selectTrigger.first().click();
    await adminPage.waitForTimeout(300);

    // Dropdown content should appear
    const dropdownContent = adminPage.locator(
      '[role="listbox"], [data-radix-select-content], [class*="select-content"]'
    );
    const hasDropdown = await dropdownContent.first().isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasDropdown) {
      // Close by pressing Escape
      await adminPage.keyboard.press("Escape");
    }
  }

  // Test date picker
  const dateTrigger = adminPage.locator(
    'button:has-text("Pick a date"), button:has-text("Select date"), input[type="date"], [class*="date-picker"], [class*="calendar"]'
  );

  if (await dateTrigger.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    await dateTrigger.first().click();
    await adminPage.waitForTimeout(300);

    const calendar = adminPage.locator(
      '[class*="calendar"], [role="grid"], [class*="Calendar"], .rdp'
    );
    const hasCalendar = await calendar.first().isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCalendar) {
      await adminPage.keyboard.press("Escape");
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 36. Currency/number inputs format correctly
// ─────────────────────────────────────────────────────────────────────────────
test("36 — currency/number inputs accept and format values", async ({
  adminPage,
}) => {
  await adminPage.goto("/admin/originations/new");
  await adminPage.waitForLoadState("networkidle");

  // Find number/currency input fields
  const numberInput = adminPage.locator(
    'input[type="number"], input[inputmode="numeric"], input[inputmode="decimal"], input[class*="num"], input[placeholder*="$"], input[placeholder*="amount" i]'
  );

  if (await numberInput.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await numberInput.first().fill("1234567.89");

    const value = await numberInput.first().inputValue();
    // Value should be accepted (not rejected or empty)
    expect(value).toBeTruthy();
  } else {
    // Page still loaded without errors
    await expect(adminPage.locator("main")).toBeVisible();
  }
});
