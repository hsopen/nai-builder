/**
 * 标准化域名格式
 * 1. 为没有http/https的域名添加https前缀
 * 2. 为有路径的域名删除路径部分
 */
export function normalizeDomain(domain: string): string {
    if (!domain || domain.trim() === '') {
        return domain;
    }

    let normalizedDomain = domain.trim();

    // 如果没有协议前缀，添加https://
    if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
        normalizedDomain = 'https://' + normalizedDomain;
    }

    try {
        // 使用URL对象来解析和标准化域名
        const url = new URL(normalizedDomain);
        // 保留协议、主机名、端口、路径和查询参数
        return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}${url.search}`;
    } catch (error) {
        // 如果URL解析失败，返回原始域名
        console.warn(`无法解析域名: ${domain}`, error);
        return domain;
    }
}

/**
 * 批量标准化域名数组
 */
export function normalizeDomains(domains: string[]): string[] {
    return domains.map(domain => normalizeDomain(domain));
}