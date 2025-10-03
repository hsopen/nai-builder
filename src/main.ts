import { PlaywrightCrawler } from 'crawlee';
import { launchOptions } from 'camoufox-js';
import { firefox } from 'playwright';
import { loginWP } from './modules/login.js';
import { toWpAdminUrl } from './utils/toWpAdminUrl.js';
import { logger } from './utils/logger.js';
import { getTargetSiteInfo } from './modules/getTargetSiteInfo.js';
import { setCurrentSiteInfo } from './modules/setCurrentSiteInfo.js';
import { setPermalink } from './modules/setPermalink.js';
import { setOptionsReading } from './modules/setOptionsReading.js';
import { setAboutUs } from './modules/setAboutUs.js';
import { setHomeTitle } from './modules/setHomeTitle.js';

async function withRetry(action: Function, retries = 3) {
    for (let i = 1; i <= retries; i++) {
        try {
            await action(); // 执行你要做的事
            console.log("成功！");
            break; // 成功就跳出循环
        } catch {
            console.log(`第 ${i} 次失败`);
            if (i === retries) {

            }
            console.log("重试中...");
        }
    }
}


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
    requestHandler: async ({ page, request, handleCloudflareChallenge }) => {

        logger.info(`开始爬取${currentSite}`)

        // 登录loginWP
        await loginWP(page, handleCloudflareChallenge, currentSite)

        // 获取对标站主标题以及icon
        const targetTitle = await getTargetSiteInfo(page, currentSite, targetSite)

        // 设置WP站主标题以及icon
        // await setCurrentSiteInfo(page, currentSite, targetTitle)

        // 设置固定链接
        // await setPermalink(page, currentSite)

        // 设置阅读隐私站点可见性`
        // await setOptionsReading(page, currentSite)

        // 设置AboutUS
        // await setAboutUs(page, currentSite, targetTitle)

        // 设置Home副标题
        await setHomeTitle(page, currentSite, targetTitle)

        await page.waitForTimeout(5000000)
        logger.info(`结束爬取${currentSite}`)
    },
});

const currentSite = toWpAdminUrl('https://homegearlife.com/')
const targetSite = 'https://www.shadesoflight.com/'
await crawler.run([currentSite]);