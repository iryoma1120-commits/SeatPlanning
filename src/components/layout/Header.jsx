import React, { useState } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';
import { generateTextOutput } from '../../utils/export';

export default function Header() {
  const { history, pults, loadFile, buildSeats, undo, date, part, piece, sessions } = useSeatingContext();
  const [copyOutput, setCopyOutput] = useState("");

  const handleCopy = () => {
    const text = generateTextOutput(date, part, piece, sessions, pults);
    setCopyOutput(text);
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <>
      <div id="header" className="sticky top-0 z-50 bg-[#04080f]/95 backdrop-blur-md border-b border-[#1a2d45] px-4 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-[17px] font-black tracking-wide whitespace-nowrap">🎻 座席表<span className="text-[11px] font-normal text-[#7a90b0] ml-2">Orchestra Seating</span></h1>
        <div id="header-right" className="flex gap-2 flex-wrap ml-auto">
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
      {copyOutput && (
        <pre id="output-area" className="bg-[#060d1c] border border-[#1a2d45] rounded-xl p-3 text-xs text-[#94a3b8] whitespace-pre font-mono mx-3 mb-3 max-h-[220px] overflow-auto mt-4 block">
          {copyOutput}
        </pre>
      )}
    </>
  );
}