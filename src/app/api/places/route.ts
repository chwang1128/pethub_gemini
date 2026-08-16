import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || '寵物';
  const lat = searchParams.get('lat') || '25.0330';
  const lng = searchParams.get('lng') || '121.5434';
  const apiKey = process.env.GEMINI_API_KEY; // 或你的 GOOGLE_MAPS_API_KEY

  try {
    // 1. 先進行文字搜尋抓取周邊店家
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=5000&language=zh-TW&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok || !searchData.results) {
      return NextResponse.json({ results: [] });
    }

    // 2. 針對前 5 筆店家，抓取真實顧客評論 (Place Details)
    const detailedResults = await Promise.all(
      searchData.results.slice(0, 5).map(async (place: any) => {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,reviews,formatted_address,formatted_phone_number,opening_hours,website&language=zh-TW&key=${apiKey}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        
        const details = detailData.result || {};
        
        // 整理真正的評論資料
        const realReviews = details.reviews ? details.reviews.map((r: any) => ({
          author: r.author_name,
          text: r.text,
          rating: r.rating,
          relativeTime: r.relative_time_description
        })) : [];

        return {
          ...place,
          phone: details.formatted_phone_number || '未提供電話',
          openingHours: details.opening_hours?.weekday_text?.join(' • ') || '今日營業中',
          website: details.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          realReviews // 🌟 把真實評論陣列傳給前端
        };
      })
    );

    return NextResponse.json({ results: detailedResults });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, results: [] }, { status: 500 });
  }
}
