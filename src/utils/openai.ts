import OpenAI from "openai";
import { logger } from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

/**
 * 调用 OpenAI Chat API
 * @param prompt 用户输入的文本
 * @param model 模型，可选，默认 gpt-4
 */
export async function splitTargetSiteTitle(prompt: string, model = "gpt-3.5-turbo") {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "我将给你一个网站的标题以及网站的地址，你帮我将网站标题分割为两部分，尽量将品牌名作为主标题，主标题在前，副标题在后，使用<|>分割，不要返回多余的字符串" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const answer = response.choices[0]?.message?.content ?? "";
    logger.info(`OpenAI 请求成功: ${prompt}`);
    return answer;
  } catch (err: any) {
    logger.error(`OpenAI 请求失败: ${err.message}`);
    throw err;
  }
}
