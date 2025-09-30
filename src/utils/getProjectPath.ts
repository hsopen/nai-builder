import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（假设当前文件在 src/utils 下）
const projectRoot = path.resolve(__dirname, "../../");

/**
 * 获取项目完整路径
 * @param subPath 相对项目根目录的子路径，可选
 * @returns 完整路径字符串
 */
export function getProjectPath(subPath?: string): string {
  return subPath ? path.join(projectRoot, subPath) : projectRoot;
}

// 测试示例
// console.log(getProjectPath()); // 输出项目根目录
// console.log(getProjectPath("logs/combined.log")); // 输出完整日志路径


console.log(getProjectPath());
