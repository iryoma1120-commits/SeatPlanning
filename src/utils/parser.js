import * as XLSX from 'xlsx';
import { VN_PARTS } from './constants';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
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

function parseAttendance(rows) {
  let dateRowIdx = -1;
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    if ((rows[r] || []).some(c => /^\d+\/\d+/.test((c || "").trim()))) {
      dateRowIdx = r; break;
    }
  }
  if (dateRowIdx < 0) dateRowIdx = 1;

  const dateRow = rows[dateRowIdx] || [];
  const timeRow = rows[dateRowIdx + 1] || [];
  const placeRow = rows[dateRowIdx + 2] || [];
  const contRow = rows[dateRowIdx + 3] || [];

  const sessList = [];
  for (let c = 0; c < dateRow.length; c++) {
    const d = (dateRow[c] || "").trim();
    if (/\d+\/\d+/.test(d)) {
      sessList.push({
        colIdx: c, date: d,
        time: (timeRow[c] || "").trim(), place: (placeRow[c] || "").trim(), content: (contRow[c] || "").trim(),
      });
    }
  }

  const hdrRowIdx = dateRowIdx + 4;
  let curPart = "";
  const members = [];

  for (let r = hdrRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row.every(c => !(c || "").trim())) continue;
    const c0 = (row[0] || "").trim();

    if (/^(Vn|Va|Vc|Cb|Fl|Ob|Cl|Fg|Hr|Tp|Tb|Perc|Harp|Piano|Celesta)(\s|\d|$)/.test(c0)) {
      curPart = c0.match(/^(Vn|Va|Vc|Cb|Fl|Ob|Cl|Fg|Hr|Tp|Tb|Perc|Harp|Piano|Celesta)/)[1];
      continue;
    }
    if (!c0 || c0.length < 2 || /^\d+$/.test(c0)) continue;

    const isTop = row.slice(0, 5).some(c => (c || "").trim() === "♪");
    const att = {};
    for (const s of sessList) {
      att[s.date] = { status: (row[s.colIdx] || "").trim(), comment: (row[s.colIdx + 1] || "").trim() };
    }

    const nameWithSpace = c0.replace(/　/g, " ").replace(/\s+/g, " ").trim();
    const nameWithoutSpace = nameWithSpace.replace(/\s/g, "");
    const vnInfo = VN_PARTS[nameWithSpace] || VN_PARTS[nameWithoutSpace] || null;

    members.push({ name: nameWithSpace, part: curPart, isTop, vnInfo, att });
  }
  return { sessions: sessList, members };
}