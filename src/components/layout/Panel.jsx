import React, { useEffect } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';

export default function Panel({ onSwitchToMembers }) {
  const { 
    sessions, 
    availableParts, 
    date, 
    setDate, 
    part, 
    setPart, 
    piece, 
    setPiece, 
    buildSeats, 
    msg, 
    loadFile 
  } = useSeatingContext();

  useEffect(() => {
    if (sessions.length > 0 && availableParts.length > 0) {
      if (!date) setDate(sessions[0].date);
      if (!part) setPart(availableParts[0]);
    }
  }, [sessions, availableParts, date, part]);

  useEffect(() => {
    if (date && part) buildSeats();
  }, [date, part, piece]);

  // Excel未読み込み時のウェルカム・案内パネル
  if (sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-[#070e1c] border border-[#1a2d45] rounded-3xl text-center text-[#dde4f0] shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto bg-blue-950/60 border border-blue-800/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
          🎻
        </div>
        
        <div>
          <h2 className="text-xl font-bold tracking-wide">オーケストラ座席表作成ツール</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-md mx-auto">
            出欠表（Excel）を読み込んで座席を自動配置するか、<br />
            まずは各パートのメンバーと曲ごとの配置設定を確認・登録してください。
          </p>
        </div>

        {msg.text && (
          <div className={`text-xs p-2.5 rounded-xl bg-[#0b1626] border border-[#1d304a] ${msg.type}`}>
            {msg.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onSwitchToMembers}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>👥</span> パートメンバーを確認・登録する
          </button>
          
          <label className="px-5 py-2.5 rounded-xl bg-[#122035] hover:bg-[#1a2e4c] border border-[#243d63] text-blue-300 font-medium text-xs shadow transition cursor-pointer flex items-center justify-center gap-2">
            <span>📂</span> 出欠表（Excel）を読み込む
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              style={{ display: 'none' }} 
              onChange={(e) => e.target.files[0] && loadFile(e.target.files[0])} 
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="load-msg" className={`px-4 py-1 text-xs min-h-[20px] ${msg.type}`}>{msg.text}</div>
      <div className="bg-[#070e1c] border border-[#1a2d45] rounded-xl m-3 p-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#7a90b0] tracking-wider uppercase mb-2.5">⚙️ 表示条件</div>
          <div className="flex gap-3.5 flex-wrap items-end">
            <div className="flex flex-col">
              <label className="text-[11px] text-[#7a90b0] mb-1">📅 練習日</label>
              <select className="bg-[#060d1c] border border-[#243650] rounded-lg px-2.5 py-1.5 text-[#dde4f0] text-[13px] min-w-[130px]" value={date} onChange={e => setDate(e.target.value)}>
                {sessions.map(s => <option key={s.date} value={s.date}>{s.date}　{s.content}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-[#7a90b0] mb-1">🎼 パート</label>
              <select className="bg-[#060d1c] border border-[#243650] rounded-lg px-2.5 py-1.5 text-[#dde4f0] text-[13px] min-w-[130px]" value={part} onChange={e => setPart(e.target.value)}>
                {availableParts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-[#7a90b0] mb-1">🎵 曲設定</label>
              <select className="bg-[#060d1c] border border-[#243650] rounded-lg px-2.5 py-1.5 text-[#dde4f0] text-[13px] min-w-[130px]" value={piece} onChange={e => setPiece(e.target.value)}>
                <optgroup label="練習">
                  <option>前曲</option>
                  <option>中曲</option>
                  <option>メイン曲</option>
                </optgroup>
                <optgroup label="本番">
                  <option>本番：前曲</option>
                  <option>本番：中曲</option>
                  <option>本番：メイン曲</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {onSwitchToMembers && (
          <button
            onClick={onSwitchToMembers}
            className="text-xs text-blue-300 hover:text-white bg-[#0e1c30] hover:bg-[#162b47] border border-[#223959] rounded-lg px-3 py-1.5 transition flex items-center gap-1.5 mb-0.5"
          >
            <span>👥</span> メンバー名簿・配置設定を確認
          </button>
        )}
      </div>
    </>
  );
}