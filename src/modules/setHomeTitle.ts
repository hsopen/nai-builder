import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { generateAboutUs } from "../utils/openai.js";

export async function setHomeTitle(page: Page, currentSite: string, targetTitle: string[]) {
  logger.info(`设置Home`)
  await page.goto(`${toWpAdminUrl(currentSite)}/edit.php?post_type=page`)
  await page.waitForTimeout(5000)
  await page.fill('#post-search-input', 'Home')
  await page.waitForTimeout(5000)
  await page.keyboard.press('Enter')
  await page.waitForLoadState("load");
  await page.waitForTimeout(10000)
  const editElementorPages = await page.$$eval('td.title.column-title.has-row-actions.column-primary.page-title > div.row-actions > span.edit_with_elementor > a', els => els.map(el => el.getAttribute('href') || ''))

  if (editElementorPages[1] == '') {
    return
  }
  console.log(editElementorPages[1]);
  
  await page.goto(editElementorPages[1]!)   

  await page.waitForFunction(() => {
    const el = document.querySelector('#elementor-loading');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 30000 });

  await page.waitForTimeout(5000)
  await page.click('#elementor-panel-elements-navigation > button:nth-child(3)')
  await page.waitForTimeout(500)
  await page.click('div.components-panel__body > button.rank-math-edit-snippet')
  await page.waitForTimeout(500)
  await page.fill('#rank-math-editor-title', ` %sitename% %sep% ${targetTitle[1]}`)
  await page.waitForTimeout(1000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.click('#elementor-editor-wrapper-v2 > header > div > div > div.MuiGrid-root.MuiGrid-container> div.MuiButtonGroup-root.MuiButtonGroup-contained > button')

  await page.waitForTimeout(20000)
  await backToWpAdminHome(page, currentSite)
}