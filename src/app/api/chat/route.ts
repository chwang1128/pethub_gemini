import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 強制指定使用 Node.js Runtime 環境
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. 取得環境變數中的 Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;

    // 🔍 關鍵除錯：在 Vercel Logs 印出金鑰載入狀態（只印出前 6 碼以策安全）
    console.log("[Gemini API] Key Status:", apiKey ? `Loaded (${apiKey.slice(0, 6)}...)` : "MISSING KEY!");

    if (!apiKey) {
      console.error("[Gemini API Error] GEMINI_API_KEY 未於環境變數中設定。");
      return NextResponse.json(
        { error: "伺服器未設定 API Key，請檢查 Vercel 環境變數設定。" },
        { status: 500 }
      );
    }

    // 2. 解析前端傳入的 Payload
    const body = await req.json();
    const { prompt, petProfile, contextStores } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "請提供提問內容 (prompt)" },
        { status: 400 }
      );
    }

    // 3. 初始化 SDK 與模型
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 4. 設計「系統提示詞 (System Prompt)」讓 Gemini 扮演 PetHub 助理
    const systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
你服務的毛孩資料如下：
- 名字：${petProfile?.name || '毛孩'}
- 種類：${petProfile?.type === 'dog' ? '狗狗' : petProfile?.type === 'cat' ? '貓咪' : '寵物'}
- 品種：${petProfile?.breed || '未填寫'}
- 年齡/生日：${petProfile?.birthday || '未填寫'}
- 家長特別註記：${petProfile?.notes || '無'}

周邊參考店家資訊：
${contextStores ? JSON.stringify(contextStores, null, 2) : '無'}

請以親切、專業、富有同理心的口吻解答家長的問題。`;

    // 5. 組合提示詞並呼叫 API
    const fullPrompt = `${systemPrompt}\n\n家長提問：${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    // 6. 回傳成功結果（同時提供 reply 與 text 欄位以相容前端）
    return NextResponse.json({
      reply: responseText,
      text: responseText,
    });

  } catch (error: any) {
    // 印出完整 Error 物件以供 Vercel Logs 除錯
    console.error("[Gemini API Detailed Error]:", error);

    return NextResponse.json(
      {
        error: "伺服器處理時發生錯誤",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
