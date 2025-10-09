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

  let success = false;
  for (const editUrl of editElementorPages) {
    if (!editUrl) continue;
    try {
      await page.goto(editUrl);
      await page.waitForFunction(() => {
        const el = document.querySelector('#elementor-loading');
        return !el || window.getComputedStyle(el).display === 'none';
      }, { timeout: 30000 });
      await page.waitForTimeout(5000);
      await page.click('#elementor-panel-elements-navigation > button:nth-child(3)');
      await page.waitForTimeout(500);
      // 获取主链接文本
      const mainUrlText = await page.$eval('div > div:nth-child(1) > div > div.serp-preview-wrapper > div.serp-preview-body > div:nth-child(1) > div', el => el.textContent?.trim() || '');
      // 判断是否带路径
      const urlMatch = mainUrlText.match(/^https?:\/\/(.*?)(\/.*)?$/);
      const hasPath = urlMatch && urlMatch[2] && urlMatch[2] !== '/';
      if (hasPath) {
        // 有路径，跳过下一个 editElementorPages
        continue;
      }
      // 无路径，继续后续操作
      await page.click('div.components-panel__body > button.rank-math-edit-snippet');
      await page.waitForTimeout(500);
      await page.fill('#rank-math-editor-title', ` %sitename% %sep% ${targetTitle[1]}`);
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      await page.click('#elementor-editor-wrapper-v2 > header > div > div > div.MuiGrid-root.MuiGrid-container> div.MuiButtonGroup-root.MuiButtonGroup-contained > button');
      await page.waitForTimeout(20000);
      success = true;
      break;
    } catch (err) {
      logger.error(`HomeTitle处理 editElementorPages 链接失败: ${editUrl}, ${err}`);
      continue;
    }
  }
  await backToWpAdminHome(page, currentSite);
}