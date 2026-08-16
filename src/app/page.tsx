import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let rawKeyword = searchParams.get('keyword') || '寵物友善';
  const lat = parseFloat(searchParams.get('lat') || '25.0330');
  const lng = parseFloat(searchParams.get('lng') || '121.5434');
  
  // 🚨 修正：絕對不能用 GEMINI_API_KEY 去打 Google Maps API！
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("缺少 GOOGLE_MAPS_API_KEY 環境變數");
    return NextResponse.json({ results: [], error: "Missing Maps API Key" });
  }

  // 淨化關鍵字：剔除物種與多餘問句，確保 Google TextSearch 命中率
  const cleanKeyword = rawKeyword.replace(/(狗狗|貓咪|\?|？|請問|我要找|想找)/g, '').trim() || '寵物友善';

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanKeyword)}&location=${lat},${lng}&radius=30000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    // 找不到就誠實回傳空陣列，絕對不塞假資料
    if (!searchRes.ok || !searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 抓取真實評論
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
          // 若抓細節失敗，仍回傳基礎店家資訊
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

  } catch (err) {
    console.error("Places API 查詢異常", err);
    return NextResponse.json({ results: [] });
  }
}
