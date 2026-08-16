export async function fetchNearbyPetStores(lat: number, lng: number, keyword: string = '寵物') {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    // Return mock fallback data if API key is not configured
    return [
      { name: "毛樂園寵物美容沙龍", lat: 25.0335, lng: 121.5435, rating: 4.9 },
      { name: "台大動物醫院 24H 急診", lat: 25.0260, lng: 121.5375, rating: 4.8 }
    ];
  }
  
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results;
}
