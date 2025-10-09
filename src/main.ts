import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { launchOptions } from 'camoufox-js';
import { firefox } from 'playwright';
import { loginWP } from './modules/login.js';
import { logger } from './utils/logger.js';
import { getTargetSiteInfo } from './modules/getTargetSiteInfo.js';
import { setCurrentSiteInfo } from './modules/setCurrentSiteInfo.js';
import { setPermalink } from './modules/setPermalink.js';
import { setOptionsReading } from './modules/setOptionsReading.js';
import { setAboutUs } from './modules/setAboutUs.js';
import { setHomeTitle } from './modules/setHomeTitle.js';
import { normalizeDomain } from './utils/domainUtils.js';
import * as fs from 'fs';
import * as path from 'path';

interface Task {
    currentSite: string;
    targetSite: string;
    status: string;
}
const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: [
        'http://127.0.0.1:7890',
    ],
});

async function crawleer(currentSite: string, targetSite: string) {
    const options = await launchOptions({
        headless: false,
    });

    const crawler = new PlaywrightCrawler({
        proxyConfiguration,
        launchContext: {
            launcher: firefox,
            launchOptions: options,
        },
        maxRequestRetries: 0,
        requestHandlerTimeoutSecs: 600,
        headless: true,
        postNavigationHooks: [
            async ({ handleCloudflareChallenge }) => {
                if (handleCloudflareChallenge) {
                    await handleCloudflareChallenge();
                }
            },
        ],
        requestHandler: async ({ page, handleCloudflareChallenge }) => {

            logger.info(`开始爬取${currentSite}`)

            // 登录loginWP
            await loginWP(page, handleCloudflareChallenge, currentSite)

            // 获取对标站主标题以及icon
            const targetTitle = await getTargetSiteInfo(page, currentSite, targetSite)

            // 设置WP站主标题以及icon
            await setCurrentSiteInfo(page, currentSite, targetTitle)

            // 设置固定链接
            await setPermalink(page, currentSite)

            // 设置阅读隐私站点可见性`
            await setOptionsReading(page, currentSite)

            // 设置AboutUS
            await setAboutUs(page, currentSite, targetTitle)

            // 设置Home副标题
            await setHomeTitle(page, currentSite, targetTitle)

            await page.waitForTimeout(10000)
            logger.info(`结束爬取${currentSite}`)
        },
    });

    await crawler.run([currentSite]);
}

async function main() {
    const csvPath = path.join(process.cwd(), 'tasks.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        logger.info('tasks.csv is empty');
        return;
    }
    const headers = lines[0]!.split(',');
    const tasks: Task[] = lines.slice(1)
        .map(line => {
            const values = line.split(',');
            const rawCurrent = values[0]?.trim() || '';
            const rawTarget = values[1]?.trim() || '';
            const currentSite = normalizeDomain(rawCurrent);
            const targetSite = normalizeDomain(rawTarget);
            return {
                currentSite,
                targetSite,
                status: values[2]?.trim() || ''
            };
        })
        .filter(task => {
            // 过滤 currentSite/targetSite 为空或无法组成合格链接的行
            const validUrl = (url: string) => {
                try {
                    const u = new URL(url);
                    return !!u.hostname;
                } catch {
                    return false;
                }
            };
            return task.currentSite && task.targetSite && validUrl(task.currentSite) && validUrl(task.targetSite);
        });

    for (const task of tasks) {
        if (task.status !== '完成') {
            logger.info(`开始处理任务: ${task.currentSite} -> ${task.targetSite}`);
            await crawleer(task.currentSite, task.targetSite);
            task.status = '完成';
            logger.info(`任务完成: ${task.currentSite} -> ${task.targetSite}`);
        }
    }

    // 更新CSV
    const updatedLines = [headers.join(',')];
    tasks.forEach(task => {
        updatedLines.push(`${task.currentSite},${task.targetSite},${task.status}`);
    });
    fs.writeFileSync(csvPath, updatedLines.join('\n'));
}

await main();