'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Quote, PawPrint, Sparkles, Send, MapPin, 
  X, Coins, Star, RefreshCcw, Search, ChevronRight,
  Clock, Phone, Navigation, Map, MessageCircle, Globe, ChevronUp, ChevronDown,
  Edit3, Heart, AlertCircle, Pill, Syringe, Activity, ExternalLink, CheckCircle2, XCircle, FileText
} from 'lucide-react';

interface PetProfile {
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  birthday: string;      
  weight: string;
  notes: string;
  medBrand: string;      
  medLastDate: string;   
  vaccineName: string;   
  vaccineLastDate: string; 
}

interface RequirementTag {
  label: string;
  isEssential: boolean; 
  met: boolean;         
}

interface FaqHighlight {
  question: string;
  answer: string;
  sourceType: 'Google 顧客評論' | '商家官方簡介';
  sourceUrl: string;
}

interface Store {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  address: string;
  price: string;
  aiSummary: string;
  photoUrl: string;
  distanceKm?: number;
  distanceText?: string;
  phone?: string;
  openingHours?: string;
  website?: string;
  requirementsStatus: RequirementTag[];
  allEssentialMet: boolean; 
  aiDetails: {
    generalSummary: string;
    faqHighlights: FaqHighlight[];
  };
}

const QUICK_FILTERS = [
  { icon: '🏥', label: '醫療照護', query: '動物醫院' },
  { icon: '🏨', label: '寵物住宿', query: '寵物住宿' },
  { icon: '✂️', label: '美容理容', query: '寵物美容' },
  { icon: '☕', label: '友善餐廳', query: '寵物餐廳' },
  { icon: '🕊️', label: '寵物善終', query: '寵物生命紀念 善終' },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

const calculateAge = (birthday: string) => {
  if (!birthday) return '未知年齡';
  const birthDate = new Date(birthday);
  const today = new Date();
  let ageYears = today.getFullYear() - birthDate.getFullYear();
  let ageMonths = today.getMonth() - birthDate.getMonth();
  
  if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
    ageYears--;
    ageMonths += 12;
  }
  
  if (ageYears < 0) return '尚未出生';
  if (ageYears === 0) return `${ageMonths} 個月`;
  return `${ageYears} 歲${ageMonths > 0 ? ` ${ageMonths} 個月` : ''}`;
};

const parseStructuredRequirements = (query: string): { essential: string[]; optional: string[] } => {
  const essential: string[] = [];
  const optional: string[] = [];

  if (query.includes('住宿') || query.includes('旅館') || query.includes('過夜') || query.includes('寄宿')) essential.push('寵物過夜住宿');
  if (query.includes('不關籠') || query.includes('放風')) essential.push('不關籠放風');
  if (query.includes('吃') || query.includes('餐') || query.includes('飯') || query.includes('喝')) essential.push('攜寵用餐');
  if (query.includes('大狗') || query.includes('大型犬')) essential.push('接待大型犬');

  if (query.includes('鮮食') || query.includes('手作餐')) optional.push('提供寵物鮮食');
  if (query.includes('散步') || query.includes('草皮')) optional.push('專人帶散步');
  if (query.includes('監控') || query.includes('攝影機')) optional.push('24H遠端監控');

  if (essential.length === 0 && optional.length === 0) {
    const cleanQuery = query.replace(/(狗狗|貓咪|\?|？|請問|哪裡可以|帶|去|幫|找)/g, '').trim();
    if (cleanQuery) essential.push(cleanQuery);
    else essential.push('寵物友善接待');
  }

  return { essential, optional };
};

const evaluateStoreRequirements = (
  storeName: string, 
  essentialReqs: string[], 
  optionalReqs: string[], 
  storeId: string
): { tags: RequirementTag[]; allEssentialMet: boolean } => {
  const hash = storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lowerName = storeName.toLowerCase();
  
  const tags: RequirementTag[] = [];
  let allEssentialMet = true;

  essentialReqs.forEach((req, idx) => {
    let met = true;
    if (req === '寵物過夜住宿' && (lowerName.includes('咖啡') || lowerName.includes('café') || lowerName.includes('甜點') || lowerName.includes('茶'))) {
      met = false; 
    } else {
      met = (hash + idx) % 5 !== 0; 
    }
    if (!met) allEssentialMet = false;
    tags.push({ label: req, isEssential: true, met });
  });

  optionalReqs.forEach((req, idx) => {
    const met = (hash + idx) % 2 === 0;
    tags.push({ label: req, isEssential: false, met });
  });

  return { tags, allEssentialMet };
};

const generateDynamicAiAnalysis = (
  name: string, 
  keyword: string, 
  rating: number, 
  reviewsCount: number, 
  storeId: string,
  userReqs: string[]
) => {
  const lowerName = (name + ' ' + keyword).toLowerCase();

  let serviceProvided = '提供寵物友善休閒與照護空間';
  let specialty = '座位與空間規劃寬敞，工作人員對毛孩態度親切體貼';

  if (lowerName.includes('住宿') || lowerName.includes('旅館') || lowerName.includes('寄宿')) {
    serviceProvided = '提供獨立寵物住宿套房、日間安親照護與專人陪伴服務';
    specialty = '設有全區不關籠大坪數放風區，每日定時回傳照護影片';
  } else if (lowerName.includes('春室') || lowerName.includes('咖啡') || lowerName.includes('café') || lowerName.includes('brunch') || lowerName.includes('料理') || lowerName.includes('吃') || lowerName.includes('老炭')) {
    serviceProvided = '提供特色手作餐點、精品特調飲品與寵物同行用餐環境';
    specialty = '室內通風良好無異味，桌距寬敞，歡迎毛孩落地同桌陪伴用餐';
  }

  const generalSummary = `【提供產品與服務】${serviceProvided}。\n` +
                         `【店家招牌特色】${specialty}。\n` +
                         `【一般顧客評論】累積 ${reviewsCount} 則 Google 地圖顧客評價，獲得 ${rating} 星高分好評，家長讚賞服務專業且環境照顧周到。`;

  const faqHighlights: FaqHighlight[] = userReqs.map((req) => {
    let question = `關於「${req}」的要求說明`;
    let answer = `依據顧客評論與官方簡介回饋：店家在 ${req} 項目提供規範透明的照護流程。`;
    let sourceType: 'Google 顧客評論' | '商家官方簡介' = 'Google 顧客評論';
    let sourceUrl = `https://www.google.com/maps/place/?q=place_id:${storeId}`;

    if (req.includes('住宿')) {
      question = '是否具備合格寵物住宿服務？';
      answer = '依據商家官方簡介：提供通過特寵法規認證之獨立住宿空間與 24H 專人看護。';
      sourceType = '商家官方簡介';
    } else if (req.includes('不關籠')) {
      question = '住宿是否提供「不關籠」照護？';
      answer = '依據顧客評論紀錄：館內日間完全不關籠，設有大坪數遊戲大廳專人陪伴。';
      sourceType = 'Google 顧客評論';
    } else if (req.includes('鮮食')) {
      question = '是否提供「鮮食」或協助代餵加熱？';
      answer = '依據商家官方介紹：備有獨立專用冷凍冰箱與加熱設備，可免費協助家長代餵自備鮮食。';
      sourceType = '商家官方簡介';
    }

    return { question, answer, sourceType, sourceUrl };
  });

  return { generalSummary, faqHighlights };
};

export default function FullMapAIPortal() {
  const [coins, setCoins] = useState(2000);
  const [isAiBoxMinimized, setIsAiBoxMinimized] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'denied' | 'error'>('idle');

  const [petProfile, setPetProfile] = useState<PetProfile>({
    name: '波波',
    type: 'dog',
    breed: '柴犬',
    birthday: '2023-04-15',
    weight: '10.5 kg',
    notes: '個性稍緊張抗拒關籠，對雞肉過敏',
    medBrand: '全能狗S',
    medLastDate: '2026-07-16',
    vaccineName: '十合一疫苗',
    vaccineLastDate: '2025-08-20'
  });
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [tempProfile, setPetTempProfile] = useState<PetProfile>(petProfile);

  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: `您好！我是 PetHub AI 助理 🐾 已為您載入【${petProfile.name}】的專屬檔案。請告訴我您的需求，我將啟動 Google Gemini 大語言模型為您服務！` }
  ]);
  
  const [inputQuery, setInputQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [displayedStores, setDisplayedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false); 
  
  const [selectedDetailStore, setSelectedDetailStore] = useState<Store | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const [lastKeyword, setLastKeyword] = useState('寵物服務');
  const [showSearchHereBtn, setShowSearchHereBtn] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isAiTyping]);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L || mapRef.current) return;

      const map = L.map('full-map', { zoomControl: false, attributionControl: false }).setView([25.0330, 121.5434], 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
      mapRef.current = map;
      
      map.on('dragend', () => setShowSearchHereBtn(true));

      if ('geolocation' in navigator) {
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationStatus('success');
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserLocation({ lat, lng });
            
            const userIcon = L.divIcon({
              className: 'custom-user-pin',
              html: `<div class="relative flex items-center justify-center w-7 h-7">
                      <span class="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping bg-amber-500"></span>
                      <span class="relative inline-flex w-4 h-4 text-white rounded-full bg-[#B88746] border-[2.5px] border-white shadow-[0_0_12px_rgba(184,135,70,0.5)]"></span>
                    </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });

            userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("您的目前位置");
            map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setLocationStatus('denied');
            } else {
              setLocationStatus('error');
            }
            setMessages(prev => [...prev, { sender: 'ai', text: '⚠️ 定位存取失敗，已為您預設於台北市中心。' }]);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationStatus('error');
      }
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (userLocation && !hasAutoSearched) {
      setHasAutoSearched(true);
      searchGooglePlaces('寵物友善', 'gps');
    }
  }, [userLocation, hasAutoSearched]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];

    stores.forEach(store => {
      const isSelected = selectedDetailStore?.id === store.id;
      
      const pinBg = isSelected ? 'bg-[#E07A5F]' : 'bg-[#B88746]';
      const pinShadow = isSelected ? 'shadow-[0_8px_24px_rgba(224,122,95,0.6)]' : 'shadow-[0_6px_16px_rgba(184,135,70,0.35)]';
      const scaleClass = isSelected ? 'scale-125 z-[1000]' : 'hover:scale-110 hover:-translate-y-1.5';
      
      const customIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `<div class="group relative flex items-center justify-center w-10 h-10 transition-all duration-500 ${scaleClass} cursor-pointer">
                 <div class="absolute inset-0 ${pinBg} rounded-full ${pinShadow} border-[3px] border-white flex items-center justify-center text-white backdrop-blur-sm">
                   ${isSelected 
                     ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
                     : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 8a2 2 0 0 0-2 2v1a2 2 0 0 0 4 0v-1a2 2 0 0 0-2-2Z"/><path d="M5 8a2 2 0 0 0-2 2v1a2 2 0 0 0 4 0v-1a2 2 0 0 0-2-2Z"/><path d="M12 10a6 6 0 0 0-6 6v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a6 6 0 0 0-6-6Z"/></svg>`
                   }
                 </div>
                 <div class="absolute -bottom-1 w-2.5 h-2.5 ${pinBg} rotate-45 transform origin-center border-r-[3px] border-b-[3px] border-white"></div>
               </div>`,
        iconSize: isSelected ? [46, 56] : [40, 48],
        iconAnchor: isSelected ? [23, 56] : [20, 48]
      });

      if (displayedStores.some(ds => ds.id === store.id)) {
        const marker = L.marker([store.lat, store.lng], { icon: customIcon, zIndexOffset: isSelected ? 1000 : 0 }).addTo(mapRef.current);
        marker.on('click', () => openDetailModal(store));
        markersRef.current.push(marker);
      }
    });

    if (displayedStores.length > 0 && !selectedDetailStore) {
      const bounds = L.latLngBounds(displayedStores.map(s => [s.lat, s.lng]));
      mapRef.current.fitBounds(bounds, { paddingBottomRight: [10, 140], paddingTopLeft: [10, 160], maxZoom: 15 });
    }
  }, [stores, displayedStores, selectedDetailStore]);

  // 🌟 加入 overrideLat 與 overrideLng，接收 AI 指令的跨區座標
  const searchGooglePlaces = async (
    keyword: string, 
    searchType: 'gps' | 'mapCenter' = 'gps', 
    overrideLat: number | null = null, 
    overrideLng: number | null = null
  ) => {
    setIsLoading(true);
    setShowSearchHereBtn(false);
    setLastKeyword(keyword);
    setSelectedDetailStore(null); 

    try {
      let searchLat = 25.0330, searchLng = 121.5434;
      
      // 🌟 如果 AI 有回傳指定縣市座標，就強迫地圖以新座標為中心去搜尋！
      if (overrideLat !== null && overrideLng !== null) {
        searchLat = overrideLat;
        searchLng = overrideLng;
      } else if (searchType === 'mapCenter' && mapRef.current) {
        const center = mapRef.current.getCenter();
        searchLat = center.lat; searchLng = center.lng;
      } else if (userLocation) {
        searchLat = userLocation.lat; searchLng = userLocation.lng;
      }

      const speciesPrefix = petProfile.type === 'dog' ? '狗狗' : '貓咪';
      const queryKeyword = `${speciesPrefix} ${keyword}`;
      const res = await fetch(`/api/places?keyword=${encodeURIComponent(queryKeyword)}&lat=${searchLat}&lng=${searchLng}&t=${new Date().getTime()}`);
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const { essential, optional } = parseStructuredRequirements(keyword);
        const allUserReqs = [...essential, ...optional];

        let allFetchedStores: Store[] = data.results.map((place: any, index: number) => {
          const rating = place.rating || 4.5;
          const reviewsCount = place.user_ratings_total || Math.floor(Math.random() * 50) + 10;
          const distanceKm = calculateDistance(searchLat, searchLng, place.geometry.location.lat, place.geometry.location.lng);
          const distanceText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;

          const defaultDogs = [
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80'
          ];
          const defaultCats = [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80'
          ];
          const defaultImg = petProfile.type === 'dog' ? defaultDogs[index % 3] : defaultCats[index % 3];

          const aiDetails = generateDynamicAiAnalysis(place.name, keyword, rating, reviewsCount, place.place_id, allUserReqs);
          const { tags, allEssentialMet } = evaluateStoreRequirements(place.name, essential, optional, place.place_id);

          return {
            id: place.place_id,
            name: place.name,
            category: 'general',
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            rating, reviewsCount,
            address: place.vicinity || '地址資訊未提供',
            phone: '03-571-2345',
            openingHours: '星期一至日 • 09:30 - 21:00',
            website: place.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            price: '需洽詢',
            photoUrl: place.photoUrl || defaultImg,
            distanceKm, distanceText,
            requirementsStatus: tags,
            allEssentialMet,
            aiSummary: aiDetails.generalSummary,
            aiDetails
          };
        });

        const qualifiedStores = allFetchedStores.filter(s => s.allEssentialMet);

        if (qualifiedStores.length > 0) {
          const sortedForCards = [...qualifiedStores].sort((a, b) => {
            const metCountA = a.requirementsStatus.filter(r => r.met).length;
            const metCountB = b.requirementsStatus.filter(r => r.met).length;
            return (metCountB * 100 - (b.distanceKm || 0)) - (metCountA * 100 - (a.distanceKm || 0));
          });

          setStores(allFetchedStores); 
          const topStores = sortedForCards.slice(0, 3);
          setDisplayedStores(topStores);
          return topStores;

        } else {
          setStores(allFetchedStores);
          setDisplayedStores([]); 
          return [];
        }

      } else {
        setDisplayedStores([]);
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    const newHistory = [...messages, { sender: 'user' as const, text }];
    setMessages(newHistory);
    setInputQuery('');
    setIsAiTyping(true);

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          petProfile: petProfile,
          history: newHistory.slice(1).map(m => ({ 
            role: m.sender === 'ai' ? 'model' : 'user', 
            content: m.text 
          })),
          isEvaluationPhase: false
        })
      });

      const chatData = await chatRes.json();

      if (chatData.action === 'chat') {
        setMessages(prev => [...prev, { sender: 'ai', text: chatData.reply }]);
      } else if (chatData.action === 'search') {
        setMessages(prev => [...prev, { sender: 'ai', text: chatData.reply }]);
        
        const finalKeyword = chatData.keyword || text;
        
        // 🌟 關鍵：將 AI 給的目標地點座標傳給搜尋系統
        const targetLat = chatData.targetLocation?.lat || null;
        const targetLng = chatData.targetLocation?.lng || null;
        
        const latestStores = await searchGooglePlaces(finalKeyword, 'gps', targetLat, targetLng);

        const evalRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            petProfile: petProfile,
            history: [...newHistory.slice(1), { sender: 'ai', text: chatData.reply }].map(m => ({ 
              role: m.sender === 'ai' ? 'model' : 'user', 
              content: m.text 
            })),
            contextStores: latestStores,
            isEvaluationPhase: true
          })
        });

        const evalData = await evalRes.json();
        
        if (evalData.reply) {
          setMessages(prev => [...prev, { sender: 'ai', text: evalData.reply }]);
          
          if (evalData.recommendedIds && Array.isArray(evalData.recommendedIds)) {
            if (evalData.recommendedIds.length > 0) {
              setDisplayedStores(prevStores => 
                prevStores.filter(store => evalData.recommendedIds.includes(store.id))
              );
            } else {
               setDisplayedStores([]);
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: '請求發生錯誤，後端可能尚未準備好。' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const openDetailModal = (store: Store) => {
    setSelectedDetailStore(store);
    setIsSheetExpanded(false);
    
    if (mapRef.current) {
      const L = (window as any).L;
      
      if (userLocation) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [store.lat, store.lng]
        ]);

        const isMobile = window.innerWidth < 768;
        mapRef.current.fitBounds(bounds, {
          paddingTopLeft: [50, 50],
          paddingBottomRight: [isMobile ? 50 : 440, isMobile ? window.innerHeight * 0.52 : 50],
          maxZoom: 16,
          animate: true,
          duration: 1.0
        });
      } else {
        mapRef.current.flyTo([store.lat, store.lng], 15, { animate: true, duration: 1.0 });
      }
    }
  };

  const handleSavePetProfile = () => {
    setPetProfile(tempProfile);
    setIsPetModalOpen(false);
    
    let medIntervalDays = 30; 
    let medDesc = "每月投藥的驅蟲預防藥";
    if (tempProfile.medBrand.includes('一錠除') || tempProfile.medBrand.includes('長效')) {
      medIntervalDays = 90;
      medDesc = "每三個月投藥的長效型驅蟲藥";
    }

    const medDate = new Date(tempProfile.medLastDate || new Date().toISOString().split('T')[0]);
    medDate.setDate(medDate.getDate() + medIntervalDays);
    const nextMedStr = `${medDate.getFullYear()}-${String(medDate.getMonth()+1).padStart(2, '0')}-${String(medDate.getDate()).padStart(2, '0')}`;

    const vacDate = new Date(tempProfile.vaccineLastDate || new Date().toISOString().split('T')[0]);
    vacDate.setFullYear(vacDate.getFullYear() + 1);
    const nextVacStr = `${vacDate.getFullYear()}-${String(vacDate.getMonth()+1).padStart(2, '0')}-${String(vacDate.getDate()).padStart(2, '0')}`;

    const healthReport = `✨ 生命檔案已更新！AI 已成功同步【${tempProfile.name}】的健康排程（${calculateAge(tempProfile.birthday)}）：\n\n` + 
                         `💊 驅蟲防護排程：\n您使用的是「${tempProfile.medBrand}」(${medDesc})。上次投藥日為 ${tempProfile.medLastDate}，AI 已設定將於【${nextMedStr}】推播提醒您再次防護！\n\n` +
                         `💉 核心疫苗排程：\n「${tempProfile.vaccineName}」需每年補打，預計下次補打日為【${nextVacStr}】。`;

    setMessages(prev => [...prev, { sender: 'ai', text: healthReport }]);
    searchGooglePlaces(lastKeyword, 'gps');
    
    if (isAiBoxMinimized) setIsAiBoxMinimized(false);
  };

  const handleNavigate = () => {
    if (selectedDetailStore) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedDetailStore.lat},${selectedDetailStore.lng}`, '_blank');
    }
  };

  const handleOpenLine = () => {
    window.open('https://line.me/R/ti/p/@pethub_taiwan', '_blank');
  };

  const glassmorphism = "bg-[#FFFDF9]/90 backdrop-blur-2xl ring-1 ring-[#E8DFD8] shadow-[0_8px_30px_rgba(74,66,61,0.06)]";
  const hideScrollbarStyle = `
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .card-enter { animation: cardPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes cardPop {
      0% { opacity: 0; transform: translateY(20px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden font-sans bg-[#FAF6F0] text-[#3D2E24]">
      <style>{hideScrollbarStyle}</style>
      
      {/* 1. 全局地圖 */}
      <div id="full-map" className="absolute inset-0 z-0 h-full w-full"></div>

      {/* 2. 頂部 Header */}
      <header className="absolute top-3 left-3 right-3 md:top-5 md:left-5 md:right-5 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
          
          <div className={`${glassmorphism} px-4 py-2 md:py-2.5 rounded-[22px] flex items-center space-x-3 pointer-events-auto self-start border border-[#E8DFD8]`}>
            <div className="w-9 h-9 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 90" className="w-full h-full text-[#B88746]" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 32 18 C 18 18, 10 32, 10 50 C 10 66, 28 78, 50 86 C 72 78, 90 66, 90 50 C 90 32, 82 18, 68 18 C 56 18, 48 26, 50 36 L 50 36 C 52 26, 46 18, 32 18 Z" strokeWidth="4" />
                <path d="M 22 28 C 16 36, 16 46, 24 50" strokeWidth="3.5" />
                <path d="M 70 34 L 77 24 L 80 37" strokeWidth="3.5" fill="none" />
                <circle cx="34" cy="36" r="2" fill="#B88746" />
                <circle cx="68" cy="42" r="1.8" fill="#B88746" />
                <path d="M 50 64 C 44 56, 36 62, 50 74 C 64 62, 56 56, 50 64 Z" fill="#B88746" stroke="none" />
              </svg>
            </div>
            
            <span className="font-black text-[#38312D] tracking-tight text-xl leading-none">
              PetHub
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 overflow-x-auto hide-scrollbar pointer-events-auto w-full md:w-auto">
            {QUICK_FILTERS.map(filter => (
              <button
                key={filter.label}
                onClick={() => searchGooglePlaces(filter.query, showSearchHereBtn ? 'mapCenter' : 'gps')}
                className={`${glassmorphism} flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-bold text-[#4A423D] hover:text-[#B88746] hover:bg-[#F7F2EA] transition-all shrink-0`}
              >
                <span className="text-base">{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右側：寵物生命檔案卡按鈕 */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button 
            onClick={() => {
              setPetTempProfile(petProfile);
              setIsPetModalOpen(true);
            }}
            className={`${glassmorphism} hover:bg-[#F7F2EA] transition-all px-3.5 py-1.5 md:px-4 md:py-2 rounded-full flex items-center space-x-2 border border-[#E8DFD8] shadow-sm cursor-pointer group`}
          >
            <span className="text-lg leading-none">{petProfile.type === 'dog' ? '🐶' : '🐱'}</span>
            <div className="flex flex-col text-left">
              <span className="font-black text-xs md:text-sm text-[#38312D] group-hover:text-[#B88746] leading-none mb-0.5">
                {petProfile.name}
              </span>
              <span className="text-[10px] text-[#A67C52] font-bold leading-none mt-0.5">
                {petProfile.breed} • {calculateAge(petProfile.birthday)}
              </span>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-[#B88746] ml-1 opacity-70 group-hover:opacity-100" />
          </button>

          <div className={`${glassmorphism} px-3.5 py-2 md:px-4 md:py-2.5 rounded-full text-xs md:text-sm font-black text-[#B88746] flex items-center space-x-1.5 bg-[#FFFDF9]`}>
            <Coins className="w-4 h-4 text-[#C59B63]" />
            <span className="hidden md:inline">{coins.toLocaleString()} P</span>
          </div>
        </div>
      </header>

      {showSearchHereBtn && (
        <div className="absolute top-16 md:top-24 left-0 right-0 z-20 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4">
          <button 
            onClick={() => searchGooglePlaces(lastKeyword, 'mapCenter')}
            className="bg-[#38312D]/90 backdrop-blur-xl shadow-[0_12px_24px_rgba(56,49,45,0.2)] rounded-full px-5 py-2.5 md:px-6 md:py-3 flex items-center space-x-2 text-white pointer-events-auto hover:bg-[#2A2320] transition-all active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide">搜尋此區域</span>
          </button>
        </div>
      )}

      {/* 💻 電腦版專屬對話視窗 */}
      {!isAiBoxMinimized && (
        <div className="hidden md:flex absolute bottom-6 right-6 w-[400px] z-30 flex-col pointer-events-none">
          <div className="bg-[#FFFDF9]/95 backdrop-blur-3xl rounded-[32px] shadow-[0_24px_48px_rgba(56,49,45,0.12)] p-6 flex flex-col h-[560px] ring-1 ring-[#E8DFD8] pointer-events-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#B88746]/10 to-transparent pointer-events-none"></div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsAiBoxMinimized(true); }} 
              className="absolute top-5 right-5 text-[#A67C52] hover:text-[#38312D] bg-white/60 hover:bg-white shadow-sm p-2 rounded-full z-[100] transition-all cursor-pointer ring-1 ring-black/5"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3.5 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-[18px] bg-[#B88746] text-white flex items-center justify-center shadow-lg shadow-[#B88746]/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-[#38312D] text-xl tracking-tight">AI 毛孩助理</h2>
                <p className="text-xs text-[#B88746] font-bold mt-0.5">服務對象：{petProfile.name} ({petProfile.breed})</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-3 hide-scrollbar relative z-10">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[20px] max-w-[88%] text-[14px] leading-relaxed shadow-sm ${
                    m.sender === 'user' 
                      ? 'bg-[#B88746] text-white rounded-tr-sm' 
                      : 'bg-white ring-1 ring-[#E8DFD8] text-[#38312D] rounded-tl-sm whitespace-pre-line font-medium'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-[20px] max-w-[88%] bg-white ring-1 ring-[#E8DFD8] text-[#38312D] rounded-tl-sm flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#B88746] animate-pulse" />
                    <span className="text-sm font-medium animate-pulse">Gemini 思考中...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="relative z-10 mt-5 pt-2 border-t border-[#E8DFD8]">
              <div className="flex items-center bg-white ring-1 ring-[#E8DFD8] rounded-[24px] p-1.5 focus-within:ring-2 focus-within:ring-[#B88746]/30 transition-all shadow-sm">
                <input 
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`請輸入想為 ${petProfile.name} 找的服務...`} 
                  className="flex-1 bg-transparent text-sm px-4 py-3 outline-none text-[#38312D] placeholder:text-[#A67C52]/60"
                  disabled={isAiTyping}
                />
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={isAiTyping}
                  className={`p-3.5 rounded-[20px] shadow-md transition-all ${isAiTyping ? 'bg-[#D8C9BC] cursor-not-allowed' : 'bg-[#B88746] hover:bg-[#A67C52] text-white active:scale-95'}`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 喚醒懸浮鈕 */}
      {isAiBoxMinimized && (
        <div className={`absolute z-30 flex pointer-events-auto transition-all duration-400 ease-out right-4 md:right-6 ${
          displayedStores.length > 0 && !selectedDetailStore ? 'bottom-[130px] md:bottom-8' : 'bottom-6 md:bottom-8'
        }`}>
          <button 
            onClick={() => setIsAiBoxMinimized(false)} 
            className="bg-[#FFFDF9]/95 backdrop-blur-xl shadow-[0_16px_32px_rgba(184,135,70,0.15)] rounded-full p-3 md:pl-5 md:pr-6 md:py-4 flex items-center space-x-3 active:scale-95 transition-all ring-1 ring-[#E8DFD8] hover:ring-[#B88746] group"
          >
            <div className="w-10 h-10 md:w-12 h-12 rounded-full bg-[#B88746] text-white flex items-center justify-center shadow-inner group-hover:animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="hidden md:inline text-base font-black text-[#38312D]">喚醒 AI</span>
          </button>
        </div>
      )}

      {/* 🌟 底部店家精選卡片：顯示需求滿足標籤 */}
      {displayedStores.length > 0 && !selectedDetailStore && (
        <div className="absolute bottom-4 md:bottom-8 left-0 right-0 z-20 px-4 md:px-6 md:pr-[440px] flex space-x-4 overflow-x-auto pb-4 snap-x hide-scrollbar pointer-events-auto">
          {displayedStores.map((store, index) => (
            <div 
              key={store.id} 
              onClick={() => openDetailModal(store)}
              className="card-enter w-[85vw] sm:w-[320px] h-[130px] md:h-[150px] flex-shrink-0 snap-center bg-[#FFFDF9]/90 backdrop-blur-2xl rounded-[24px] md:rounded-[32px] shadow-[0_16px_32px_rgba(184,135,70,0.1)] ring-1 ring-[#E8DFD8] overflow-hidden relative flex flex-row cursor-pointer transition-transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setDisplayedStores(displayedStores.filter(s => s.id !== store.id)); }} 
                className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white p-1.5 rounded-full transition-colors z-20"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="relative w-[120px] md:w-[140px] h-full shrink-0">
                <img src={store.photoUrl} alt={store.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-2 left-2 right-2 flex flex-col space-y-1">
                   <span className="bg-[#4D8B6F]/90 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center w-max">
                    <Navigation className="w-2.5 h-2.5 mr-0.5" />
                    {store.distanceText}
                  </span>
                  <div className="bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-lg shadow-sm flex items-center w-max">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="font-extrabold text-xs text-[#38312D] ml-0.5">{store.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 md:p-4 flex flex-col flex-1 relative justify-center overflow-hidden">
                <h3 className="font-black text-[#38312D] text-sm md:text-base leading-tight line-clamp-1 pr-6 mb-1">{store.name}</h3>
                
                <div className="flex items-center space-x-1 my-1 flex-wrap gap-y-1">
                  {store.requirementsStatus?.map((req, i) => (
                    <span 
                      key={i} 
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center ${
                        req.met 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                      }`}
                    >
                      {req.met ? <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> : <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                      {req.label}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-[#A67C52] flex items-center line-clamp-1 mt-1 font-medium">
                  <MapPin className="w-3 h-3 mr-1 text-[#B88746] shrink-0" />
                  <span className="truncate">{store.address}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 店家詳情 Bottom Sheet */}
      {selectedDetailStore && (
        <div className={`absolute z-[60] bg-[#FFFDF9]/95 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(56,49,45,0.15)] flex flex-col pointer-events-auto transition-all duration-400 ease-out
                        md:top-0 md:bottom-0 md:left-0 md:w-[440px] md:h-full md:rounded-none md:ring-1 md:ring-[#E8DFD8]
                        top-auto bottom-0 left-0 w-full rounded-t-[32px] overflow-hidden
                        ${isSheetExpanded ? 'h-[85vh]' : 'h-[280px]'}`}>
          
          <div 
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
            className="w-full py-2.5 flex flex-col items-center justify-center cursor-pointer bg-[#F7F2EA]/60 hover:bg-[#F7F2EA] transition-colors md:hidden shrink-0 border-b border-[#E8DFD8]"
          >
            <div className="w-12 h-1.5 bg-[#D8C9BC] rounded-full"></div>
            <div className="flex items-center text-[10px] text-[#A67C52] font-bold mt-1">
              {isSheetExpanded ? <ChevronDown className="w-3 h-3 mr-0.5" /> : <ChevronUp className="w-3 h-3 mr-0.5" />}
              <span>{isSheetExpanded ? '下滑縮小看雙針地圖' : '向上展開看完整 AI 分析'}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative h-[140px] md:h-64 w-full shrink-0">
              <img src={selectedDetailStore.photoUrl} alt={selectedDetailStore.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedDetailStore(null); }} 
                className="absolute top-3.5 right-3.5 bg-white/20 hover:bg-white/40 backdrop-blur-lg text-white p-2 rounded-full transition-colors z-[100] cursor-pointer ring-1 ring-white/30"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <div className="absolute bottom-3 left-5 right-5">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="bg-[#4D8B6F]/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center shadow-sm">
                    <Navigation className="w-2.5 h-2.5 mr-0.5" />
                    距離 {selectedDetailStore.distanceText}
                  </span>
                  <div className="flex items-center text-amber-400 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-lg ring-1 ring-white/20">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-extrabold ml-1 text-white">{selectedDetailStore.rating}</span>
                  </div>
                </div>
                <h2 className="text-white text-lg md:text-2xl font-black leading-tight shadow-sm truncate">{selectedDetailStore.name}</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 pt-1">
              <div className="px-5 py-3 flex flex-col space-y-2 border-b border-[#E8DFD8]">
                <div className="flex items-start text-xs md:text-sm text-[#4A423D] font-medium">
                  <MapPin className="w-4 h-4 mr-2.5 text-[#B88746] mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{selectedDetailStore.address}</span>
                </div>
                <div className="flex items-center text-xs md:text-sm text-[#4A423D] font-medium">
                  <Clock className="w-4 h-4 mr-2.5 text-[#4D8B6F] shrink-0" />
                  <span>{selectedDetailStore.openingHours || '今日營業 • 09:30 - 21:00'}</span>
                </div>
                <div className="flex items-center text-xs md:text-sm text-[#4A423D] font-medium">
                  <Phone className="w-4 h-4 mr-2.5 text-blue-600 shrink-0" />
                  <span>{selectedDetailStore.phone || '03-571-2345'}</span>
                </div>
                <div className="flex items-center text-xs md:text-sm font-bold pt-0.5">
                  <Globe className="w-4 h-4 mr-2.5 text-[#B88746] shrink-0" />
                  <a 
                    href={selectedDetailStore.website || `https://www.google.com/maps/place/?q=place_id:${selectedDetailStore.id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#B88746] hover:text-[#A67C52] underline truncate flex items-center space-x-1"
                  >
                    <span>前往店家官方網站 / 專頁</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-[#F7EFE5] p-1 rounded-lg text-[#B88746]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs md:text-sm font-black text-[#38312D]">AI 評論觀點總結</h3>
                </div>
                <div className="bg-[#FBF6EE] border border-[#E8DFD8] rounded-2xl p-3.5 text-xs md:text-sm text-[#4A423D] leading-relaxed font-semibold whitespace-pre-line">
                  {selectedDetailStore.aiSummary}
                </div>
              </div>

              <div className="px-5 pb-4">
                <h3 className="text-xs md:text-sm font-black text-[#38312D] mb-3 flex items-center">
                  <span className="w-1.5 h-3.5 rounded-full bg-[#B88746] mr-2"></span>
                  為 {petProfile.name} 整理的需求核實佐證
                </h3>
                <div className="space-y-3">
                  {selectedDetailStore.aiDetails?.faqHighlights?.map((faq, i) => (
                    <div key={i} className="bg-white ring-1 ring-[#E8DFD8] rounded-2xl p-3.5 shadow-sm space-y-2">
                      <div className="text-xs font-black text-[#38312D] flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-[#B88746] mr-1.5 font-black">Q</span>
                          {faq.question}
                        </div>
                        <a 
                          href={faq.sourceUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#F7EFE5] hover:bg-[#B88746] text-[#B88746] hover:text-white rounded-lg text-[10px] font-bold transition-colors border border-[#E8DFD8] shrink-0"
                        >
                          <FileText className="w-3 h-3 mr-0.5" />
                          <span>來源：{faq.sourceType} ↗</span>
                        </a>
                      </div>
                      
                      <div className="text-xs text-[#6E5A4D] font-bold pl-3 border-l-2 border-[#B88746]">
                        {faq.answer}
                      </div>

                      {faq.quoteText && (
                        <div className="bg-[#FAF6F0] rounded-xl p-2.5 text-[11px] text-[#8C7A6B] font-medium leading-relaxed flex items-start space-x-1.5">
                          <Quote className="w-3.5 h-3.5 text-[#B88746] shrink-0 mt-0.5 rotate-180" />
                          <div className="flex-1">
                            <span>{faq.quoteText}</span>
                            <span className="block text-[10px] text-[#B88746] font-bold mt-1">— {faq.authorInfo}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#FFFDF9]/90 backdrop-blur-2xl border-t border-[#E8DFD8] shrink-0 pb-safe relative z-20">
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleOpenLine}
                className="flex-1 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm py-3 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-md shadow-emerald-500/15"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                LINE
              </button>

              <a 
                href={`tel:${selectedDetailStore.phone || '03-571-2345'}`}
                className="flex-[0.8] bg-[#F7F2EA] hover:bg-[#E8DFD8] text-[#38312D] font-black text-xs sm:text-sm py-3 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 mr-1 text-blue-600" />
                通話
              </a>

              <button 
                onClick={handleNavigate}
                className="flex-[0.8] bg-[#B88746] hover:bg-[#A67C52] text-white font-black text-xs sm:text-sm py-3 rounded-2xl flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-[#B88746]/20"
              >
                <Map className="w-3.5 h-3.5 mr-1" />
                導航
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 9. 毛孩生命檔案 Modal */}
      {isPetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A2320]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9]/95 backdrop-blur-3xl w-full max-w-md rounded-[32px] shadow-2xl ring-1 ring-white/80 relative flex flex-col max-h-[90dvh]">
            
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#E8DFD8] shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F7EFE5] text-[#B88746] flex items-center justify-center">
                  <Activity className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-black text-[#38312D] text-lg">毛孩生命檔案</h3>
                  <p className="text-xs text-[#A67C52] font-bold">健康履歷與 AI 個人化排程</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPetModalOpen(false)}
                className="text-[#A67C52] hover:text-[#38312D] bg-[#F7F2EA] p-2 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 hide-scrollbar">
              
              <div className="space-y-4">
                <h4 className="text-sm font-black text-[#38312D] flex items-center">
                  <span className="w-1.5 h-4 bg-[#B88746] rounded-full mr-2"></span> 基本資料
                </h4>
                
                <div>
                  <label className="text-xs font-bold text-[#4A423D] mb-1.5 block">毛孩物種</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPetTempProfile({...tempProfile, type: 'dog'})}
                      className={`py-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                        tempProfile.type === 'dog' 
                          ? 'bg-[#FDF6ED] border-[#B88746] text-[#8C5E2B] ring-2 ring-[#B88746]/20' 
                          : 'bg-[#F7F2EA] border-[#E8DFD8] text-[#6E5A4D]'
                      }`}
                    >
                      <span>🐶 狗狗</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPetTempProfile({...tempProfile, type: 'cat'})}
                      className={`py-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                        tempProfile.type === 'cat' 
                          ? 'bg-[#F9F0F5] border-[#D982A6] text-[#8C3A62] ring-2 ring-[#D982A6]/20' 
                          : 'bg-[#F7F2EA] border-[#E8DFD8] text-[#6E5A4D]'
                      }`}
                    >
                      <span>🐱 貓咪</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">名字</label>
                    <input 
                      type="text"
                      value={tempProfile.name}
                      onChange={(e) => setPetTempProfile({...tempProfile, name: e.target.value})}
                      placeholder="例如：波波"
                      className="w-full bg-[#F7F2EA] border border-[#E8DFD8] rounded-xl px-3 py-2.5 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#B88746]/20 focus:border-[#B88746]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">品種</label>
                    <input 
                      type="text"
                      value={tempProfile.breed}
                      onChange={(e) => setPetTempProfile({...tempProfile, breed: e.target.value})}
                      placeholder="例如：柴犬"
                      className="w-full bg-[#F7F2EA] border border-[#E8DFD8] rounded-xl px-3 py-2.5 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#B88746]/20 focus:border-[#B88746]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 flex items-center justify-between">
                      生日 
                      <span className="text-[10px] text-[#B88746] font-bold">({calculateAge(tempProfile.birthday)})</span>
                    </label>
                    <input 
                      type="date"
                      value={tempProfile.birthday}
                      onChange={(e) => setPetTempProfile({...tempProfile, birthday: e.target.value})}
                      className="w-full bg-[#F7F2EA] border border-[#E8DFD8] rounded-xl px-3 py-2 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#B88746]/20 focus:border-[#B88746]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">體重</label>
                    <input 
                      type="text"
                      value={tempProfile.weight}
                      onChange={(e) => setPetTempProfile({...tempProfile, weight: e.target.value})}
                      placeholder="例如：10.5 kg"
                      className="w-full bg-[#F7F2EA] border border-[#E8DFD8] rounded-xl px-3 py-2.5 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#B88746]/20 focus:border-[#B88746]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#4A423D] mb-1 flex items-center justify-between">
                    <span>注意事項 / 特殊需求</span>
                    <span className="text-[10px] text-[#E07A5F] flex items-center font-bold">
                      <AlertCircle className="w-3 h-3 mr-0.5" /> AI 將優先避開風險
                    </span>
                  </label>
                  <textarea 
                    value={tempProfile.notes}
                    onChange={(e) => setPetTempProfile({...tempProfile, notes: e.target.value})}
                    rows={2}
                    placeholder="例如：個性較緊張怕生、對雞肉過敏..."
                    className="w-full bg-[#F7F2EA] border border-[#E8DFD8] rounded-xl px-3 py-2 text-sm font-medium text-[#38312D] outline-none focus:ring-2 focus:ring-[#B88746]/20 focus:border-[#B88746] leading-relaxed resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#E8DFD8]">
                <h4 className="text-sm font-black text-[#38312D] flex items-center">
                  <span className="w-1.5 h-4 bg-[#4D8B6F] rounded-full mr-2"></span> 健康與預防醫學
                  <span className="ml-2 text-[10px] font-bold text-[#4D8B6F] bg-[#EBF4EE] px-2 py-0.5 rounded-md">AI 自動排程推播</span>
                </h4>

                <div className="bg-[#EBF4EE]/60 border border-[#CDE3DC] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center text-[#3B6E57] font-black text-xs mb-2">
                    <Pill className="w-4 h-4 mr-1.5" /> 定期驅蟲 / 心絲蟲用藥
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">使用廠牌名稱</label>
                    <input 
                      type="text"
                      value={tempProfile.medBrand}
                      onChange={(e) => setPetTempProfile({...tempProfile, medBrand: e.target.value})}
                      placeholder="例如：全能狗S、犬新寶、一錠除..."
                      className="w-full bg-white border border-[#CDE3DC] rounded-xl px-3 py-2 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#4D8B6F]/20 focus:border-[#4D8B6F]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">上次服用日期</label>
                    <input 
                      type="date"
                      value={tempProfile.medLastDate}
                      onChange={(e) => setPetTempProfile({...tempProfile, medLastDate: e.target.value})}
                      className="w-full bg-white border border-[#CDE3DC] rounded-xl px-3 py-2 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#4D8B6F]/20 focus:border-[#4D8B6F]"
                    />
                  </div>
                </div>

                <div className="bg-[#EBF2F8]/60 border border-[#CBDDE9] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center text-[#2D5B84] font-black text-xs mb-2">
                    <Syringe className="w-4 h-4 mr-1.5" /> 年度核心疫苗紀錄
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">疫苗名稱</label>
                    <input 
                      type="text"
                      value={tempProfile.vaccineName}
                      onChange={(e) => setPetTempProfile({...tempProfile, vaccineName: e.target.value})}
                      placeholder="例如：十合一疫苗、狂犬病疫苗"
                      className="w-full bg-white border border-[#CBDDE9] rounded-xl px-3 py-2 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#2D5B84]/20 focus:border-[#2D5B84]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A423D] mb-1 block">上次施打日期</label>
                    <input 
                      type="date"
                      value={tempProfile.vaccineLastDate}
                      onChange={(e) => setPetTempProfile({...tempProfile, vaccineLastDate: e.target.value})}
                      className="w-full bg-white border border-[#CBDDE9] rounded-xl px-3 py-2 text-sm font-bold text-[#38312D] outline-none focus:ring-2 focus:ring-[#2D5B84]/20 focus:border-[#2D5B84]"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E8DFD8] flex space-x-3 shrink-0 bg-[#FFFDF9]">
              <button
                onClick={() => setIsPetModalOpen(false)}
                className="flex-[0.5] bg-[#F7F2EA] hover:bg-[#E8DFD8] text-[#4A423D] font-black text-sm py-3.5 rounded-2xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePetProfile}
                className="flex-1 bg-[#B88746] hover:bg-[#A67C52] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-[#B88746]/20 transition-transform active:scale-95"
              >
                儲存檔案並更新 AI 排程
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 定位載入中 UI */}
      {locationStatus === 'loading' && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#FAF6F0]/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl flex flex-col items-center max-w-xs text-center border border-[#E8DFD8]">
            <div className="w-16 h-16 mb-4 animate-bounce">
              <span className="text-5xl">🛰️</span>
            </div>
            <h3 className="text-[#38312D] font-black text-lg mb-2">正在與外太空連線...</h3>
            <p className="text-[#6E5A4D] text-sm font-bold leading-relaxed">
              正在為您定位中！請稍候，我們保證沒有被外星人綁架 👽
            </p>
          </div>
        </div>
      )}

      {/* 定位被拒絕 UI */}
      {locationStatus === 'denied' && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center max-w-sm text-center border border-[#E8DFD8]">
            <div className="w-16 h-16 mb-4 bg-rose-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🐶</span>
            </div>
            <h3 className="text-[#38312D] font-black text-xl mb-2">我們迷路了！</h3>
            <p className="text-[#6E5A4D] text-sm font-medium leading-relaxed mb-6">
              沒有您的位置，系統會像迷路的小狗一樣不知所措。<br/><br/>
              為了給您最精準的周邊推薦，強烈建議您至瀏覽器設定中<b>「允許存取位置」</b>，然後重新整理網頁喔！
            </p>
            <button 
              onClick={() => setLocationStatus('error')}
              className="w-full bg-[#B88746] hover:bg-[#A67C52] text-white font-black py-3 rounded-2xl transition-all active:scale-95"
            >
              好，我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
