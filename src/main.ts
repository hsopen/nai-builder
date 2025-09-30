import { PlaywrightCrawler } from 'crawlee';
import { launchOptions } from 'camoufox-js';
import { firefox } from 'playwright';
import { loginWP } from './modules/login.js';
import { toWpAdminUrl } from './utils/toWpAdminUrl.js';
import { logger } from './utils/logger.js';
import { getTargetSiteInfo } from './modules/getTargetSiteInfo.js';
import { setCurrentSiteInfo } from './modules/setCurrentSiteInfo.js';
import { setPermalink } from './modules/setPermalink.js';



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
        await setCurrentSiteInfo(page, currentSite, targetTitle)

        // 设置固定链接
        await setPermalink(page, currentSite)

        await page.waitForTimeout(5000000)
        logger.info(`结束爬取${currentSite}`)
    },
});

const currentSite = toWpAdminUrl('https://homegearlife.com/')
const targetSite = 'https://www.shadesoflight.com/'
await crawler.run([currentSite]);
