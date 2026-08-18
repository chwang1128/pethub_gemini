import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawKeyword = searchParams.get('keyword') || '寵物';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ results: [], error: "Missing API Key" });
  }

  const cleanKeyword = rawKeyword.replace(/(狗狗|貓咪|\?|？|請問|我要找|想找)/g, '').trim() || '寵物';

  try {
    // 🌟 將 radius 縮小為 2000 (方圓 2 公里)，讓 20 筆結果高度集中在使用者周邊
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanKeyword)}&location=${lat},${lng}&radius=2000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    let results = searchData.results || [];
    
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
