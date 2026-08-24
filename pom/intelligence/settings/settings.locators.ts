import type { Page } from '@playwright/test';

export function settingsLocators(page: Page) {
  return {
    headerSettings: page.locator('[class*="LogOptions_icon"]').first(),
    language: page.locator('select[name="languageSelect"]'),
    dateFormat: page.locator('select[name="dateFormatSelect"]'),
    timeFormat: page.locator('select[name="timeFormatSelect"]'),
  };
}
