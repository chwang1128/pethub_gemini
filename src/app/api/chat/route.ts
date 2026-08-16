import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "❌ 尚未設定 API Key" }); // 回傳 200 讓前端印出來
    }

    // 直接向 Google 查詢此 Key 支援的模型清單
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsRes = await fetch(modelsUrl);
    const modelsData = await modelsRes.json();

    if (!modelsRes.ok) {
      return NextResponse.json({ 
        reply: `❌ 查詢清單失敗：${modelsData.error?.message}` 
      });
    }

    // 篩選出具備對話生成能力的模型
    const availableModels = modelsData.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', '')) || [];

    // 把清單直接作為「AI 的回覆」送回前端畫面！
    const replyText = `✅ 成功抓取可用模型清單！您目前可用的模型代號如下：\n\n${availableModels.join('\n')}\n\n👉 請從上方挑選一個最新的模型（例如含有 pro 或最新 flash 版本的代號），我們再來放進正式程式碼中。`;

    return NextResponse.json({
      reply: replyText,
      text: replyText
    });

  } catch (error: any) {
    return NextResponse.json({ 
      reply: `❌ 伺服器捕捉到異常：${error?.message}` 
    });
  }
}
