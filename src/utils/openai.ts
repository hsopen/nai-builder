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


/**
 * 调用 OpenAI Chat API
 * @param prompt 用户输入的文本
 * @param model 模型，可选，默认 gpt-4
 */
export async function generateAboutUs(prompt: string, model = "gpt-3.5-turbo") {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system", content: `
我们的谷歌独立站需要写一份英文的About us的介绍，我会告诉你公司的网站的标题，你依照下面6点需求为我编写，输出about us只输出给我英文，不要输出任何无关内容，不要解释如何修改的
1、不要改变原有意思，如果初稿中出现了邮箱、电话等联系方式，需要你删掉；
2、语言风格是美式英语；
3、不要有明显的AI痕迹；
4、你只需要输出你写好的About us内容即可，不要输出其他任何内容！
5、为大段形式，不要其他的任何例如列表，表格之类的格式
6、不要输出包含有select的单词          
          ` },
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