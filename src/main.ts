import { PlaywrightCrawler } from 'crawlee';
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
import * as fs from 'fs';
import * as path from 'path';

interface Task {
    currentSite: string;
    targetSite: string;
    status: string;
}

async function crawleer(currentSite: string, targetSite: string) {
    const options = await launchOptions({
        headless: false,
    });

    const crawler = new PlaywrightCrawler({
        launchContext: {
            launcher: firefox,
            launchOptions: options,
        },
        maxRequestRetries: 0,
        requestHandlerTimeoutSecs: 600,
        headless: false,
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

            await page.waitForTimeout(5000000)
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
    const tasks: Task[] = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            currentSite: values[0] || '',
            targetSite: values[1] || '',
            status: values[2] || ''
        };
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