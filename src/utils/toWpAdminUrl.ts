export function toWpAdminUrl(inputUrl: string): string {
    // 去掉前后空格
    inputUrl = inputUrl.trim();

    // 如果没有协议，则默认加 https://
    if (!/^https?:\/\//i.test(inputUrl)) {
        inputUrl = 'https://' + inputUrl;
    }

    try {
        const url = new URL(inputUrl);

        // 保留协议和主机名，路径统一为 /wp-admin/
        url.pathname = '/wp-admin/';
        url.search = '';
        url.hash = '';

        return url.toString();
    } catch (err) {
        throw new Error(`无效的 URL: ${inputUrl}`);
    }
}