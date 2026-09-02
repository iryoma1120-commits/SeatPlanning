import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithPassword, signUp, isSupabaseConfigured } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithPassword(email, password);
        onClose();
      } else {
        const data = await signUp(email, password);
        // メール確認が必要な場合と即時ログインの場合がある
        if (data.session) {
          setSuccessMsg('アカウントを作成し、ログインしました。');
          setTimeout(() => onClose(), 1200);
        } else {
          setSuccessMsg('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Supabaseのエラーメッセージを日本語化/わかりやすく
      let msg = err.message || '認証に失敗しました。';
      if (msg.includes('Invalid login credentials')) {
        msg = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (msg.includes('User already registered')) {
        msg = 'このメールアドレスは既に登録されています。ログインをお試しください。';
      } else if (msg.includes('Password should be at least')) {
        msg = 'パスワードは6文字以上で入力してください。';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0b1324] border border-[#233554] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-[#dde4f0]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b2a47] bg-[#070e1c]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <h2 className="text-base font-bold">
              {mode === 'login' ? 'ログイン' : '新規アカウント登録'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#1b2a47] bg-[#060c18] text-xs">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 font-semibold transition border-b-2 ${
              mode === 'login'
                ? 'border-blue-500 text-blue-400 bg-[#0c192e]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-3 font-semibold transition border-b-2 ${
              mode === 'signup'
                ? 'border-blue-500 text-blue-400 bg-[#0c192e]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            新規登録
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {!isSupabaseConfigured && (
            <div className="bg-amber-950/70 border border-amber-800 text-amber-300 p-3 rounded-xl leading-relaxed">
              ⚠️ <strong>Supabase未接続</strong>: .env ファイルに <code>VITE_SUPABASE_URL</code> と <code>VITE_SUPABASE_ANON_KEY</code> を設定してください。
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-950/70 border border-red-800 text-red-300 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-300 p-3 rounded-xl">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-gray-400 mb-1 font-medium">メールアドレス</label>
            <input
              type="email"
              required
              placeholder="example@orchestra.jp"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-medium">パスワード</label>
            <input
              type="password"
              required
              placeholder="6文字以上のパスワード"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="mt-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow"
          >
            {loading ? '処理中…' : mode === 'login' ? 'ログインする' : 'アカウントを作成する'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1b2a47] bg-[#070e1c] text-center text-[11px] text-gray-400">
          データベースへの保存・編集は認証済みアカウントのみ可能です
        </div>

      </div>
    </div>
  );
}
