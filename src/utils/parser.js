import * as XLSX from 'xlsx';
import { VN_PARTS } from './constants';

/**
 * Excelファイルを読み込み、Uint8Arrayとして処理を開始する
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]]; // 最初のシートを使用
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        // セルの値をトリミングして文字列化
        const rows = raw.map(row => row.map(cell => cell === null || cell === undefined ? "" : String(cell).trim()));
        resolve(parseAttendance(rows));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * シートの行データから出欠情報とメンバーリストを抽出する
 */
function parseAttendance(rows) {
  // 日付が記載されている行を特定（正規表現で M/D 形式を探す）
  let dateRowIdx = -1;
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    if ((rows[r] || []).some(c => /^\d+\/\d+/.test((c || "").trim()))) {
      dateRowIdx = r; break;
    }
  }
  if (dateRowIdx < 0) dateRowIdx = 1; // 見つからない場合は2行目と仮定

  const dateRow = rows[dateRowIdx] || [];      // 日付行
  const timeRow = rows[dateRowIdx + 1] || [];  // 時間行
  const placeRow = rows[dateRowIdx + 2] || []; // 場所行
  const contRow = rows[dateRowIdx + 3] || [];  // 内容（練習曲など）行

  // 練習セッションのリストを作成
  const sessList = [];
  for (let c = 0; c < dateRow.length; c++) {
    const d = (dateRow[c] || "").trim();
    if (/\d+\/\d+/.test(d)) {
      sessList.push({
        colIdx: c, 
        date: d,
        time: (timeRow[c] || "").trim(), 
        place: (placeRow[c] || "").trim(), 
        content: (contRow[c] || "").trim(),
      });
    }
  }

  const hdrRowIdx = dateRowIdx + 4; // メンバーデータの開始行
  let curPart = "";                // 現在パース中のパート名
  const members = [];

  for (let r = hdrRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row.every(c => !(c || "").trim())) continue; // 空行はスキップ
    const c0 = (row[0] || "").trim();

    // パートの見出し行を判定
    if (/^(Vn|Va|Vc|Cb|Fl|Ob|Cl|Fg|Hr|Tp|Tb|Perc|Harp|Piano|Celesta)(\s|\d|$)/.test(c0)) {
      curPart = c0.match(/^(Vn|Va|Vc|Cb|Fl|Ob|Cl|Fg|Hr|Tp|Tb|Perc|Harp|Piano|Celesta)/)[1];
      continue;
    }
    // 名前が短すぎる、または数値のみの場合はスキップ
    if (!c0 || c0.length < 2 || /^\d+$/.test(c0)) continue;

    // ♪マークがある場合は主席・副主席などの重要メンバーとしてフラグを立てる
    const isTop = row.slice(0, 5).some(c => (c || "").trim() === "♪");

    // 日付ごとの出欠ステータスとコメントを抽出
    const att = {};
    for (const s of sessList) {
      att[s.date] = { 
        status: (row[s.colIdx] || "").trim(), 
        comment: (row[s.colIdx + 1] || "").trim() 
      };
    }

    // 名前の表記ゆれ（スペースの有無など）を正規化
    const nameWithSpace = c0.replace(/　/g, " ").replace(/\s+/g, " ").trim();
    const nameWithoutSpace = nameWithSpace.replace(/\s/g, "");

    // Vnの場合は constants.js に定義された曲ごとのパート・オモテウラ情報を紐付け
    const vnInfo = VN_PARTS[nameWithSpace] || VN_PARTS[nameWithoutSpace] || null;

    members.push({ name: nameWithSpace, part: curPart, isTop, vnInfo, att });
  }
  return { sessions: sessList, members };
}