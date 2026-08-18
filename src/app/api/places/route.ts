import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  try {
    // 1. 將搜尋半徑擴大為 5000 公尺 (5公里) 抓取更多店家
    const googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${encodeURIComponent(keyword)}&key=${apiKey}&language=zh-TW`;
    
    const res = await fetch(googleUrl);
    const data = await res.json();
    
    // 2. 幫前端組合好 Google Maps 真實照片的網址
    if (data.results) {
      data.results = data.results.map((place: any) => {
        if (place.photos && place.photos.length > 0) {
          place.photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
        }
        return place;
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
