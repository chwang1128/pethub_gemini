'use client';
import React from 'react';
import Link from 'next/link';
import { 
  MapPin, Bell, Plus, Scissors, Bath, Home as HomeIcon, Car, MoreHorizontal,
  Calendar, Clock, User, CheckCircle2, ShieldAlert, Syringe, Award, ClipboardList
} from 'lucide-react';

export default function B2CMobileApp() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col justify-between font-sans pb-20 shadow-2xl">
      {/* 頂部位置與通知欄 (對應附圖 2) */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 cursor-pointer">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-800 text-sm">台北市大安區</span>
        </div>
        <button className="relative p-2 bg-slate-50 rounded-full">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
        </button>
      </header>

      <div className="px-6 flex flex-col gap-6 overflow-y-auto pt-2">
        {/* 6大圓形分類 Icon (對應附圖 2) */}
        <div className="grid grid-cols-6 gap-2 text-center">
          {[
            { icon: Plus, color: 'bg-blue-100 text-blue-600' },
            { icon: Scissors, color: 'bg-emerald-100 text-emerald-600' },
            { icon: Bath, color: 'bg-purple-100 text-purple-600' },
            { icon: HomeIcon, color: 'bg-amber-100 text-amber-600' },
            { icon: Car, color: 'bg-sky-100 text-sky-600' },
            { icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.color} shadow-sm`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="w-8 h-1.5 bg-slate-200 rounded-full mt-1"></div>
            </div>
          ))}
        </div>

        {/* 圓角地圖卡片 (對應附圖 2) */}
        <div className="h-44 bg-blue-50 border border-slate-200/60 rounded-3xl relative overflow-hidden shadow-inner flex items-center justify-center">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <div className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        {/* 近期預約行程卡片 (對應附圖 2) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🐕</div>
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-slate-800 text-sm">美容洗澡 - 黃金獵犬</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 10:00</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 60m</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> 王小明</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">已確認</span>
          </div>
        </div>

        {/* 毛孩健康護照卡片 (對應附圖 2) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-amber-200 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow">
              🦮
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Momo (黃金獵犬)</h4>
              <div className="flex gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-full"><ShieldAlert className="w-3.5 h-3.5" /></span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full"><Syringe className="w-3.5 h-3.5" /></span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-full"><Award className="w-3.5 h-3.5" /></span>
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-full"><ClipboardList className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部 5 大分頁 TabBar (對應附圖 2) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 h-16 flex justify-around items-center px-4 z-30">
        <button className="text-blue-600"><HomeIcon className="w-6 h-6" /></button>
        <button className="text-slate-400"><MapPin className="w-6 h-6" /></button>
        <button className="text-slate-400"><Calendar className="w-6 h-6" /></button>
        <button className="text-slate-400"><MoreHorizontal className="w-6 h-6" /></button>
        <Link href="/" className="text-slate-400 hover:text-blue-600"><User className="w-6 h-6" /></Link>
      </nav>
    </div>
  );
}
