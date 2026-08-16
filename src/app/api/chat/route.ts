import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: "❌ Vercel 尚未設定 GEMINI_API_KEY 環境變數。" },
        { status: 500 }
      );
    }

    // 直接鎖定最新的 3.0 模型，不讓系統瞎猜
    const selectedModel = 'gemini-3.0-flash';

    // 1. 解析前端輸入
    const body = await req.json();
    const { prompt, petProfile, contextStores } = body;

    const systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'} (${petProfile?.type === 'dog' ? '狗狗' : '貓咪'})
品種：${petProfile?.breed || '未填寫'}
特別註記：${petProfile?.notes || '無'}

周邊店家資訊：
${contextStores ? JSON.stringify(contextStores, null, 2) : '無'}

請以親切專業的口吻回答問題。`;

    // 2. 直接發送對話請求給 3.0-flash
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n家長提問：${prompt || '你好'}` }],
          },
        ],
      }),
    });

    const genData = await genRes.json();

    // 處理 Google 回傳的錯誤
    if (!genRes.ok) {
      return NextResponse.json(
        { reply: `❌ 模型 [${selectedModel}] 生成失敗：${genData.error?.message || '未知錯誤'}` },
        { status: 500 }
      );
    }

    const replyText = genData.candidates?.[0]?.content?.parts?.[0]?.text || "無回應內容";

    return NextResponse.json({
      reply: replyText,
      text: replyText,
      debugModel: selectedModel,
    });

  } catch (error: any) {
    return NextResponse.json(
      { reply: `❌ 伺服器異常：${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}
