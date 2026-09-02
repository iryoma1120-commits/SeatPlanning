import React, { useState, useMemo } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export const ALLOWED_PARTS = ['Vn', 'Va', 'Vc', 'Cb'];

const PART_OPTIONS = [
  { id: 'All', label: 'すべて (弦4パート)' },
  { id: 'Vn', label: 'ヴァイオリン (Vn)' },
  { id: 'Va', label: 'ヴィオラ (Va)' },
  { id: 'Vc', label: 'チェロ (Vc)' },
  { id: 'Cb', label: 'コントラバス (Cb)' },
];

export default function MemberManagerView({ onOpenAuth }) {
  const { 
    dbMembers, 
    allMembers, 
    saveMember, 
    saveMembersBulk,
    removeMember, 
    loadDbMembers,
    loadingMembers 
  } = useSeatingContext();

  const { user } = useAuth();

  const [selectedPart, setSelectedPart] = useState('Vn');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState(null); // null: 新規, オブジェクト: 編集

  // リスト直接編集の保留中変更 { [memberKey]: updatedMemberObject }
  const [pendingChanges, setPendingChanges] = useState({});

  // フォーム用入力値
  const [formName, setFormName] = useState('');
  const [formPart, setFormPart] = useState('Vn');
  const [formIsTop, setFormIsTop] = useState(false);
  const [formMaeSubPart, setFormMaeSubPart] = useState('1st');
  const [formMaeSide, setFormMaeSide] = useState('オモテ');
  const [formMainSubPart, setFormMainSubPart] = useState('1st');
  const [formMainSide, setFormMainSide] = useState('オモテ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フィルタリング（Vn, Va, Vc, Cb のみを表示対象とする）
  const filteredMembers = useMemo(() => {
    return dbMembers.filter(m => {
      // 弦4パート以外は表示しない
      if (!ALLOWED_PARTS.includes(m.part)) return false;
      const matchPart = selectedPart === 'All' ? true : m.part === selectedPart;
      const matchSearch = searchQuery.trim() === '' || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name_normalized?.includes(searchQuery.replace(/\s+/g, ''));
      return matchPart && matchSearch;
    });
  }, [dbMembers, selectedPart, searchQuery]);

  // パートごとの人数統計
  const stats = useMemo(() => {
    const total = filteredMembers.length;
    const topCount = filteredMembers.filter(m => m.is_top).length;
    return { total, topCount };
  }, [filteredMembers]);

  const isAuthRequired = isSupabaseConfigured && !user;

  /**
   * リスト上でパート分け(1st/2nd)やオモテ/ウラを変更したとき、ローカル状態に保留する
   */
  const handleStageChange = (member, pieceKey, field, value) => {
    const key = member.id || member.name_normalized || member.name;
    const currentObj = pendingChanges[key] || member;
    const currentPieceConfig = currentObj.assignments?.[pieceKey] || { sub_part: '1st', side: 'オモテ' };

    const updatedPieceConfig = {
      ...currentPieceConfig,
      [field]: value,
    };

    const updatedAssignments = {
      ...(currentObj.assignments || {}),
      [pieceKey]: updatedPieceConfig,
    };

    setPendingChanges(prev => ({
      ...prev,
      [key]: {
        ...currentObj,
        assignments: updatedAssignments,
      }
    }));
  };

  /**
   * 保留中の変更をすべてまとめてSupabaseに適用・保存する
   */
  const handleApplyAll = async () => {
    if (isAuthRequired) {
      alert("変更を保存するにはログインが必要です。");
      onOpenAuth && onOpenAuth();
      return;
    }

    const toSave = Object.values(pendingChanges);
    if (toSave.length === 0) return;

    setIsSubmitting(true);
    try {
      await saveMembersBulk(toSave);
      setPendingChanges({}); // 保留リストをクリア
    } catch (err) {
      alert("一括適用エラー: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 保留中の変更を取り消す
   */
  const handleDiscardAll = () => {
    if (Object.keys(pendingChanges).length > 0) {
      if (window.confirm("未適用の変更を取り消して元の状態に戻しますか？")) {
        setPendingChanges({});
      }
    }
  };

  const startEdit = (m) => {
    if (isAuthRequired) {
      alert("メンバー情報を編集するにはログインが必要です。");
      onOpenAuth && onOpenAuth();
      return;
    }
    setEditingMember(m);
    setFormName(m.name);
    setFormPart(m.part || 'Vn');
    setFormIsTop(Boolean(m.is_top));
    setFormMaeSubPart(m.assignments?.mae?.sub_part || '1st');
    setFormMaeSide(m.assignments?.mae?.side || 'オモテ');
    setFormMainSubPart(m.assignments?.main?.sub_part || '1st');
    setFormMainSide(m.assignments?.main?.side || 'オモテ');
    // 入力フォームへスムーズスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormName('');
    setFormPart(selectedPart === 'All' ? 'Vn' : selectedPart);
    setFormIsTop(false);
    setFormMaeSubPart('1st');
    setFormMaeSide('オモテ');
    setFormMainSubPart('1st');
    setFormMainSide('オモテ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAuthRequired) {
      alert("データベースへの登録にはログインが必要です。");
      onOpenAuth && onOpenAuth();
      return;
    }
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      await saveMember({
        id: editingMember?.id,
        part: formPart,
        name: formName.trim(),
        is_top: formIsTop,
        assignments: {
          mae: { sub_part: formMaeSubPart, side: formMaeSide },
          main: { sub_part: formMainSubPart, side: formMainSide }
        }
      });
      resetForm();
    } catch (err) {
      alert("保存エラー: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m) => {
    if (isAuthRequired) {
      alert("削除するにはログインが必要です。");
      onOpenAuth && onOpenAuth();
      return;
    }
    if (!window.confirm(`「${m.name}」(${m.part}) を削除しますか？`)) return;
    try {
      await removeMember(m.id, m.part);
      if (editingMember?.id === m.id) resetForm();
    } catch (err) {
      alert("削除エラー: " + err.message);
    }
  };

  const handleImportFromExcel = async () => {
    if (isAuthRequired) {
      alert("Excelデータの取り込みにはログインが必要です。");
      onOpenAuth && onOpenAuth();
      return;
    }
    if (allMembers.length === 0) {
      alert("先に出欠表（Excel）を読み込んでください。ヘッダーの「📂 出欠表を読み込む」から読み込めます。");
      return;
    }
    const currentNames = new Set(dbMembers.map(m => m.name_normalized));
    const toImport = allMembers.filter(m => 
      ALLOWED_PARTS.includes(m.part) && !currentNames.has(m.nameNormalized)
    );

    if (toImport.length === 0) {
      alert("出欠表内の弦4パート（Vn, Va, Vc, Cb）の全メンバーは既に登録されています。");
      return;
    }

    if (!window.confirm(`出欠表から未登録の弦楽器メンバー ${toImport.length} 名を取り込んで登録しますか？`)) return;

    setIsSubmitting(true);
    try {
      for (const m of toImport) {
        await saveMember({
          part: m.part || 'Vn',
          name: m.name,
          is_top: Boolean(m.isTop),
          assignments: {
            mae: { sub_part: "1st", side: "オモテ" },
            main: { sub_part: "1st", side: "オモテ" }
          }
        });
      }
      alert(`合計 ${toImport.length} 名のメンバーを取り込みました。`);
    } catch (err) {
      alert("取り込み中にエラーが発生しました: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 text-[#dde4f0] space-y-6">
      
      {/* 画面見出し & ステータス */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#070e1c] border border-[#1a2d45] rounded-2xl p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2.5">
            <span>👥</span> パートメンバー名簿・登録
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            各パートのメンバーと曲ごとの割り当て（1st/2nd、オモテ/ウラ）を管理・保存できます
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 ${
            !isSupabaseConfigured
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
              : user
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                : 'bg-red-950/80 text-red-300 border border-red-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {!isSupabaseConfigured
              ? 'ローカル保存モード'
              : user
                ? `Supabase接続中 (${user.email})`
                : '未ログイン（保存制限中）'
            }
          </span>
          {isAuthRequired && (
            <button
              onClick={() => onOpenAuth && onOpenAuth()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow"
            >
              🔑 ログイン
            </button>
          )}
        </div>
      </div>

      {/* 認証アラート */}
      {isAuthRequired && (
        <div className="bg-gradient-to-r from-red-950/80 via-amber-950/80 to-blue-950/80 border border-red-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔒</span>
            <span>
              <strong>データベースへのアクセスは認証済みアカウント限定です。</strong>
              メンバー情報の確認・登録・編集を行うにはログインしてください。
            </span>
          </div>
          <button
            onClick={() => onOpenAuth && onOpenAuth()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg whitespace-nowrap shadow transition"
          >
            ログインする
          </button>
        </div>
      )}

      {/* メイングリッド（左：一覧・検索、右：登録・編集フォーム） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左側：パート選択 ＆ メンバー一覧テーブル（8カラム） */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* パート選択タブバー */}
          <div className="bg-[#070e1c] border border-[#1a2d45] rounded-xl p-3">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              🎼 対象パートを選択
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PART_OPTIONS.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPart(p.id);
                    if (p.id !== 'All' && !editingMember) setFormPart(p.id);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                    selectedPart === p.id
                      ? 'bg-blue-600 text-white shadow font-bold'
                      : 'bg-[#0f192b] text-gray-300 hover:bg-[#182845] border border-[#1e2f4d]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 検索・統計・アクションバー */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070e1c] border border-[#1a2d45] rounded-xl p-3.5">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="メンバー氏名で検索…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#060d1c] border border-[#243650] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute left-2.5 top-2 text-gray-500 text-xs">🔍</span>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                表示: <strong className="text-blue-400">{stats.total}</strong>名
                {stats.topCount > 0 && ` (うち主席: ${stats.topCount}名)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleImportFromExcel}
                disabled={isSubmitting || allMembers.length === 0 || isAuthRequired}
                className="bg-[#122b45] hover:bg-[#1c3d61] disabled:opacity-40 text-blue-300 text-xs py-1.5 px-3 rounded-lg border border-blue-700/60 font-medium transition whitespace-nowrap"
                title="読み込み中の出欠表から未登録のメンバーを取り込みます"
              >
                📥 出欠表から取り込む ({allMembers.length > 0 ? `${allMembers.length}名` : '未読込'})
              </button>
              <button
                onClick={loadDbMembers}
                className="bg-[#101b2e] hover:bg-[#192a47] text-gray-300 text-xs py-1.5 px-3 rounded-lg border border-gray-700 font-medium transition"
              >
                🔄 再読込
              </button>
            </div>
          </div>

          {/* 未適用の変更がある場合に表示する一括保存・適用バー */}
          {Object.keys(pendingChanges).length > 0 && (
            <div className="bg-gradient-to-r from-amber-950/90 to-blue-950/90 border border-amber-600/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5 text-xs text-amber-200">
                <span className="text-xl animate-pulse">⚡</span>
                <span>
                  <strong>{Object.keys(pendingChanges).length} 名</strong> のパート分け・オモテウラの変更が未適用です
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardAll}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition"
                >
                  ↩ 取り消す
                </button>
                <button
                  type="button"
                  onClick={handleApplyAll}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <><span>⏳</span> 保存中…</>
                  ) : (
                    <><span>💾</span> 変更を適用して保存 ({Object.keys(pendingChanges).length}件)</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* メンバー確認テーブル */}
          <div className="bg-[#070e1c] border border-[#1a2d45] rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto max-h-[520px]">
              {loadingMembers ? (
                <div className="p-10 text-center text-sm text-gray-400">読み込み中…</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-500">
                  {isAuthRequired 
                    ? '🔒 ログインするとメンバー名簿が表示されます。' 
                    : '該当するメンバーはいません。右側のフォームから追加してください。'}
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0d182b] text-gray-300 border-b border-[#1a2d45] sticky top-0 z-10">
                    <tr>
                      <th className="p-3">パート</th>
                      <th className="p-3">氏名</th>
                      <th className="p-3">役職</th>
                      <th className="p-3 min-w-[155px]">
                        前曲・中曲
                        <span className="block text-[10px] font-normal text-blue-400/80">※クリックで選択</span>
                      </th>
                      <th className="p-3 min-w-[155px]">
                        メイン曲
                        <span className="block text-[10px] font-normal text-blue-400/80">※クリックで選択</span>
                      </th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132238]">
                    {filteredMembers.map(m => {
                      const memberKey = m.id || m.name_normalized || m.name;
                      const activeMember = pendingChanges[memberKey] || m;
                      const isPending = Boolean(pendingChanges[memberKey]);

                      const maeSubPart = activeMember.assignments?.mae?.sub_part || '1st';
                      const maeSide = activeMember.assignments?.mae?.side || 'オモテ';
                      const mainSubPart = activeMember.assignments?.main?.sub_part || '1st';
                      const mainSide = activeMember.assignments?.main?.side || 'オモテ';

                      return (
                        <tr 
                          key={memberKey} 
                          className={`hover:bg-[#0c182c] transition ${
                            editingMember?.id === m.id 
                              ? 'bg-blue-950/40 border-l-4 border-l-blue-500' 
                              : isPending 
                                ? 'bg-amber-950/25 border-l-4 border-l-amber-500' 
                                : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-blue-400">{m.part}</td>
                          <td className="p-3 font-medium text-white text-[13px] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {isPending && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                  未適用
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {m.is_top ? (
                              <span className="bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap">
                                ♪ 首席
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>

                          {/* 前曲・中曲（直接編集） */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              {/* 1st / 2nd トグルボタン */}
                              <div className="inline-flex rounded-lg border border-[#223859] bg-[#060e1c] p-0.5 shadow-inner">
                                {['1st', '2nd'].map(sp => {
                                  const isSelected = maeSubPart === sp;
                                  return (
                                    <button
                                      key={sp}
                                      type="button"
                                      onClick={() => handleStageChange(m, 'mae', 'sub_part', sp)}
                                      className={`px-2 py-0.5 text-xs font-bold rounded transition ${
                                        isSelected
                                          ? isPending && (m.assignments?.mae?.sub_part || '1st') !== sp
                                            ? 'bg-amber-600 text-white shadow'
                                            : 'bg-blue-600 text-white shadow'
                                          : 'text-gray-400 hover:text-white hover:bg-[#122238]'
                                      }`}
                                      title={`前曲を ${sp} に設定（適用ボタンで保存）`}
                                    >
                                      {sp}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* オモテ / ウラ トグルボタン */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSide = maeSide === 'オモテ' ? 'ウラ' : 'オモテ';
                                  handleStageChange(m, 'mae', 'side', nextSide);
                                }}
                                className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border transition ${
                                  maeSide === 'ウラ'
                                    ? 'bg-purple-950/70 border-purple-800 text-purple-300 hover:bg-purple-900/80'
                                    : 'bg-emerald-950/70 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80'
                                }`}
                                title="クリックで前曲のオモテ/ウラを切り替え（適用ボタンで保存）"
                              >
                                {maeSide}
                              </button>
                            </div>
                          </td>

                          {/* メイン曲（直接編集） */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              {/* 1st / 2nd トグルボタン */}
                              <div className="inline-flex rounded-lg border border-[#223859] bg-[#060e1c] p-0.5 shadow-inner">
                                {['1st', '2nd'].map(sp => {
                                  const isSelected = mainSubPart === sp;
                                  return (
                                    <button
                                      key={sp}
                                      type="button"
                                      onClick={() => handleStageChange(m, 'main', 'sub_part', sp)}
                                      className={`px-2 py-0.5 text-xs font-bold rounded transition ${
                                        isSelected
                                          ? isPending && (m.assignments?.main?.sub_part || '1st') !== sp
                                            ? 'bg-amber-600 text-white shadow'
                                            : 'bg-blue-600 text-white shadow'
                                          : 'text-gray-400 hover:text-white hover:bg-[#122238]'
                                      }`}
                                      title={`メイン曲を ${sp} に設定（適用ボタンで保存）`}
                                    >
                                      {sp}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* オモテ / ウラ トグルボタン */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSide = mainSide === 'オモテ' ? 'ウラ' : 'オモテ';
                                  handleStageChange(m, 'main', 'side', nextSide);
                                }}
                                className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border transition ${
                                  mainSide === 'ウラ'
                                    ? 'bg-purple-950/70 border-purple-800 text-purple-300 hover:bg-purple-900/80'
                                    : 'bg-emerald-950/70 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80'
                                }`}
                                title="クリックでメイン曲のオモテ/ウラを切り替え（適用ボタンで保存）"
                              >
                                {mainSide}
                              </button>
                            </div>
                          </td>

                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => startEdit(m)}
                              disabled={isAuthRequired}
                              className="px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800 disabled:opacity-30 text-blue-300 text-xs font-medium transition"
                            >
                              ✏️ 編集
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              disabled={isAuthRequired}
                              className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 disabled:opacity-30 text-red-300 text-xs font-medium transition"
                            >
                              🗑️ 削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* 右側：登録・編集フォーム（4カラム） */}
        <div className="lg:col-span-4">
          <div className="bg-[#070e1c] border border-[#1a2d45] rounded-2xl p-5 sticky top-20 shadow-xl">
            
            <div className="flex items-center justify-between mb-4 border-b border-[#182740] pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{editingMember ? '✏️ メンバー編集' : '➕ メンバー新規登録'}</span>
              </h3>
              {editingMember && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  新規登録に戻る
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              
              <div>
                <label className="block text-gray-300 mb-1 font-medium">楽器パート</label>
                <select
                  value={formPart}
                  onChange={e => setFormPart(e.target.value)}
                  disabled={isAuthRequired}
                  className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-3 py-2 text-white disabled:opacity-40"
                >
                  {ALLOWED_PARTS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-medium">メンバー氏名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 山田 太郎"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  disabled={isAuthRequired}
                  className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-3 py-2 text-white placeholder-gray-600 disabled:opacity-40 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 py-1 bg-[#0b1424] p-3 rounded-lg border border-[#16253d]">
                <input
                  type="checkbox"
                  id="viewFormIsTop"
                  checked={formIsTop}
                  onChange={e => setFormIsTop(e.target.checked)}
                  disabled={isAuthRequired}
                  className="w-4 h-4 rounded bg-[#060d1c] border-[#243650] text-blue-600"
                />
                <label htmlFor="viewFormIsTop" className="text-gray-200 select-none cursor-pointer font-medium">
                  ♪ 首席・副首席（最前列優先配置）
                </label>
              </div>

              {/* 前曲・中曲設定 */}
              <div className="border border-[#1a2d45] rounded-xl p-3.5 bg-[#060c18]">
                <div className="font-semibold text-blue-300 mb-2 flex items-center gap-1.5">
                  <span>🎵</span> 前曲・中曲での配置
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">パート区分</label>
                    <select
                      value={formMaeSubPart}
                      onChange={e => setFormMaeSubPart(e.target.value)}
                      disabled={isAuthRequired}
                      className="w-full bg-[#091222] border border-[#243650] rounded-lg px-2.5 py-1.5 text-white disabled:opacity-40"
                    >
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">席位置</label>
                    <select
                      value={formMaeSide}
                      onChange={e => setFormMaeSide(e.target.value)}
                      disabled={isAuthRequired}
                      className="w-full bg-[#091222] border border-[#243650] rounded-lg px-2.5 py-1.5 text-white disabled:opacity-40"
                    >
                      <option value="オモテ">オモテ (外側)</option>
                      <option value="ウラ">ウラ (内側)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* メイン曲設定 */}
              <div className="border border-[#1a2d45] rounded-xl p-3.5 bg-[#060c18]">
                <div className="font-semibold text-blue-300 mb-2 flex items-center gap-1.5">
                  <span>🎼</span> メイン曲での配置
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">パート区分</label>
                    <select
                      value={formMainSubPart}
                      onChange={e => setFormMainSubPart(e.target.value)}
                      disabled={isAuthRequired}
                      className="w-full bg-[#091222] border border-[#243650] rounded-lg px-2.5 py-1.5 text-white disabled:opacity-40"
                    >
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">席位置</label>
                    <select
                      value={formMainSide}
                      onChange={e => setFormMainSide(e.target.value)}
                      disabled={isAuthRequired}
                      className="w-full bg-[#091222] border border-[#243650] rounded-lg px-2.5 py-1.5 text-white disabled:opacity-40"
                    >
                      <option value="オモテ">オモテ (外側)</option>
                      <option value="ウラ">ウラ (内側)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                {editingMember && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition font-medium"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || isAuthRequired}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition shadow-lg"
                >
                  {isSubmitting 
                    ? '保存中…' 
                    : editingMember 
                      ? '更新して保存' 
                      : '名簿に登録する'
                  }
                </button>
              </div>

            </form>

          </div>
        </div>

      </div>

      {/* スクロール時にもすぐ適用できるフローティング一括保存バー */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="fixed bottom-5 right-5 z-40 bg-[#081326] border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4 backdrop-blur-md animate-bounce-short">
          <div className="text-xs">
            <span className="font-bold text-white block">⚡ {Object.keys(pendingChanges).length}件の変更を保留中</span>
            <span className="text-[11px] text-gray-400">適用を押すとSupabaseにまとめて保存されます</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardAll}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition"
            >
              取り消す
            </button>
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
            >
              {isSubmitting ? '保存中…' : '💾 まとめて適用'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
