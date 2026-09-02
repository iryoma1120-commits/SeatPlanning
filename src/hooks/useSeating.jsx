import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { parseExcelFile } from '../utils/parser';
import { fetchPartMembers, upsertPartMember, deletePartMember, bulkUpsertPartMembers, normalizeName } from '../services/memberService';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const SeatingContext = createContext();
export const useSeatingContext = () => useContext(SeatingContext);

/**
 * 座席配置のメインロジックを管理するコンテキストプロバイダー
 */
export const SeatingProvider = ({ children }) => {
  const { user } = useAuth();

  // --- 状態定義 ---
  const [sessions, setSessions] = useState([]);    // 練習日程リスト
  const [allMembers, setAllMembers] = useState([]); // 全メンバーデータ (Excel読込結果)
  const [dbMembers, setDbMembers] = useState([]);   // Supabaseから読み込んだパートメンバー設定
  const [pults, setPults] = useState([]);          // 現在表示中のプルト配置
  const [history, setHistory] = useState([]);       // アンドゥ用の履歴
  
  const [date, setDate] = useState("");            // 選択中の練習日
  const [part, setPart] = useState("");            // 選択中のパート
  const [piece, setPiece] = useState("前曲");       // 選択中の曲設定（練習/本番：前/中/メイン）
  const [msg, setMsg] = useState({ text: "", type: "" }); // 通知メッセージ
  const [loadingMembers, setLoadingMembers] = useState(false);

  // 利用可能な弦楽器パートのリスト
  const availableParts = useMemo(() => {
    return ["Vn1st", "Vn2nd", "Va", "Vc", "Cb"];
  }, []);

  /**
   * Supabaseからパートメンバー設定を取得
   */
  const loadDbMembers = useCallback(async () => {
    // Supabase有効かつ未認証の場合はフェッチをスキップして空配列にする
    if (isSupabaseConfigured && !user) {
      setDbMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    try {
      const data = await fetchPartMembers();
      setDbMembers(data || []);
    } catch (err) {
      console.error("Supabaseからのデータ取得に失敗:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [user]);

  useEffect(() => {
    loadDbMembers();
  }, [loadDbMembers]);

  /**
   * メンバー設定のSupabase保存
   */
  const saveMember = async (memberData) => {
    try {
      await upsertPartMember(memberData);
      await loadDbMembers(); // リロードして最新化
      setMsg({ text: `✅ ${memberData.name} の設定を保存しました`, type: "text-green-400" });
    } catch (err) {
      setMsg({ text: `❌ 保存に失敗しました: ${err.message}`, type: "text-red-400" });
      throw err;
    }
  };

  /**
   * 複数メンバーの一括保存 (まとめて更新)
   */
  const saveMembersBulk = async (membersList) => {
    try {
      await bulkUpsertPartMembers(membersList);
      await loadDbMembers();
      setMsg({ text: `✅ ${membersList.length}名の設定をまとめて適用しました`, type: "text-green-400" });
    } catch (err) {
      setMsg({ text: `❌ 一括保存に失敗しました: ${err.message}`, type: "text-red-400" });
      throw err;
    }
  };

  /**
   * メンバー設定の削除
   */
  const removeMember = async (id, memberPart) => {
    try {
      await deletePartMember(id, memberPart);
      await loadDbMembers();
      setMsg({ text: "✅ メンバーを削除しました", type: "text-green-400" });
    } catch (err) {
      setMsg({ text: `❌ 削除に失敗しました: ${err.message}`, type: "text-red-400" });
      throw err;
    }
  };

  /**
   * Excelファイルを読み込み、メンバーとセッション情報をパースして状態を更新する
   */
  const loadFile = async (file) => {
    setMsg({ text: "読込中…", type: "" });
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.sessions.length === 0 || parsed.members.length === 0) {
        throw new Error("データが見つかりません（シートの構造を確認してください）");
      }
      setSessions(parsed.sessions);
      setAllMembers(parsed.members);
      setDate(parsed.sessions[0].date); // デフォルトで最初の練習日を選択
      setMsg({ text: `✅ ${file.name} — ${parsed.members.length}名・${parsed.sessions.length}回分を読み込みました`, type: "text-green-400" });
    } catch (err) {
      setMsg({ text: `❌ ${err.message}`, type: "text-red-400" });
    }
  };

  /**
   * 現在の選択条件（日付、パート、曲）に基づいて座席配置を生成する
   */
  const buildSeats = useCallback(() => {
    setHistory([]); // 生成時は履歴をリセット
    if (!date || !part) return;

    const isVn1 = (part === "Vn1st");
    const isVn2 = (part === "Vn2nd");
    const isVn = (isVn1 || isVn2);
    const isMae = piece.includes("前曲") || piece.includes("中曲");
    const isHonban = piece.includes("本番");
    const pieceKey = isMae ? "mae" : "main";

    // Supabaseから取得した設定を正規化名でマッピング
    const memberConfigMap = new Map();
    dbMembers.forEach(dm => {
      const key = dm.name_normalized || normalizeName(dm.name);
      memberConfigMap.set(key, dm);
    });

    // Excelメンバー情報にSupabaseの設定を結合
    const enrichedMembers = allMembers.map(m => {
      const norm = m.nameNormalized || normalizeName(m.name);
      const conf = memberConfigMap.get(norm);
      const assign = conf?.assignments?.[pieceKey] || null;
      return {
        ...m,
        isTop: m.isTop || Boolean(conf?.is_top),
        assignment: assign,
        dbConfig: conf
      };
    });

    let attending;
    if (isVn) {
      // バイオリンの場合：1st/2ndの移動があるため、Vn全体から対象者を取得
      const targetSubPart = isVn1 ? "1st" : "2nd";

      attending = enrichedMembers.filter(m => {
        if (m.part !== "Vn") return false;
        // 練習モードの場合は出欠を確認
        if (!isHonban) {
          const a = m.att[date];
          if (!a || !["○", "△", "▽", "◯"].includes(a.status)) return false;
        }
        // 曲ごとのパート設定（1st/2nd）を確認
        if (!m.assignment?.sub_part) return isVn2; // 設定がない場合はデフォルトで2nd
        return m.assignment.sub_part === targetSubPart;
      });
      attending.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
    } else {
      // その他の楽器：パート一致メンバーを抽出
      attending = enrichedMembers.filter(m => {
        if (m.part !== part) return false;
        if (!isHonban) {
          const a = m.att[date];
          return a && ["○", "△", "▽", "◯"].includes(a.status);
        }
        return true;
      });
      attending.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
    }

    const newPults = [];
    if (isVn) {
      // バイオリン：オモテとウラの指定を反映させてプルトを組む
      const omoList = attending.filter(m => m.assignment?.side === "オモテ");
      const uraList = attending.filter(m => m.assignment?.side === "ウラ");
      const noInfoList = attending.filter(m => !m.assignment?.side);
      const uraAll = [...uraList, ...noInfoList];

      // ♪（トップ）付きを各リストの先頭へ
      omoList.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
      uraAll.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));

      const rows = Math.max(omoList.length, uraAll.length);
      for (let i = 0; i < rows; i++) {
        // [インサイド(ウラ), アウトサイド(オモテ)] の順で格納
        newPults.push({ 
          id: "p" + (i + 1), 
          col: "L", 
          row: i, 
          slots: [uraAll[i]?.name || null, omoList[i]?.name || null] 
        });
      }
    } else {
      // その他の楽器：オモテ・ウラ指定があれば尊重、なければリスト順
      const hasSpecificSide = attending.some(m => m.assignment?.side);
      if (hasSpecificSide) {
        const omoList = attending.filter(m => m.assignment?.side === "オモテ");
        const uraList = attending.filter(m => m.assignment?.side === "ウラ");
        const noInfoList = attending.filter(m => !m.assignment?.side);
        const uraAll = [...uraList, ...noInfoList];

        omoList.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
        uraAll.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));

        const rows = Math.max(omoList.length, uraAll.length);
        for (let i = 0; i < rows; i++) {
          newPults.push({
            id: "p" + (i + 1),
            col: "L",
            row: i,
            slots: [omoList[i]?.name || null, uraAll[i]?.name || null]
          });
        }
      } else {
        for (let i = 0; i < attending.length; i += 2) {
          newPults.push({ 
            id: "p" + (i / 2 + 1), 
            col: "L", 
            row: i / 2, 
            slots: [attending[i]?.name || null, attending[i + 1]?.name || null] 
          });
        }
      }
    }
    setPults(newPults);
  }, [date, part, piece, allMembers, dbMembers]);

  /**
   * 操作前の状態を履歴に保存（アンドゥ用）
   */
  const saveHistory = () => {
    setHistory(prev => {
      const newHist = [...prev, JSON.parse(JSON.stringify(pults))];
      if (newHist.length > 30) newHist.shift(); // 最大30件まで保持
      return newHist;
    });
  };

  /**
   * 特定の座席（スロット）間でメンバーを入れ替える
   */
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

  /**
   * プルトごと（ペア）の場所を入れ替える
   */
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

  /**
   * 1つ前の操作に戻す
   */
  const undo = () => {
    if (!history.length) return;
    const newHist = [...history];
    const prevPults = newHist.pop();
    setPults(prevPults);
    setHistory(newHist);
  };

  return (
    <SeatingContext.Provider value={{
      sessions, allMembers, dbMembers, pults, history, date, setDate, part, setPart, piece, setPiece,
      availableParts, msg, setMsg, loadingMembers, loadDbMembers, saveMember, saveMembersBulk, removeMember,
      loadFile, buildSeats, doSwap, doSwapPults, undo
    }}>
      {children}
    </SeatingContext.Provider>
  );
};