'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Mail, Lock, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('註冊成功！請檢查您的 Email 完成驗證。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('登入成功！');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message || '操作失敗'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
