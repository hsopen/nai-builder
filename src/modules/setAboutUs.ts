import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { generateAboutUs } from "../utils/openai.js";

export async function setAboutUs(page: Page, currentSite: string, targetTitle: string[]) {
  logger.info(`设置AboutUs`)
  await page.goto(`${toWpAdminUrl(currentSite)}/edit.php?post_type=page`)
  await page.waitForTimeout(500)
  await page.fill('#post-search-input', 'about')
  await page.waitForTimeout(500)
  await page.keyboard.press('Enter')
  await page.waitForLoadState("load");
  const editElementorPage = await page.$eval('td.title.column-title.has-row-actions.column-primary.page-title > div.row-actions > span.edit_with_elementor > a', el => el.getAttribute('href') || '')
  if (editElementorPage == '') {
    return
  }
  await page.goto(editElementorPage)

  await page.waitForFunction(() => {
    const el = document.querySelector('#elementor-loading');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 30000 });

  await page.waitForTimeout(5000)
  await page.click('#elementor-navigator__elements > div > div > div > div.elementor-navigator__item')
  await page.keyboard.press('Delete')
  await page.waitForTimeout(500)
  await page.fill('#elementor-panel-elements-search-input', '标题')
  await page.waitForTimeout(500)
  await page.click('#elementor-panel-elements > div > button')
  await page.selectOption('#elementor-controls > div.elementor-control.elementor-control-header_size.elementor-control-type-select.elementor-label-inline.elementor-control-separator-default > div select', 'p')

  const aboutUs = await generateAboutUs(targetTitle.join(' | '))

  await page.fill('#elementor-controls > div.elementor-control.elementor-control-title.elementor-control-type-textarea.elementor-label-block.elementor-control-separator-default.elementor-control-dynamic > div > div > div > textarea', aboutUs)

  await page.waitForTimeout(1000)
  await page.click('#elementor-editor-wrapper-v2 > header > div > div > div.MuiGrid-root.MuiGrid-container> div.MuiButtonGroup-root.MuiButtonGroup-contained > button')
  await page.waitForTimeout(20000)
  await backToWpAdminHome(page, currentSite)
}