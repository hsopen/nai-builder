import type { Page } from "playwright";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { logger } from "../utils/logger.js";

export async function backToWpAdminHome(page: Page, currentSite: string) {
  await page.goto(toWpAdminUrl(currentSite))
  logger.info(currentSite, '回到wp首页')
}