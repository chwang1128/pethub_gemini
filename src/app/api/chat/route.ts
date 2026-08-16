import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "❌ 尚未設定 API Key" });
    }

    const selectedModel = 'gemini-3.7-flash';
    const body = await req.json();
    const { prompt, petProfile, contextStores, history, isEvaluationPhase, isDetailAnalysisPhase, storeReviews, storeName } = body;

    // 🌟 模式 3：點擊卡片時，AI 閱讀真實評論並摘要
    if (isDetailAnalysisPhase) {
      const reviewsText = storeReviews && storeReviews.length > 0
        ? storeReviews.map((r: any) => `[評論者 ${r.author} (${r.rating}星)]：${r.text}`).join('\n\n')
        : "暫無詳細評論內文";

      const analysisPrompt = `你現在是 PetHub 的專業寵物照護 AI 團隊。
請針對店家【${storeName}】的下列 5 則「Google 地圖真實顧客評論」，為毛孩【${petProfile?.name || '毛孩'}】總結觀點與需求佐證。

【真實顧客評論】
${reviewsText}

【任務】
1. 撰寫「aiSummary」（100字內）：歸納評論中提到的服務品質、環境優缺點與店家特色。
2. 撰寫「faqHighlights」陣列（2~3條）：挑選評論中關於寵物照護（如：環境、態度、是否不關籠等）的真實問答，並必須節錄【quoteText】（原文句子）與【authorInfo】（評論者姓名）。

請務必回傳純 JSON 格式：
{
  "aiSummary": "根據真實顧客評論總結...",
  "faqHighlights": [
    {
      "question": "針對評論提問...",
      "answer": "真實顧客回饋解答...",
      "sourceType": "Google 顧客評論",
      "sourceUrl": "https://www.google.com/maps",
      "quoteText": "節錄自評論的真實原文句...",
      "authorInfo": "Google 評論者 名字"
    }
  ]
}`;

      const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: { responseMimeType: "application/json" },
          contents: [{ parts: [{ text: analysisPrompt }] }]
        })
      });

      const genData = await genRes.json();
      const rawText = genData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return NextResponse.json(JSON.parse(rawText));
    }

    // ---------------- 以下為對話與地圖連動模式 ----------------

    const historyText = history && history.length > 0 
      ? history.map((m: any) => `${m.role === 'model' ? 'AI助理' : '家長'}：${m.content}`).join('\n')
      : '無';

    let systemPrompt = '';
    
    if (!isEvaluationPhase) {
      systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'} (${petProfile?.type === 'dog' ? '狗狗' : '貓咪'})

【任務指令：需求釐清】
請參考歷史對話，判斷需求是否明確。
⚠️ 規則：如果資訊不足，【一次只能問 1 個最關鍵的問題】！
如果資訊充足，action 設為 "search"，keyword 填寫關鍵字。若有指定縣市，在 targetLocation 回傳經緯度物件 { lat, lng }。

請回傳純 JSON：
{
  "action": "chat" 或 "search",
  "replyText": "回覆內容（一次只問一題）...",
  "keyword": "搜尋關鍵字",
  "targetLocation": null 或 { "lat": 24.1477, "lng": 120.6736 }
}`;

    } else {
      const simplifiedStores = contextStores ? contextStores.map((s: any) => ({
        id: s.id, name: s.name, address: s.address, rating: s.rating
      })) : [];

      systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
請從以下搜尋結果中，嚴格剔除不適合的店家：
${JSON.stringify(simplifiedStores, null, 2)}

回覆 (replyText) 務必【極度簡潔】，只要一句話說明推薦了畫面上哪幾家店即可，不用列出細節。

純 JSON 回傳：
{
  "replyText": "極簡推薦句...",
  "recommendedStoreIds": ["ID1", "ID2"]
}`;
    }

    const finalPrompt = `${systemPrompt}\n\n【歷史紀錄】\n${historyText}\n\n【最新訊息】\n${prompt}`;

    const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json" },
        contents: [{ parts: [{ text: finalPrompt }] }]
      })
    });

    const genData = await genRes.json();
    const rawText = genData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsedResult = JSON.parse(rawText);

    if (!isEvaluationPhase) {
      return NextResponse.json({
        action: parsedResult.action || 'chat',
        reply: parsedResult.replyText,
        keyword: parsedResult.keyword || '',
        targetLocation: parsedResult.targetLocation || null
      });
    } else {
      return NextResponse.json({
        reply: parsedResult.replyText,
        recommendedIds: parsedResult.recommendedStoreIds || []
      });
    }

  } catch (error: any) {
    return NextResponse.json({ action: 'chat', reply: `❌ 伺服器異常：${error?.message}` });
  }
}
