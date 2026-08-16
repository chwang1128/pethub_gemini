import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || '寵物';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  try {
    // 單純向 Google API 查詢地點名單
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=20000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      return NextResponse.json({ results: searchData.results });
    }

    return NextResponse.json({ results: [] });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error.message });
  }
}
