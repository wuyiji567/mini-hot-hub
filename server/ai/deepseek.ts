// DeepSeek 调用封装（OpenAI 兼容 /chat/completions 接口）。
// 模型与密钥全部从环境变量读取，不硬编码；AI_ENABLED !== "true" 时不调用。

const DEFAULT_BASE_URL = "https://api.deepseek.com/chat/completions";
const TIMEOUT_MS = 10000;

/** AI 总开关：仅当环境变量 AI_ENABLED === "true" 时启用 */
export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}

/** 读取模型名（不硬编码具体模型，由 DEEPSEEK_MODEL 指定） */
function getModel(): string {
  return (process.env.DEEPSEEK_MODEL ?? "").trim();
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * 调用 DeepSeek，返回模型输出的文本内容。
 * 失败（未配置 / 超时 / 非 200 / 结构异常）时抛出清晰错误，由上层统一降级。
 * 默认要求 JSON 模式输出，便于 parser 解析。
 */
export async function callDeepseek(messages: ChatMessage[]): Promise<string> {
  const apiKey = (process.env.DEEPSEEK_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("AI 调用失败：未配置 DEEPSEEK_API_KEY");

  const model = getModel();
  if (!model) throw new Error("AI 调用失败：未配置 DEEPSEEK_MODEL");

  const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL).trim();

  let res: Response;
  try {
    res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        stream: false,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`AI 调用失败（网络/超时）：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`AI 调用失败：HTTP ${res.status}`);
  }

  let json: { choices?: { message?: { content?: string } }[] };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error("AI 响应不是合法 JSON");
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("AI 响应缺少有效内容");
  }
  return content;
}
