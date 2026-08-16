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
    const { prompt, petProfile, contextStores, history, isEvaluationPhase } = body;

    // 將歷史對話紀錄整理給 AI，讓它記得剛才問過你什麼問題
    const historyText = history && history.length > 0 
      ? history.map((m: any) => `${m.role === 'model' ? 'AI助理' : '家長'}：${m.content}`).join('\n')
      : '無';

    let systemPrompt = '';
    
    if (!isEvaluationPhase) {
      // 🌟 階段 1：需求釐清階段（這時還不搜尋地圖）
      systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'} (${petProfile?.type === 'dog' ? '狗狗' : '貓咪'})
品種：${petProfile?.breed || '未填寫'}
特別註記：${petProfile?.notes || '無'}

【任務指令：需求釐清】
家長正在尋找服務。請參考【對話歷史紀錄】，判斷家長的需求是否已經夠明確。
例如找「住宿」時，必須確認：
1. 是毛孩單獨住的「寵物旅館/安親班」，還是家長跟毛孩一起住的「寵物友善民宿/飯店」？
2. 地點要在目前位置附近，還是其他特定地區？

* 如果資訊【不足】，請以親切專業的口吻詢問家長（一次問1~2個重點即可）。此時 action 設為 "chat"，keyword 留空。
* 如果資訊已經【充足】，請回覆「好的，正在為您尋找...」之類的安撫語句，並將 action 設為 "search"，且務必提供一個精準的 keyword 供地圖系統搜尋（例如「新竹 寵物單獨寄宿 不關籠」或「台北 寵物友善 餐廳」）。

請回傳純 JSON 格式：
{
  "action": "chat" 或 "search",
  "replyText": "你的回覆內容...",
  "keyword": "供 Google Maps 搜尋的關鍵字（若 action 為 search 時才填寫）"
}`;

    } else {
      // 🌟 階段 2：店家評估與推薦階段（地圖搜完後）
      const simplifiedStores = contextStores ? contextStores.map((s: any) => ({
        id: s.id, name: s.name, address: s.address, rating: s.rating, features: s.aiSummary
      })) : [];

      systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'}

【任務指令：店家評估與卡片聯動】
家長的需求已經確認。系統剛為你搜尋到以下周邊店家：
${simplifiedStores.length > 0 ? JSON.stringify(simplifiedStores, null, 2) : '無'}

1. 根據【對話歷史紀錄】中家長確認過的條件，從上方店家清單挑選最適合的推薦。
2. 嚴格剔除不符合條件的店家（例如人類商旅）。
3. 【重要】你的回覆 (replyText) 必須「極度簡潔」，只要用一句話告訴家長你推薦了畫面上哪幾家店即可（例如：「為您推薦布雷克寵物美學館與毛小孩寵物沙龍，詳細分析請參考下方店家卡片！」）。絕對不要在對話中列出店家的特色、距離或營業時間！

請回傳純 JSON 格式：
{
  "replyText": "極度簡潔的推薦文字...",
  "recommendedStoreIds": ["符合條件的店家ID 1", "店家ID 2"]
}`;
    }

    const finalPrompt = `${systemPrompt}\n\n【對話歷史紀錄】\n${historyText}\n\n【家長最新訊息】\n${prompt}`;

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: "application/json", // 強制 AI 回傳 JSON
        },
        contents: [
          {
            parts: [{ text: finalPrompt }],
          },
        ],
      }),
    });

    const genData = await genRes.json();

    if (!genRes.ok) {
      return NextResponse.json({ 
        action: 'chat',
        reply: `❌ 模型 [${selectedModel}] 生成失敗：${genData.error?.message || '未知錯誤'}` 
      });
    }

    const rawText = genData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (e) {
      parsedResult = {
        action: 'chat',
        replyText: "AI 思考格式異常，請再試一次。",
        recommendedStoreIds: contextStores?.map((s: any) => s.id) || []
      };
    }

    if (!isEvaluationPhase) {
      return NextResponse.json({
        action: parsedResult.action || 'chat',
        reply: parsedResult.replyText,
        keyword: parsedResult.keyword || ''
      });
    } else {
      return NextResponse.json({
        reply: parsedResult.replyText,
        recommendedIds: parsedResult.recommendedStoreIds || []
      });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      action: 'chat',
      reply: `❌ 伺服器捕捉到異常：${error?.message || '未知錯誤'}` 
    });
  }
}
