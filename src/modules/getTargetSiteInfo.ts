import type { Page } from "playwright";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { logger } from "../utils/logger.js";
import { splitTargetSiteTitle } from "../utils/openai.js";
import sharp from "sharp";
import { getProjectPath } from "../utils/getProjectPath.js";
import fs from 'node:fs'
import path from 'node:path'
export async function getTargetSiteInfo(page: Page, currentSite: string, targetSite: string): Promise<string[]> {

  logger.info(`正在获取对标站${targetSite} icon以及标题`)
  await page.goto(targetSite)
  await page.waitForTimeout(5000)
  const title = await page.title()
  let splitTitle: string[] = []
  for (let i = 1; i <= 2; i++) {
    logger.info(`第${i}次尝试分割对标站标题`)
    splitTitle = (await splitTargetSiteTitle(title)).split('<|>')
    if (splitTitle.length == 2) {
      break
    }
    splitTitle = []
  }

  // 获取网站icon
  // 获取网站icon
  let favicon: string | null = null

  // 1️⃣ 尝试 <link> 标签
  const linkSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="mask-icon"]'
  ]
  for (const sel of linkSelectors) {
    const href = await page.evaluate((s) => {
      const el = document.querySelector<HTMLLinkElement>(s)
      return el?.href ?? null
    }, sel)
    if (href) {
      favicon = href
      break
    }
  }

  // 2️⃣ 尝试根目录 /favicon.ico
  if (!favicon) {
    try {
      const url = new URL("/favicon.ico", targetSite).toString()
      const response = await page.request.get(url)
      if (response.ok()) {
        favicon = url
      }
    } catch {
      // 忽略错误
    }
  }

  // 3️⃣ 尝试 OG / Twitter 图片
  if (!favicon) {
    const metaHref = await page.evaluate(() => {
      const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content
      if (og) return og
      const twitter = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.content
      if (twitter) return twitter
      return null
    })
    if (metaHref) favicon = metaHref
  }
  if (favicon) {
    try {
      // 解析域名
      const urlObj = new URL(currentSite); // currentSite = 'https://homegearlife.com/some/page'
      const hostname = urlObj.hostname; // homegearlife.com

      // 准备保存路径
      const saveDir = getProjectPath("assets/icons");
      if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

      const savePath = path.join(saveDir, `${hostname}.png`);

      // 下载图片
      const res = await page.request.get(favicon);
      if (!res.ok()) throw new Error(`下载 favicon 失败: ${res.status()}`);

      const buffer = Buffer.from(await res.body());

      // 判断是否 SVG
      const isSVG = favicon.endsWith(".svg") || buffer.toString("utf8", 0, 5).includes("<svg");

      if (isSVG) {
        // 矢量图，转换为 256x256 PNG
        await sharp(buffer)
          .resize(256, 256)
          .png()
          .toFile(savePath);
      } else {
        // 非矢量图，直接转换为 PNG
        await sharp(buffer)
          .png()
          .toFile(savePath);
      }

      logger.info(`favicon 已保存: ${savePath}`);
    } catch (err: any) {
      logger.error(`处理 favicon 出错: ${err.message}`);
    }
  }
  await backToWpAdminHome(page, currentSite)
  logger.info(`获取目标网站信息成功`)
  return splitTitle
}