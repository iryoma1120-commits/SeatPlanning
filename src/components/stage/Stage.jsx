import React from 'react';
import { useSeatingContext } from '../../hooks/useSeating';
import { getC } from '../../utils/constants';
import Column from './Column';

/**
 * ステージ上の座席配置全体を表示するコンポーネント
 */
export default function Stage() {
  const { pults, part } = useSeatingContext();

  // プルトが読み込まれていない、または出席者がいない場合はメッセージを表示
  if (pults.length === 0) {
    return <div id="no-data" className="text-center text-[#3a4e66] py-10 text-[13px]">この条件の出席者はいません</div>;
  }

  // パートに応じた配色設定を取得
  const c = getC(part);

  // 現在は左側(L)のカラムのみを使用。行番号(row)で昇順ソートして表示
  const lp = pults.filter(p => p.col === "L").sort((a, b) => a.row - b.row);

  // 表示されている全メンバーの合計人数を計算
  const total = pults.reduce((s, p) => s + p.slots.filter(Boolean).length, 0);

  return (
    <>
      {/* 画面上部のツールバー領域（出席人数バッジを表示） */}
      <div id="toolbar" className="flex gap-2 px-3 pt-2 flex-wrap items-center">
        <div id="total-badge" className="ml-auto text-xs text-[#7a90b0] bg-[#0b1525] border border-[#1a2d45] rounded-lg px-3 py-1">
          {part} 出席 {total}名
        </div>
      </div>

      {/* 指揮者台の位置を示すラベル（視覚的なガイド） */}
      <div id="cnd-row" className="flex justify-center py-3 pb-1.5">
        <div id="cnd" className="bg-[#0b1525] border-2 border-[#243650] rounded-[10px] px-9 py-1.5 text-[13px] text-[#7a90b0] tracking-widest">
          🎼 指揮者
        </div>
      </div>

      {/* プルトを表示するエリア。Column コンポーネントが各プルトをレンダリングする */}
      <div id="stage" className="one-col px-2.5 pb-10 grid gap-2.5">
        <Column label={part} pults={lp} c={c} />
      </div>
    </>
  );
}