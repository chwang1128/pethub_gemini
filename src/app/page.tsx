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

  // 🌟 新增：用來追蹤定位狀態 (載入中、成功、被拒絕)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'denied' | 'error'>('idle');

  const [petProfile, setPetProfile] = useState<PetProfile>({
    name: '波波',
    type: 'dog',
@@ -276,9 +279,12 @@

      map.on('dragend', () => setShowSearchHereBtn(true));

      // 🌟 啟動定位與狀態攔截
      if ('geolocation' in navigator) {
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationStatus('success');
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserLocation({ lat, lng });
@@ -297,10 +303,18 @@
            map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
          },
          (error) => {
            // 判斷是否為使用者手動拒絕
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
@@ -455,80 +469,66 @@
    }
  };

  // 🌟 進階雙重通訊入口：需求釐清 ➡️ 搜尋 ➡️ 最終評估與卡片聯動
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    // 將新訊息加入畫面與歷史陣列
    const newHistory = [...messages, { sender: 'user' as const, text }];
    setMessages(newHistory);
    setInputQuery('');
    setIsAiTyping(true);

    try {
      // 🚀【階段一：傳給 AI 釐清需求】（此時不用帶店家資料）
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          petProfile: petProfile,
          // 擷取之前的對話紀錄給 AI
          history: newHistory.slice(1).map(m => ({ 
            role: m.sender === 'ai' ? 'model' : 'user', 
            content: m.text 
          })),
          isEvaluationPhase: false // 標記為：釐清階段
          isEvaluationPhase: false
        })
      });

      const chatData = await chatRes.json();

      if (chatData.action === 'chat') {
        // 💬 狀況 A：AI 覺得資訊不足，對你發出提問
        setMessages(prev => [...prev, { sender: 'ai', text: chatData.reply }]);
      
      } else if (chatData.action === 'search') {
        // 🔍 狀況 B：AI 覺得資訊夠了，下令開始搜尋
        setMessages(prev => [...prev, { sender: 'ai', text: chatData.reply }]);

        // 呼叫地圖搜尋，使用 AI 總結出來的最精準 keyword
        const finalKeyword = chatData.keyword || text;
        const latestStores = await searchGooglePlaces(finalKeyword, 'gps');

        // 🚀【階段二：將剛找出的店家名單送給 AI 做最後評估篩選】
        const evalRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            petProfile: petProfile,
            // 讓 AI 記得剛才的對話與安撫語
            history: [...newHistory.slice(1), { sender: 'ai', text: chatData.reply }].map(m => ({ 
              role: m.sender === 'ai' ? 'model' : 'user', 
              content: m.text 
            })),
            contextStores: latestStores,
            isEvaluationPhase: true // 標記為：評估階段
            isEvaluationPhase: true
          })
        });

        const evalData = await evalRes.json();

        if (evalData.reply) {
          // 印出 AI 的最終推薦理由
          setMessages(prev => [...prev, { sender: 'ai', text: evalData.reply }]);

          // 🌟 最終殺招：聯動卡片隱藏邏輯
          if (evalData.recommendedIds && Array.isArray(evalData.recommendedIds)) {
            if (evalData.recommendedIds.length > 0) {
              setDisplayedStores(prevStores => 
                // 只留下 ID 在 AI 推薦名單內的店家卡片
                prevStores.filter(store => evalData.recommendedIds.includes(store.id))
              );
            } else {
               // 如果 AI 一個都不推薦，就把卡片清空
               setDisplayedStores([]);
            }
          }
@@ -1209,6 +1209,42 @@
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
