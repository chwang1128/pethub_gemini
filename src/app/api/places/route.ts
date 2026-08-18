import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawKeyword = searchParams.get('keyword') || '寵物友善';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  
  // 優先使用你的 Google Maps API Key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ results: [], error: "Missing API Key" });
  }

  // 淨化關鍵字：避免多餘問句導致 Google Maps 搜不到
  const cleanKeyword = rawKeyword.replace(/(狗狗|貓咪|\?|？|請問|我要找|想找)/g, '').trim() || '寵物友善';

  try {
    // 單純向 Google API 查詢地點名單 (不強求抓評論，保證極速且穩定)
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanKeyword)}&location=${lat},${lng}&radius=30000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    let results = searchData.results || [];
    
    // 幫前端組合好 Google Maps 真實照片的網址
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
