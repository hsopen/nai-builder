import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";

export async function setPermalink(page: Page, currentSite: string) {
  logger.info(`设置固定链接`)
  await page.goto(`${toWpAdminUrl(currentSite)}/options-permalink.php`)
  await page.waitForTimeout(1000)
  await page.click('#submit')
  await page.waitForTimeout(1000)
  await page.waitForLoadState("load");
  await backToWpAdminHome(page, currentSite)
}