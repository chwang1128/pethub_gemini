import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "❌ Vercel 尚未設定 GEMINI_API_KEY 環境變數。" });
    }

    const selectedModel = 'gemini-3.7-flash';

    const body = await req.json();
    const { prompt, petProfile, contextStores } = body;

    // 簡化傳給 AI 的店家資料，避免 Token 過載，並明確提供 ID 給 AI 挑選
    const simplifiedStores = contextStores ? contextStores.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      rating: s.rating,
      features: s.aiSummary
    })) : [];

    const systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'} (${petProfile?.type === 'dog' ? '狗狗' : '貓咪'})
品種：${petProfile?.breed || '未填寫'}
特別註記：${petProfile?.notes || '無'}

周邊店家資訊：
${simplifiedStores.length > 0 ? JSON.stringify(simplifiedStores, null, 2) : '無'}

【重要任務指令】
1. 請根據家長提問與毛孩註記，從「周邊店家資訊」中挑選最適合的店家推薦。
2. 如果清單中有明顯不符合需求（例如人類商旅不適合寵物寄宿），請嚴格剔除，不要推薦。
3. 你的回應必須是純 JSON 物件，包含 replyText (回覆文字) 與 recommendedStoreIds (你認可的店家 ID 陣列)。`;

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 🌟 啟動 Gemini 原生 JSON 輸出模式，這招非常強大
        generationConfig: {
          responseMimeType: "application/json",
        },
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n家長提問：${prompt || '你好'}` }],
          },
        ],
      }),
    });

    const genData = await genRes.json();

    if (!genRes.ok) {
      return NextResponse.json({ 
        reply: `❌ 模型 [${selectedModel}] 生成失敗：${genData.error?.message || '未知錯誤'}` 
      });
    }

    // 取得 AI 吐出的 JSON 字串
    const rawText = genData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (e) {
      // 防呆機制
      parsedResult = {
        replyText: "AI 回傳格式解析失敗，請再試一次。",
        recommendedStoreIds: contextStores?.map((s: any) => s.id) || [] 
      };
    }

    // 把文字與 AI 挑選的 IDs 分開傳回前端
    return NextResponse.json({
      reply: parsedResult.replyText,
      text: parsedResult.replyText,
      recommendedIds: parsedResult.recommendedStoreIds || []
    });

  } catch (error: any) {
    return NextResponse.json({ 
      reply: `❌ 伺服器捕捉到異常：${error?.message || '未知錯誤'}` 
    });
  }
}
