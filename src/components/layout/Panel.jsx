import React, { useEffect } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';

export default function Panel() {
  const { sessions, availableParts, date, setDate, part, setPart, piece, setPiece, buildSeats, msg } = useSeatingContext();

  useEffect(() => {
    if (sessions.length > 0 && availableParts.length > 0) {
      if (!date) setDate(sessions[0].date);
      if (!part) setPart(availableParts[0]);
    }
  }, [sessions, availableParts, date, part]);

  useEffect(() => {
    if (date && part) buildSeats();
  }, [date, part, piece]);

  if (sessions.length === 0) {
    return <div id="load-msg" className={`px-4 py-1 text-xs min-h-[20px] ${msg.type}`}>{msg.text}</div>;
  }

  const isVn = part === "Vn1st" || part === "Vn2nd";

  return (
    <>
      <div id="load-msg" className={`px-4 py-1 text-xs min-h-[20px] ${msg.type}`}>{msg.text}</div>
      <div className="bg-[#070e1c] border border-[#1a2d45] rounded-xl m-3 p-3.5">
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
          {isVn && (
            <div className="flex flex-col">
              <label className="text-[11px] text-[#7a90b0] mb-1">🎵 曲（Vnのみ）</label>
              <select className="bg-[#060d1c] border border-[#243650] rounded-lg px-2.5 py-1.5 text-[#dde4f0] text-[13px] min-w-[130px]" value={piece} onChange={e => setPiece(e.target.value)}>
                <option>前曲</option><option>中曲</option><option>メイン曲</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  );
}