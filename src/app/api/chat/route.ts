import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "伺服器未設定 API Key，請檢查 Vercel 設定。" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { prompt, petProfile, contextStores } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    // 使用目前正常營運的官方端點 gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
服務毛孩：${petProfile?.name || '毛孩'} (${petProfile?.type === 'dog' ? '狗狗' : '貓咪'})
品種：${petProfile?.breed || '未填寫'}
特別註記：${petProfile?.notes || '無'}

周邊店家資訊：
${contextStores ? JSON.stringify(contextStores, null, 2) : '無'}

請以親切專業的口吻回答問題。`;

    const fullPrompt = `${systemPrompt}\n\n家長提問：${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    return NextResponse.json({
      reply: responseText,
      text: responseText,
    });

  } catch (error: any) {
    console.error("[Gemini API Error]:", error);
    return NextResponse.json(
      { error: `API 連線失敗：${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}
