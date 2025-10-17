import type { Page } from "playwright";
import { backToWpAdminHome } from "./backToWpAdminHome.js";
import { logger } from "../utils/logger.js";
import { getWebsiteDesc, splitTargetSiteTitle } from "../utils/openai.js";
import sharp from "sharp";
import { decode as decodeIco } from "sharp-ico";
import { getProjectPath } from "../utils/getProjectPath.js";
import fs from 'node:fs'
import path from 'node:path'
export async function getTargetSiteInfo(page: Page, currentSite: string, targetSite: string): Promise<{splitTitle: string[], metaDescription: string}> {

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
      const urlObj = new URL(currentSite);
      const hostname = urlObj.hostname;

      // 准备保存路径
      const saveDir = getProjectPath("assets/icons");
      if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

      const savePath = path.join(saveDir, `${hostname}.png`);

      // 下载图片
      const res = await page.request.get(favicon);
      if (!res.ok()) throw new Error(`下载 favicon 失败: ${res.status()}`);

      const buffer = Buffer.from(await res.body());


      // 判断是否 SVG 或 ICO
      const isSVG = favicon.endsWith(".svg") || buffer.toString("utf8", 0, 5).includes("<svg");
      const isICO = favicon.endsWith(".ico");

      if (isSVG) {
        // 矢量图，转换为 256x256 PNG
        await sharp(buffer)
          .resize(256, 256)
          .png()
          .toFile(savePath);
      } else if (isICO) {
        // ICO 格式，使用 sharp-ico 解码，选最大尺寸图层
        const icons = decodeIco(buffer);
        if (icons.length > 0) {
          const largest = icons.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b));
          let image;
          if (largest.type === "png") {
            image = sharp(largest.data);
          } else {
            image = sharp(largest.data, {
              raw: {
                width: largest.width,
                height: largest.height,
                channels: 4,
              },
            });
          }
          await image
            .resize(256, 256)
            .png()
            .toFile(savePath);
        } else {
          throw new Error("ICO 解码失败，无有效图层");
        }
      } else {
        // 其他格式，直接用 sharp 处理
        await sharp(buffer)
          .resize(256, 256)
          .png()
          .toFile(savePath);
      }

      logger.info(`favicon 已保存: ${savePath}`);
    } catch (err: any) {
      logger.error(`处理 favicon 出错: ${err.message}`);
    }
  }

  await page.waitForTimeout(1000)
  // 获取 meta description（如果存在）
  let metaDescription = 'splitTitle'
  try {
    metaDescription = await page.evaluate(() => {
      return document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || ''
    })
    if (metaDescription) {
      logger.info(`description: ${metaDescription}`)
      // 若需要，可将 description 加入 splitTitle 的返回值或其它处理逻辑
    } else {
      logger.info(`description 不存在`)
    }
  } catch (err: any) {
    logger.error(`获取 description 出错: ${err?.message ?? err}`)
  }

  metaDescription = await getWebsiteDesc(metaDescription)


  await backToWpAdminHome(page, currentSite)
  logger.info(`获取目标网站信息成功`)


  return {splitTitle , metaDescription };
}