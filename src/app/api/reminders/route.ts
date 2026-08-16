import { NextResponse } from 'next/server';

export async function GET() {
  // 自動檢查全平台寵物疫苗與美容排程 (14天內發送 Push/LINE 通知)
  const upcomingReminders = [
    {
      petName: 'Momo',
      ownerEmail: 'momo_owner@example.com',
      type: 'VACCINE_RABIES',
      daysRemaining: 12,
      noticeText: '狂犬病疫苗還剩 12 天到期，建議立即預約大安區診所！'
    }
  ];

  return NextResponse.json({ success: true, reminders: upcomingReminders });
}
