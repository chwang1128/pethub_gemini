import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawKeyword = searchParams.get('keyword') || '寵物友善';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  
  // 自動抓取可用的 API Key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ results: [], error: "Missing API Key" });
  }

  // 🌟 關鍵淨化：把前端傳來的「狗狗」、「貓咪」等贅字濾掉，保證 Google TextSearch 能精準命中
  const cleanKeyword = rawKeyword.replace(/(狗狗|貓咪|\?|？|請問|我要找|想找)/g, '').trim() || '寵物友善';

  try {
    // 使用 textsearch 取代 nearbysearch，支援「台中 寵物餐廳」這種跨區文字搜尋
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanKeyword)}&location=${lat},${lng}&radius=30000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    let results = searchData.results || [];
    
    // 組合真實照片網址 (不耗費額外 API 請求，速度極快)
    results = results.map((place: any) => {
      let photoUrl = null;
      if (place.photos && place.photos.length > 0) {
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
      }
      return { ...place, photoUrl };
    });

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, results: [] });
  }
}
