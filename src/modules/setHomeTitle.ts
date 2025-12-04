import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";

export async function setHomeTitle(page: Page, currentSite: string, targetTitle: string[], metaDescription: string) {
  logger.info(`设置Home`)
  await page.goto(`${currentSite}/`)
  await page.click('#wp-admin-bar-elementor_edit_page > a')
  await page.waitForLoadState("load");
  await page.waitForTimeout(10000)

  let success = false;

  await page.waitForFunction(() => {
    const el = document.querySelector('#elementor-loading');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.click('#elementor-panel-elements-navigation > button:nth-child(3)');
  await page.waitForTimeout(500);

  // 无路径，继续后续操作
  await page.click('div.components-panel__body > button.rank-math-edit-snippet');
  await page.waitForTimeout(1000);
  await page.fill('#rank-math-editor-title', ` %sitename% %sep% ${targetTitle[1]}`);
  await page.waitForTimeout(1000);
  await page.fill('#rank-math-editor-description', metaDescription || `Welcome to %sitename%, your number one source for all things related to ${targetTitle[0]}. We're dedicated to providing you the very best of ${targetTitle[0]}, with an emphasis on quality, customer service, %sitename% has come a long way from its beginnings. When we first started out, our passion for ${targetTitle[0]} drove us to start our own business.`);
  await page.waitForTimeout(2000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);
  await page.click('#elementor-editor-wrapper-v2 > header > div > div > div.MuiGrid-root.MuiGrid-container> div.MuiButtonGroup-root.MuiButtonGroup-contained > button');
  await page.waitForTimeout(20000);
  success = true;

  await backToWpAdminHome(page, currentSite);
}