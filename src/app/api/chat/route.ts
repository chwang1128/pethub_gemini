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

    // 1. 向 Google REST API 查詢該 Key 目前真正支援的模型清單
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsRes = await fetch(modelsUrl);
    const modelsData = await modelsRes.json();

    if (!modelsRes.ok) {
      return NextResponse.json(
        { reply: `❌ API 金鑰驗證失敗 (${modelsRes.status})：${modelsData.error?.message}` },
        { status: 500 }
      );
    }

    // 篩選出具備 generateContent 能力的模型
    const availableModels: string[] = modelsData.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', '')) || [];

    if (availableModels.length === 0) {
      return NextResponse.json(
        { reply: "❌ 該 API Key 驗證通過，但目前無任何可用的生成對話模型。" },
        { status: 500 }
      );
    }

    // 自動挑選含有 'flash' 的模型；若無則自動選擇清單第一個可用模型
    const selectedModel = availableModels.find((m) => m.includes('flash')) || availableModels[0];

    // 2. 解析前端輸入
    const body = await req.json();
    const { prompt, petProfile, contextStores } = body;

    const systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'} (${petProfile?.type === 'dog' ? '狗狗' : '貓咪'})
品種：${petProfile?.breed || '未填寫'}
特別註記：${petProfile?.notes || '無'}

周邊店家資訊：
${contextStores ? JSON.stringify(contextStores, null, 2) : '無'}

請以親切專業的口吻回答問題。`;

    // 3. 發送對話請求
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

    if (!genRes.ok) {
      return NextResponse.json(
        { reply: `❌ 模型 [${selectedModel}] 生成失敗：${genData.error?.message}` },
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
