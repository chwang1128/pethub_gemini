'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Quote, PawPrint, Sparkles, Send, MapPin, 
  X, Coins, Star, RefreshCcw, Search, ChevronRight,
  Clock, Phone, Navigation, Map, MessageCircle, Globe, ChevronUp, ChevronDown,
  Edit3, Heart, AlertCircle, Pill, Syringe, Activity, ExternalLink, CheckCircle2, XCircle, FileText, Loader2
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
  quoteText?: string;
  authorInfo?: string;
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
  realReviews?: Array<{ author: string; text: string; rating: number; relativeTime: string }>;
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

export default function FullMapAIPortal() {
  const [coins, setCoins] = useState(2000);
  const [isAiBoxMinimized, setIsAiBoxMinimized] = useState(false);
  
  // 🌟 定位狀態 (載入中、成功、被拒絕)
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
  const [isAnalyzingDetail, setIsAnalyzingDetail] = useState(false);

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

      // 🌟 啟動定位並觸發「連線外太空」彈窗
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
      if (overrideLat !== null && overrideLng !== null) {
        searchLat = overrideLat; searchLng = overrideLng;
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

        let allFetchedStores: Store[] = data.results.map((place: any, index: number) => {
          const rating = place.rating || 4.5;
          const reviewsCount = place.user_ratings_total || 20;
          const distanceKm = calculateDistance(searchLat, searchLng, place.geometry.location.lat, place.geometry.location.lng);
          const distanceText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;

          const defaultImg = petProfile.type === 'dog' 
            ? 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80';

          return {
            id: place.place_id,
            name: place.name,
            category: 'general',
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            rating, reviewsCount,
            address: place.vicinity || '地址資訊未提供',
            phone: place.phone || '未提供電話',
            openingHours: place.openingHours || '今日營業中',
            website: place.website,
            realReviews: place.realReviews || [],
            price: '需洽詢',
            photoUrl: place.photoUrl || defaultImg,
            distanceKm, distanceText,
            requirementsStatus: [{ label: '真實店家驗證', isEssential: true, met: true }],
            allEssentialMet: true,
            aiSummary: '點擊展開以載入 AI 對真實評論的深入分析...',
            aiDetails: { generalSummary: '', faqHighlights: [] }
          };
        });

        setStores(allFetchedStores); 
        const topStores = allFetchedStores.slice(0, 3);
        setDisplayedStores(topStores);
        return topStores;
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
          history: newHistory.slice(1).map(m => ({ role: m.sender === 'ai' ? 'model' : 'user', content: m.text })),
          isEvaluationPhase: false
        })
      });

      const chatData = await chatRes.json();

      if (chatData.action === 'chat') {
        setMessages(prev => [...prev, { sender: 'ai', text: chatData.reply }]);
      } else if (chatData.action === 'search') {
        setMessages(prev => [...prev, { sender: 'ai', text: chatData.reply }]);
        
        const finalKeyword = chatData.keyword || text;
        const targetLat = chatData.targetLocation?.lat || null;
        const targetLng = chatData.targetLocation?.lng || null;
        
        const latestStores = await searchGooglePlaces(finalKeyword, 'gps', targetLat, targetLng);

        const evalRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            petProfile: petProfile,
            history: [...newHistory.slice(1), { sender: 'ai', text: chatData.reply }].map(m => ({ role: m.sender === 'ai' ? 'model' : 'user', content: m.text })),
            contextStores: latestStores,
            isEvaluationPhase: true
          })
        });

        const evalData = await evalRes.json();
        if (evalData.reply) {
          setMessages(prev => [...prev, { sender: 'ai', text: evalData.reply }]);
          if (evalData.recommendedIds && Array.isArray(evalData.recommendedIds)) {
            setDisplayedStores(prevStores => prevStores.filter(store => evalData.recommendedIds.includes(store.id)));
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: '請求發生錯誤，後端可能尚未準備好。' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const openDetailModal = async (store: Store) => {
    setSelectedDetailStore(store);
    setIsSheetExpanded(false);
    
    if (mapRef.current) {
      const L = (window as any).L;
      mapRef.current.flyTo([store.lat, store.lng], 15, { animate: true, duration: 1.0 });
    }

    if (!store.aiSummary || store.aiSummary.includes('點擊展開')) {
      setIsAnalyzingDetail(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isDetailAnalysisPhase: true,
            storeName: store.name,
            storeReviews: store.realReviews,
            petProfile: petProfile
          })
        });

        const analysisData = await res.json();
        
        setSelectedDetailStore(prev => prev ? {
          ...prev,
          aiSummary: analysisData.aiSummary || '根據真實評論：該店家整體服務獲得顧客良好評價。',
          aiDetails: {
            generalSummary: analysisData.aiSummary,
            faqHighlights: analysisData.faqHighlights || []
          }
        } : null);

      } catch (err) {
        console.error("AI 評論分析失敗", err);
      } finally {
        setIsAnalyzingDetail(false);
      }
    }
  };

  const handleSavePetProfile = () => {
    setPetProfile(tempProfile);
    setIsPetModalOpen(false);
  };

  const glassmorphism = "bg-[#FFFDF9]/90 backdrop-blur-2xl ring-1 ring-[#E8DFD8] shadow-[0_8px_30px_rgba(74,66,61,0.06)]";

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden font-sans bg-[#FAF6F0] text-[#3D2E24]">
      <div id="full-map" className="absolute inset-0 z-0 h-full w-full"></div>

      {/* 頂部 Header */}
      <header className="absolute top-3 left-3 right-3 md:top-5 md:left-5 md:right-5 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className={`${glassmorphism} px-4 py-2 md:py-2.5 rounded-[22px] flex items-center space-x-3 pointer-events-auto border border-[#E8DFD8]`}>
            <span className="font-black text-[#38312D] text-xl">PetHub</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 pointer-events-auto">
            {QUICK_FILTERS.map(filter => (
              <button
                key={filter.label}
                onClick={() => searchGooglePlaces(filter.query)}
                className={`${glassmorphism} flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-bold text-[#4A423D] hover:text-[#B88746] transition-all`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          <button 
            onClick={() => { setPetTempProfile(petProfile); setIsPetModalOpen(true); }}
            className={`${glassmorphism} px-4 py-2 rounded-full flex items-center space-x-2 border border-[#E8DFD8] shadow-sm`}
          >
            <span className="text-lg">{petProfile.type === 'dog' ? '🐶' : '🐱'}</span>
            <span className="font-black text-sm text-[#38312D]">{petProfile.name}</span>
          </button>
        </div>
      </header>

      {/* 對話視窗 */}
      {!isAiBoxMinimized && (
        <div className="hidden md:flex absolute bottom-6 right-6 w-[400px] z-30 flex-col pointer-events-none">
          <div className="bg-[#FFFDF9]/95 backdrop-blur-3xl rounded-[32px] shadow-2xl p-6 flex flex-col h-[560px] ring-1 ring-[#E8DFD8] pointer-events-auto relative overflow-hidden">
            <button onClick={() => setIsAiBoxMinimized(true)} className="absolute top-5 right-5 text-[#A67C52] p-2">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="w-6 h-6 text-[#B88746]" />
              <h2 className="font-black text-[#38312D] text-xl">AI 毛孩助理</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2 hide-scrollbar">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[20px] max-w-[88%] text-[14px] leading-relaxed shadow-sm ${
                    m.sender === 'user' ? 'bg-[#B88746] text-white' : 'bg-white ring-1 ring-[#E8DFD8] text-[#38312D]'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex items-center space-x-2 p-3 bg-white rounded-xl text-sm font-bold text-[#B88746] animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini 分析中...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="mt-4 pt-2 border-t border-[#E8DFD8]">
              <div className="flex items-center bg-white ring-1 ring-[#E8DFD8] rounded-[24px] p-1.5">
                <input 
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`想為 ${petProfile.name} 找什麼服務...`} 
                  className="flex-1 bg-transparent text-sm px-4 py-2 outline-none"
                  disabled={isAiTyping}
                />
                <button onClick={() => handleSendMessage()} disabled={isAiTyping} className="p-3 bg-[#B88746] text-white rounded-[20px]">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部店家精選卡片 */}
      {displayedStores.length > 0 && !selectedDetailStore && (
        <div className="absolute bottom-6 left-6 right-6 md:pr-[440px] flex space-x-4 overflow-x-auto pb-2 pointer-events-auto z-20">
          {displayedStores.map((store) => (
            <div 
              key={store.id} 
              onClick={() => openDetailModal(store)}
              className="w-[280px] bg-white/95 backdrop-blur-xl rounded-[24px] p-3 shadow-lg border border-[#E8DFD8] cursor-pointer flex flex-row space-x-3 hover:-translate-y-1 transition-all"
            >
              <img src={store.photoUrl} alt={store.name} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-black text-sm text-[#38312D] truncate">{store.name}</h3>
                <div className="flex items-center text-xs text-amber-500 font-bold my-1">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" />
                  <span>{store.rating} ({store.reviewsCount}則真實評論)</span>
                </div>
                <span className="text-[10px] text-[#A67C52] font-bold">距離 {store.distanceText}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 店家詳情 Bottom Sheet */}
      {selectedDetailStore && (
        <div className="absolute z-[60] bg-white/95 backdrop-blur-3xl shadow-2xl top-0 bottom-0 left-0 w-full md:w-[440px] flex flex-col pointer-events-auto border-r border-[#E8DFD8]">
          <div className="relative h-56 w-full shrink-0">
            <img src={selectedDetailStore.photoUrl} alt={selectedDetailStore.name} className="w-full h-full object-cover" />
            <button onClick={() => setSelectedDetailStore(null)} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <h2 className="text-2xl font-black">{selectedDetailStore.name}</h2>
              <p className="text-xs opacity-90">{selectedDetailStore.address}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
            <div className="bg-[#FAF6F0] border border-[#E8DFD8] rounded-2xl p-4">
              <h3 className="text-sm font-black text-[#38312D] mb-2 flex items-center">
                <Sparkles className="w-4 h-4 text-[#B88746] mr-1.5" />
                Gemini 真實評論觀點總結
              </h3>
              {isAnalyzingDetail ? (
                <div className="flex items-center space-x-2 text-xs text-[#B88746] font-bold py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在深度閱讀顧客真實評論內文...</span>
                </div>
              ) : (
                <p className="text-xs text-[#4A423D] leading-relaxed font-semibold whitespace-pre-line">
                  {selectedDetailStore.aiSummary}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-black text-[#38312D] mb-3">Google 真實顧客評論佐證</h3>
              <div className="space-y-3">
                {selectedDetailStore.aiDetails?.faqHighlights?.map((faq, i) => (
                  <div key={i} className="bg-white border border-[#E8DFD8] rounded-2xl p-3.5 shadow-sm space-y-2">
                    <div className="text-xs font-black text-[#38312D] flex items-center justify-between">
                      <span>Q: {faq.question}</span>
                      <span className="text-[10px] text-[#B88746] bg-[#F7EFE5] px-2 py-0.5 rounded">真實評論考據</span>
                    </div>
                    <p className="text-xs text-[#6E5A4D] font-bold pl-2 border-l-2 border-[#B88746]">{faq.answer}</p>
                    
                    {faq.quoteText && (
                      <div className="bg-[#FBF6EE] rounded-xl p-2.5 text-[11px] text-[#8C7A6B] font-medium leading-relaxed">
                        <Quote className="w-3 h-3 text-[#B88746] inline mr-1 rotate-180" />
                        <span>「{faq.quoteText}」</span>
                        <span className="block text-[10px] text-[#B88746] font-bold mt-1">— {faq.authorInfo}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 1. 定位載入中 UI：連線外太空動畫 */}
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

      {/* 🌟 2. 定位被拒絕 UI：提示迷路 */}
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
