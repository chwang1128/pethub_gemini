'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Home, Search, Calendar, PawPrint, MessageSquare, Heart, User, Moon,
  Shield, Building, Scissors, Bath, Cross, MapPin, Star, ChevronDown, Clock, Smartphone
} from 'lucide-react';

export default function B2CWebPortal() {
  const [activeCategory, setActiveCategory] = useState('shield');

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* 左側 Icon 導覽列 (對應附圖 1 最左側) */}
      <aside className="w-16 bg-white border-r border-slate-100 flex flex-col items-center py-6 justify-between z-20">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <PawPrint className="w-6 h-6" />
          </div>
          <nav className="flex flex-col gap-5 text-slate-400">
            <button className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Home className="w-5 h-5" /></button>
            <Link href="/mobile" className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition" title="切換至 App 視角"><Smartphone className="w-5 h-5" /></Link>
            <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"><Search className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"><Calendar className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"><MessageSquare className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"><Heart className="w-5 h-5" /></button>
            <Link href="/merchant/join" className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition" title="店家加盟"><User className="w-5 h-5" /></Link>
          </nav>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600"><Moon className="w-5 h-5" /></button>
      </aside>

      {/* 中央：主內容與AI搜尋 (對應附圖 1 中央) */}
      <main className="flex-1 flex flex-col border-r border-slate-100 bg-white overflow-y-auto">
        <div className="p-8 max-w-3xl mx-auto w-full">
          {/* 頂部導覽快捷列 */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">🐶 專屬狗狗 & 貓咪世界 Portal</span>
            <div className="flex gap-3 text-xs">
              <Link href="/mobile" className="text-slate-500 hover:text-blue-600 font-medium">📱 App 介面</Link>
              <Link href="/merchant/join" className="text-blue-600 font-bold hover:underline">🏪 店家免費入駐</Link>
            </div>
          </div>

          {/* 貓狗 Banner 視覺 (對應附圖 1) */}
          <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-4xl shadow-sm">🐶🐱</div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">PetHub Taiwan 寵物生活生態圈</h2>
                <p className="text-xs text-slate-400 mt-1">一站式整合醫療、美容、住宿與 AI 健康履歷</p>
              </div>
            </div>
          </div>

          {/* AI 智慧搜尋列 */}
          <div className="relative flex items-center mb-6">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜尋附近的寵物店家或輸入 AI 需求..." 
              className="w-full bg-slate-100 pl-12 pr-28 py-3.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-full shadow-md shadow-blue-500/20 hover:bg-blue-700 transition">搜尋</button>
            </div>
          </div>

          {/* 五大主分類 Icon (對應附圖 1 分類橫條) */}
          <div className="flex justify-around border-b border-slate-100 pb-4 mb-6">
            {[
              { id: 'shield', icon: Shield, label: '醫療保險', color: 'text-blue-500' },
              { id: 'boarding', icon: Building, label: '寵物住宿', color: 'text-emerald-500' },
              { id: 'grooming', icon: Scissors, label: '造型剪毛', color: 'text-amber-500' },
              { id: 'bath', icon: Bath, label: '洗澡護理', color: 'text-indigo-500' },
              { id: 'clinic', icon: Cross, label: '急診診所', color: 'text-rose-500' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`flex flex-col items-center gap-2 pb-2 relative transition ${activeCategory === item.id ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
              >
                <div className={`p-3 rounded-2xl ${activeCategory === item.id ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                {activeCategory === item.id && <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-full"></div>}
              </button>
            ))}
          </div>

          {/* 店家列表 (對應附圖 1) */}
          <div className="flex flex-col gap-4">
            {[
              { name: '毛樂園寵物美容沙龍', cat: '寵物洗澡 • 造型修毛', rating: '4.9 ★★★★★' },
              { name: '台大動物醫院 24H 急診', cat: '獸醫醫療 • 重症照護', rating: '4.8 ★★★★★' },
              { name: 'HappyPaws 寵物精品旅館', cat: '寵物住宿 • 日托安親', rating: '4.9 ★★★★★' }
            ].map((store, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600">
                    🐾
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{store.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{store.cat}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="p-1 bg-blue-50 rounded-md"><Shield className="w-3.5 h-3.5 text-blue-500" /></span>
                      <span className="p-1 bg-emerald-50 rounded-md"><Building className="w-3.5 h-3.5 text-emerald-500" /></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Heart className="w-5 h-5 text-slate-300 hover:text-rose-500" />
                  <span className="text-amber-500 text-xs font-bold">{store.rating}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-center mt-2"><ChevronDown className="w-6 h-6 text-slate-300 animate-bounce" /></div>
          </div>
        </div>
      </main>

      {/* 右側：半頁地圖與選定卡片 (對應附圖 1 右側) */}
      <aside className="w-[420px] bg-slate-50 p-6 flex flex-col gap-6 z-10">
        <div className="h-64 bg-emerald-50/50 border border-slate-200/60 rounded-3xl relative overflow-hidden shadow-inner flex items-center justify-center">
          <div className="w-40 h-40 bg-emerald-500/10 rounded-full border border-emerald-400/30 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <div className="absolute top-6 right-10 p-2 bg-blue-600 text-white rounded-full shadow-lg"><MapPin className="w-4 h-4" /></div>
          <div className="absolute bottom-10 left-12 p-2 bg-blue-600 text-white rounded-full shadow-lg"><MapPin className="w-4 h-4" /></div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">🐩</div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">毛樂園寵物沙龍</h3>
              <p className="text-xs text-slate-400 mt-1">台北市大安區和平東路</p>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-1">
                <Star className="w-3.5 h-3.5 fill-current" /> 4.9 (256則評價)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs text-slate-500 text-center">
            <div className="flex items-center justify-center gap-1"><Calendar className="w-3.5 h-3.5" /> 今日</div>
            <div class="flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> 15:00</div>
            <div className="flex items-center justify-center gap-1"><MapPin className="w-3.5 h-3.5" /> 800m</div>
          </div>

          <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition">
            線上預約服務
          </button>
        </div>
      </aside>
    </div>
  );
}
