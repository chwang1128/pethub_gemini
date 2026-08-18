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
@@ -31,17 +30,20 @@
【任務指令：需求釐清】
家長正在尋找服務。請參考【對話歷史紀錄】，判斷家長的需求是否已經夠明確。
例如找「住宿」時，必須確認：
1. 是毛孩單獨住的「寵物旅館/安親班」，還是家長跟毛孩一起住的「寵物友善民宿/飯店」？
2. 地點要在目前位置附近，還是其他特定地區？
1. 是毛孩單獨住的寄宿，還是人寵同住的友善飯店？
2. 地點要在附近，還是指定其他縣市？

* 如果資訊【不足】，請以親切專業的口吻詢問家長（一次問1~2個重點即可）。此時 action 設為 "chat"，keyword 留空。
* 如果資訊已經【充足】，請回覆「好的，正在為您尋找...」之類的安撫語句，並將 action 設為 "search"，且務必提供一個精準的 keyword 供地圖系統搜尋（例如「新竹 寵物單獨寄宿 不關籠」或「台北 寵物友善 餐廳」）。
【極重要規則】
* 若資訊【不足】，請親切提問。⚠️【一次只能問 1 個問題】，絕對不要同時問兩個重點！
* 若資訊【充足】，請將 action 設為 "search"，並給予精準 keyword（例如「台中市西區 寵物友善餐廳」）。
* 【跨區導航神技】：若家長有明確指定「其他縣市/地區」（例如：台中、信義區），請憑你的知識在 targetLocation 提供該地區的 GPS 座標 (lat, lng)。如果沒指定地區或是說「附近」，targetLocation 請設為 null。

請回傳純 JSON 格式：
{
  "action": "chat" 或 "search",
  "replyText": "你的回覆內容...",
  "keyword": "供 Google Maps 搜尋的關鍵字（若 action 為 search 時才填寫）"
  "replyText": "你的回覆內容（一次只問一個問題）...",
  "keyword": "供 Google Maps 搜尋的關鍵字（若 action 為 search 時才填寫）",
  "targetLocation": { "lat": 24.1477, "lng": 120.6736 } // 若無指定特定地區則填 null
}`;

    } else {
@@ -58,8 +60,8 @@
${simplifiedStores.length > 0 ? JSON.stringify(simplifiedStores, null, 2) : '無'}

1. 根據【對話歷史紀錄】中家長確認過的條件，從上方店家清單挑選最適合的推薦。
2. 嚴格剔除不符合條件的店家（例如人類商旅）。
3. 【重要】你的回覆 (replyText) 必須「極度簡潔」，只要用一句話告訴家長你推薦了畫面上哪幾家店即可（例如：「為您推薦布雷克寵物美學館與毛小孩寵物沙龍，詳細分析請參考下方店家卡片！」）。絕對不要在對話中列出店家的特色、距離或營業時間！
2. 嚴格剔除不符合條件的店家。
3. 【重要】你的回覆 (replyText) 必須「極度簡潔」，只要用一句話告訴家長你推薦了畫面上哪幾家店即可。絕對不要在對話中列出店家的特色、距離或營業時間！詳細原因保留給前端店家卡片展示。

請回傳純 JSON 格式：
{
@@ -76,7 +78,7 @@
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: "application/json", // 強制 AI 回傳 JSON
          responseMimeType: "application/json",
        },
        contents: [
          {
@@ -111,19 +113,20 @@
      return NextResponse.json({
        action: parsedResult.action || 'chat',
        reply: parsedResult.replyText,
        keyword: parsedResult.keyword || ''
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
    return NextResponse.json({ 
      action: 'chat',
      reply: `❌ 伺服器捕捉到異常：${error?.message || '未知錯誤'}` 
    });
  }
}
