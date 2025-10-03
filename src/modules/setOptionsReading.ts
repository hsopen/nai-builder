import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";

export async function setOptionsReading(page: Page, currentSite: string) {
  logger.info(`设置阅读搜索引擎可见性`)
  await page.waitForTimeout(500)
  await page.goto(`${toWpAdminUrl(currentSite)}/options-reading.php`)
  await page.click(`tbody > tr.option-site-visibility > td > fieldset > label`)
  await page.waitForTimeout(500)
  await page.click('#submit')
  await page.waitForTimeout(500)
  await page.waitForLoadState("load");
  await backToWpAdminHome(page, currentSite)
}