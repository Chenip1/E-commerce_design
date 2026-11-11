export class SceneGenerationError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function generateScene(key: string, model: string, prompt: string, tall: boolean) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, prompt, n: 1, size: tall ? '1024x1536' : '1024x1024',
      quality: 'low', output_format: 'webp', output_compression: 85,
    }),
    signal: AbortSignal.timeout(110_000),
  }).catch(() => { throw new SceneGenerationError('生成请求超时或连接中断，请稍后重试。', 504); });
  if (!response.ok) {
    if (response.status === 429) throw new SceneGenerationError('生图服务限流或额度不足，请检查用量后重试。', 429);
    if (response.status === 401 || response.status === 403) throw new SceneGenerationError('生图服务未授权，请检查密钥和模型访问权限。', 502);
    if (response.status === 400) throw new SceneGenerationError('生图服务未接受请求，请检查提示词和模型配置后重试。', 422);
    throw new SceneGenerationError('生图服务暂不可用，请稍后重试。', 502);
  }
  const data = await response.json().catch(() => null) as {data?: {b64_json?: unknown}[]} | null;
  const base64 = data?.data?.[0]?.b64_json;
  if (typeof base64 !== 'string' || base64.length > 12_000_000) {
    throw new SceneGenerationError('生图服务没有返回可用图片。', 502);
  }
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  if (String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP') {
    throw new SceneGenerationError('生图服务返回的图片格式不符。', 502);
  }
  return bytes;
}
