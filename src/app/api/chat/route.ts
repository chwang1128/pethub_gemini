import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "❌ 診斷結果：Vercel 未找到 GEMINI_API_KEY 變數。" });
    }

    // 1. 直接向 Google 查詢此 Key 支援的模型清單 (ListModels API)
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    // 若 API 金鑰或權限有問題，直接回傳 Google 原生錯誤訊息
    if (!listRes.ok) {
      return NextResponse.json({
        reply: `❌ Google 金鑰驗證失敗 (HTTP ${listRes.status})：${listData.error?.message || JSON.stringify(listData)}`
      });
    }

    // 2. 自動抓取該金鑰「實際可用」的第一個 Gemini 模型
    const availableModels = listData.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', '')) || [];

    if (availableModels.length === 0) {
      return NextResponse.json({ reply: "❌ 金鑰有效，但該專案下找不到任何可用的對話模型。" });
    }

    const activeModel = availableModels[0]; // 自動選取例如 gemini-2.5-flash

    // 3. 使用抓到的可用模型發送提問
    const body = await req.json();
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;
    
    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `你現在是 PetHub 毛孩助理。請回答：${body.prompt || '你好'}` }] }]
      })
    });

    const genData = await genRes.json();

    if (!genRes.ok) {
      return NextResponse.json({
        reply: `❌ 模型 ${activeModel} 生成失敗：${genData.error?.message}`
      });
    }

    const replyText = genData.candidates?.[0]?.content?.parts?.[0]?.text || "無內容";
    return NextResponse.json({ reply: replyText, text: replyText });

  } catch (error: any) {
    return NextResponse.json({
      reply: `❌ 伺服器診斷捕捉到的異常：${error?.message || String(error)}`
    });
  }
}
