import type { Page } from "playwright";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { logger } from "../utils/logger.js";

export async function loginWP(page: Page, handleCloudflareChallenge: Function, currentSite: string) {

  await backToWpAdminHome(page, currentSite)
  logger.info('登录WP后台')
  while (true) {
    if (await page.$('#wpbody-content > div.wrap > h1')) {
      break
    }
    try {
      await page.fill('#user_login', 'admin')
      await page.waitForTimeout(1000)
      await page.fill('#user_pass', 'admin789123')
      await page.waitForTimeout(1000)
      await page.click('#wp-submit')
      await page.waitForTimeout(1000)
      await page.waitForSelector('#wpbody-content > div.wrap > h1', { timeout: 5000 })
    } catch {
      await handleCloudflareChallenge()
    }
  }
  logger.info(`登录成功，当前页面标题:${await page.title()}`)

  await backToWpAdminHome(page, currentSite)
}