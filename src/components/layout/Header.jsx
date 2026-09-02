import React, { useState } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';
import { useAuth } from '../../hooks/useAuth';
import { generateTextOutput } from '../../utils/export';
import MemberManagerModal from '../modal/MemberManagerModal';
import AuthModal from '../modal/AuthModal';

export default function Header({ activeTab, setActiveTab, onOpenAuth }) {
  const { history, pults, loadFile, buildSeats, undo, date, part, piece, sessions } = useSeatingContext();
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const [copyOutput, setCopyOutput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenAuth = () => {
    if (onOpenAuth) onOpenAuth();
    else setIsAuthModalOpen(true);
  };

  const handleCopy = () => {
    const text = generateTextOutput(date, part, piece, sessions, pults);
    setCopyOutput(text);
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <>
      <div id="header" className="sticky top-0 z-50 bg-[#04080f]/95 backdrop-blur-md border-b border-[#1a2d45] px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-[17px] font-black tracking-wide whitespace-nowrap">🎻 座席表<span className="text-[11px] font-normal text-[#7a90b0] ml-2">Orchestra Seating</span></h1>
          
          {/* メインタブ切り替え */}
          <nav className="flex items-center bg-[#07101e] border border-[#1d304a] rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('seating')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'seating'
                  ? 'bg-blue-600 text-white shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#122238]'
              }`}
            >
              <span>🎻</span> 座席表
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#122238]'
              }`}
            >
              <span>👥</span> メンバー名簿・登録
            </button>
          </nav>
        </div>
        <div id="header-right" className="flex gap-2 flex-wrap ml-auto items-center">
          {/* ログイン・認証ステータス */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#081220] border border-[#1d304a] rounded-lg px-2.5 py-1 text-xs">
              <span className="text-emerald-400">●</span>
              <span className="text-[#9ab4d6] max-w-[140px] truncate" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-gray-400 hover:text-red-300 ml-1 text-[11px] underline"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAuth}
              className="bg-[#0e1f38] border border-[#2d4d7a] text-blue-300 hover:bg-[#162d4f] hover:border-blue-400 rounded-lg px-3 py-1.5 text-xs transition-colors font-medium whitespace-nowrap"
            >
              🔑 ログイン
            </button>
          )}

          <button 
            onClick={() => setActiveTab ? setActiveTab('members') : setIsModalOpen(true)}
            className="bg-[#0b1525] border border-[#2e476d] text-blue-300 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-[#132238] hover:border-blue-400 whitespace-nowrap font-medium"
          >
            👥 メンバー設定
          </button>
          <label className="bg-[#1d4ed8] border border-[#3b82f6] text-white rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-blue-600 cursor-pointer whitespace-nowrap">
            📂 出欠表を読み込む
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && loadFile(e.target.files[0])} />
          </label>
          <button className={`bg-[#0b1525] border border-[#243650] text-[#7a90b0] rounded-lg px-3 py-1.5 text-xs transition-colors whitespace-nowrap ${!history.length ? 'opacity-35 cursor-not-allowed' : 'hover:border-[#3b82f6] hover:text-[#dde4f0]'}`} disabled={!history.length} onClick={undo}>↩ 戻す</button>
          {pults.length > 0 && (
            <>
              <button className="bg-[#0b1525] border border-[#243650] text-[#7a90b0] rounded-lg px-3 py-1.5 text-xs transition-colors hover:border-[#3b82f6] hover:text-[#dde4f0] whitespace-nowrap" onClick={buildSeats}>🔄 再生成</button>
              <button className="bg-[#1d4ed8] border border-[#3b82f6] text-white rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-blue-600 whitespace-nowrap" onClick={handleCopy}>📋 テキスト出力</button>
            </>
          )}
        </div>
      </div>
      <MemberManagerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {copyOutput && (
        <pre id="output-area" className="bg-[#060d1c] border border-[#1a2d45] rounded-xl p-3 text-xs text-[#94a3b8] whitespace-pre font-mono mx-3 mb-3 max-h-[220px] overflow-auto mt-4 block">
          {copyOutput}
        </pre>
      )}
    </>
  );
}