// 檔案路徑：src/app/api/chat/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 初始化 Gemini API (使用環境變數中的金鑰)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt, petProfile, contextStores } = await req.json();
    
    // 使用快速且提供免費額度的 gemini-1.5-flash 模型
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 🌟 設計「系統提示詞 (System Prompt)」讓 Gemini 進入角色
    const systemPrompt = `你現在是 PetHub 的「專業寵物照護助理」。
你服務的毛孩叫做：${petProfile?.name || '毛孩'}（${petProfile?.type === 'dog' ? '狗狗' : '貓咪'} / 品種：${petProfile?.breed || '不限'} / 年齡：${petProfile?.birthday || '未知'}）。
家長特別註明的注意事項：${petProfile?.notes || '無特別注意事項'}。

請遵守以下原則：
1. 語氣溫暖、專業、有同理心，且稱呼毛孩的名字。
2. 若使用者的需求與注意事項（如過敏、怕生）有衝突，請主動溫柔提醒家長。
3. 回答盡量簡明扼要（約 50~100 字內），因為畫面上還會同時顯示地圖與店家卡片。
4. 若使用者只是打招呼，請親切回應；若提出具體找店需求，請回覆：「馬上為您與 ${petProfile?.name} 掃描周邊合適的店家！」`;

    // 呼叫 Gemini 產生內容
    const result = await model.generateContent([
      systemPrompt,
      `使用者說：${prompt}`
    ]);
    
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Gemini 服務連線失敗，請檢查金鑰或網路連線。' }, { status: 500 });
  }
}
