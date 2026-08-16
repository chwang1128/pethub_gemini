import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let keyword = searchParams.get('keyword') || '寵物';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  
  // 優先使用 GEMINI_API_KEY（若有專門的 GOOGLE_MAPS_API_KEY 亦可）
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ results: [], error: "Missing API Key" });
  }

  try {
    // 整理關鍵字，避免出現重複搜尋詞
    const cleanKeyword = keyword.replace(/(狗狗|貓咪)/g, '').trim() || '寵物';
    const query = `${cleanKeyword}`;

    // 1. 先執行地點搜尋
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=50000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok || !searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 2. 為前 5 筆店家抓取詳細評論 (若 Places Details API 未開啟亦能自動容錯)
    const detailedResults = await Promise.all(
      searchData.results.slice(0, 5).map(async (place: any) => {
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,reviews,formatted_address,formatted_phone_number,opening_hours,website&language=zh-TW&key=${apiKey}`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          const details = detailData.result || {};

          const realReviews = details.reviews ? details.reviews.map((r: any) => ({
            author: r.author_name || '熱心家長',
            text: r.text || '',
            rating: r.rating || 5,
            relativeTime: r.relative_time_description || '近期'
          })) : [];

          return {
            ...place,
            phone: details.formatted_phone_number || '未提供電話',
            openingHours: details.opening_hours?.weekday_text?.join(' • ') || '今日營業中',
            website: details.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            realReviews
          };
        } catch (e) {
          // 容錯備案：細節失敗時依然回傳基本的店家資訊
          return {
            ...place,
            phone: '未提供電話',
            openingHours: '今日營業中',
            website: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            realReviews: []
          };
        }
      })
    );

    return NextResponse.json({ results: detailedResults });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, results: [] }, { status: 500 });
  }
}
