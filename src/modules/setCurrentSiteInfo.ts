import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { getProjectPath } from "../utils/getProjectPath.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";


export async function setCurrentSiteInfo(page: Page, currentSite: string, targetTitle: string[]) {
  logger.info(`设置WP后台标题和icon`)

  //  解析域名
  const urlObj = new URL(currentSite); // currentSite = 'https://homegearlife.com/some/page'
  const hostname = urlObj.hostname; // homegearlife.com

  await page.goto(`${toWpAdminUrl(currentSite)}/options-general.php`)
  await page.waitForTimeout(3000)
  await page.fill('#blogname', `${targetTitle[0]}`)
  await page.waitForTimeout(1000)
  await page.fill('#blogdescription', `${targetTitle[1]}`)

  // 设置icon
  await page.click('#choose-from-library-button')
    await page.waitForTimeout(10000)
  await page.click('#menu-item-upload')
  await page.waitForTimeout(5000)

  const input = await page.$('input[type="file"]');

  if (input) {
    const filePath = getProjectPath(`assets/icons/${hostname}.png`)
    await input.setInputFiles(filePath); // 上传文件
    console.log("文件已上传");
  } else {
    console.error("未找到文件 input");
  }
  await page.waitForTimeout(5000)
  await page.click('div.media-frame-toolbar > div > div.media-toolbar-primary.search-form > button')
  await page.waitForTimeout(2000)
  await page.click('div.media-frame-toolbar > div > div.media-toolbar-primary.search-form > button')
  await page.waitForTimeout(5000)
  await page.click('#submit')
  await page.waitForLoadState("load");
  await backToWpAdminHome(page,currentSite)
}