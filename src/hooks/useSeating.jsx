import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { parseExcelFile } from '../utils/parser';
import { PART_ORDER } from '../utils/constants';

const SeatingContext = createContext();
export const useSeatingContext = () => useContext(SeatingContext);

export const SeatingProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [pults, setPults] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [date, setDate] = useState("");
  const [part, setPart] = useState("");
  const [piece, setPiece] = useState("前曲");
  const [msg, setMsg] = useState({ text: "", type: "" });

  const availableParts = useMemo(() => {
    const stringParts = ["Vn1st", "Vn2nd", "Va", "Vc", "Cb"];
    return stringParts;
  }, []);

  const loadFile = async (file) => {
    setMsg({ text: "読込中…", type: "" });
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.sessions.length === 0 || parsed.members.length === 0) {
        throw new Error("データが見つかりません（シートの構造を確認してください）");
      }
      setSessions(parsed.sessions);
      setAllMembers(parsed.members);
      setDate(parsed.sessions[0].date);
      setMsg({ text: `✅ ${file.name} — ${parsed.members.length}名・${parsed.sessions.length}回分を読み込みました`, type: "text-green-400" });
    } catch (err) {
      setMsg({ text: `❌ ${err.message}`, type: "text-red-400" });
    }
  };

  const buildSeats = useCallback(() => {
    setHistory([]);
    if (!date || !part) return;

    const isVn1 = (part === "Vn1st");
    const isVn2 = (part === "Vn2nd");
    const isVn = (isVn1 || isVn2);
    const isMae = (piece === "前曲" || piece === "中曲");
    const pk = isMae ? "mae" : "main";
    const sk = isMae ? "ms" : "ns";

    let attending;
    if (isVn) {
      const tgt = isVn1 ? "1st" : "2nd";
      attending = allMembers.filter(m => {
        if (m.part !== "Vn") return false;
        const a = m.att[date];
        if (!a || !["○", "△", "▽", "◯"].includes(a.status)) return false;
        if (!m.vnInfo) return isVn2;
        return m.vnInfo[pk] === tgt;
      });
    } else {
      attending = allMembers.filter(m => {
        if (m.part !== part) return false;
        const a = m.att[date];
        return a && ["○", "△", "▽", "◯"].includes(a.status);
      });
    }

    const newPults = [];
    if (isVn) {
      const omoList = attending.filter(m => m.vnInfo?.[sk] === "オモテ");
      const uraList = attending.filter(m => m.vnInfo?.[sk] === "ウラ");
      const noInfoList = attending.filter(m => !m.vnInfo);
      const uraAll = [...uraList, ...noInfoList];
      const rows = Math.max(omoList.length, uraAll.length);
      for (let i = 0; i < rows; i++) {
        // [ウラ, オモテ] の順に入れ替え
        newPults.push({ id: "p" + (i + 1), col: "L", row: i, slots: [uraAll[i]?.name || null, omoList[i]?.name || null] });
      }
    } else {
      for (let i = 0; i < attending.length; i += 2) {
        newPults.push({ id: "p" + (i / 2 + 1), col: "L", row: i / 2, slots: [attending[i]?.name || null, attending[i + 1]?.name || null] });
      }
    }
    setPults(newPults);
  }, [date, part, piece, allMembers]);

  const saveHistory = () => {
    setHistory(prev => {
      const newHist = [...prev, JSON.parse(JSON.stringify(pults))];
      if (newHist.length > 30) newHist.shift();
      return newHist;
    });
  };

  const doSwap = (sp, ss, dp, ds) => {
    saveHistory();
    setPults(prev => {
      const sv = prev.find(p => p.id === sp)?.slots[ss] ?? null;
      const dv = prev.find(p => p.id === dp)?.slots[ds] ?? null;
      return prev.map(p => {
        const s = [...p.slots];
        if (p.id === sp && p.id === dp) { [s[ss], s[ds]] = [s[ds], s[ss]]; return { ...p, slots: s }; }
        if (p.id === sp) { s[ss] = dv; return { ...p, slots: s }; }
        if (p.id === dp) { s[ds] = sv; return { ...p, slots: s }; }
        return p;
      });
    });
  };

  const doSwapPults = (aid, bid) => {
    saveHistory();
    setPults(prev => {
      const pa = prev.find(p => p.id === aid), pb = prev.find(p => p.id === bid);
      return prev.map(p => {
        if (p.id === aid) return { ...p, col: pb.col, row: pb.row };
        if (p.id === bid) return { ...p, col: pa.col, row: pa.row };
        return p;
      });
    });
  };

  const undo = () => {
    if (!history.length) return;
    const newHist = [...history];
    const prevPults = newHist.pop();
    setPults(prevPults);
    setHistory(newHist);
  };

  return (
    <SeatingContext.Provider value={{
      sessions, allMembers, pults, history, date, setDate, part, setPart, piece, setPiece,
      availableParts, msg, loadFile, buildSeats, doSwap, doSwapPults, undo
    }}>
      {children}
    </SeatingContext.Provider>
  );
};