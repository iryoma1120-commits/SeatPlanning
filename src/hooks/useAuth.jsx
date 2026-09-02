import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 初回セッション取得
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Supabase Auth] セッション取得エラー:', err);
        setLoading(false);
      });

    // 認証状態の変更リスナー
    let authSub = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session ?? null);
        setUser(session?.user ?? null);
        setLoading(false);
      });
      authSub = data?.subscription;
    } catch (err) {
      console.warn('[Supabase Auth] リスナー登録エラー:', err);
    }

    return () => {
      authSub?.unsubscribe?.();
    };
  }, []);

  /**
   * メールアドレスとパスワードでログイン
   */
  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabaseが設定されていません。.envファイルを確認してください。');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  /**
   * 新規アカウント作成（サインアップ）
   */
  const signUp = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabaseが設定されていません。.envファイルを確認してください。');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  /**
   * ログアウト
   */
  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    isSupabaseConfigured,
    signInWithPassword,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
