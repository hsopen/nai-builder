import type { Page } from "playwright";
import { logger } from "../utils/logger.js";
import { toWpAdminUrl } from "../utils/toWpAdminUrl.js";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { generateAboutUs } from "../utils/openai.js";

export async function setAboutUs(page: Page, currentSite: string, targetTitle: string[]) {
  logger.info(`设置AboutUs`)
  await page.goto(`${toWpAdminUrl(currentSite)}/about-us/`)
  await page.click('#wp-admin-bar-elementor_edit_page > a')
  await page.waitForLoadState("load");

  await page.waitForFunction(() => {
    const el = document.querySelector('#elementor-loading');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 30000 });

  await page.waitForTimeout(5000)
  const elements = await page.$$('#elementor-navigator__elements > div > div > div > div.elementor-navigator__item');

  // 使用可选链操作符来避免报错
  if (elements?.length > 0) {
    for (let i = 0; i < elements.length; i++) {
      await elements[i]?.click();
      await page.keyboard.press('Delete');
    }
  } else {
    console.log('没有找到任何元素');
  }
  await page.waitForTimeout(1000)
  await page.fill('#elementor-panel-elements-search-input', '标题')
  await page.waitForTimeout(1000)
  await page.click('#elementor-panel-elements > div > button')
  await page.selectOption('#elementor-controls > div.elementor-control.elementor-control-header_size.elementor-control-type-select.elementor-label-inline.elementor-control-separator-default > div select', 'p')

  const aboutUs = await generateAboutUs(targetTitle.join(' | '))

  await page.fill('#elementor-controls > div.elementor-control.elementor-control-title.elementor-control-type-textarea.elementor-label-block.elementor-control-separator-default.elementor-control-dynamic > div > div > div > textarea', aboutUs)

  await page.click('#elementor-panel-page-editor > div.elementor-panel-navigation > button.elementor-component-tab.elementor-panel-navigation-tab.elementor-tab-control-style')
  await page.waitForTimeout(500)
  await page.click('#elementor-controls > div.elementor-control.elementor-control-title_color.elementor-control-type-color.elementor-label-inline.elementor-control-separator-default.e-control-global.elementor-control-dynamic > div > div > div > div.pickr.elementor-control-unit-1.elementor-control-tag-area > button')
  await page.waitForTimeout(500)
  await page.fill('body > div.pcr-app.visible > div.pcr-interaction > input.pcr-result', '#686868')
  await page.waitForTimeout(500)
  await page.click('#elementor-navigator__elements > div > div > div > div.elementor-navigator__item')

  await page.waitForTimeout(1000)
  await page.click('#elementor-editor-wrapper-v2 > header > div > div > div.MuiGrid-root.MuiGrid-container> div.MuiButtonGroup-root.MuiButtonGroup-contained > button')
  await page.waitForTimeout(20000)
  await backToWpAdminHome(page, currentSite)
}