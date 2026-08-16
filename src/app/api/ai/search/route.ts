import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // 模擬 ChatGPT 語意解析邏輯 (極速 1 次 / 2 次收斂)
    const mockIntent = {
      category: prompt.includes('急診') || prompt.includes('醫院') ? 'CLINIC' : 'GROOMING',
      targetPet: prompt.includes('貓') ? 'CAT' : 'DOG',
      querySummary: prompt,
      location: '台北市大安區',
      suggestedFilters: ['4.5星以上', '距離3km內']
    };

    return NextResponse.json({ success: true, intent: mockIntent });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'AI Processing Error' }, { status: 500 });
  }
}
