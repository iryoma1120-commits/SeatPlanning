import React, { useState, useMemo } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export default function MemberManagerModal({ isOpen, onClose, onOpenAuth }) {
  const { 
    dbMembers, 
    allMembers, 
    saveMember, 
    removeMember, 
    loadDbMembers,
    loadingMembers 
  } = useSeatingContext();

  const { user } = useAuth();

  const [selectedPart, setSelectedPart] = useState('Vn');
  const [editingMember, setEditingMember] = useState(null); // null: 新規, オブジェクト: 編集
  const [formName, setFormName] = useState('');
  const [formPart, setFormPart] = useState('Vn');
  const [formIsTop, setFormIsTop] = useState(false);
  const [formMaeSubPart, setFormMaeSubPart] = useState('1st');
  const [formMaeSide, setFormMaeSide] = useState('オモテ');
  const [formMainSubPart, setFormMainSubPart] = useState('1st');
  const [formMainSide, setFormMainSide] = useState('オモテ');
  const [isSubmitting, setIsSubmitting] = useState(false);

const ALLOWED_PARTS = ['Vn', 'Va', 'Vc', 'Cb'];

  // 選択パートでフィルタリングしたメンバー一覧（Vn, Va, Vc, Cb のみ）
  const filteredDbMembers = useMemo(() => {
    return dbMembers.filter(m => {
      if (!ALLOWED_PARTS.includes(m.part)) return false;
      return selectedPart === 'All' ? true : m.part === selectedPart;
    });
  }, [dbMembers, selectedPart]);

  if (!isOpen) return null;

  // Supabaseが設定されていて未ログインの場合
  const isAuthRequired = isSupabaseConfigured && !user;

  const startEdit = (m) => {
    if (isAuthRequired) {
      alert("編集するにはログインが必要です。");
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
      alert("データベースへの保存にはログインが必要です。");
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
    if (!window.confirm(`${m.name} を削除しますか？`)) return;
    try {
      await removeMember(m.id, m.part);
      if (editingMember?.id === m.id) resetForm();
    } catch (err) {
      alert("削除エラー: " + err.message);
    }
  };

  // Excelから未登録のメンバーを一括登録する補助機能
  const handleImportFromExcel = async () => {
    if (isAuthRequired) {
      alert("データベースへの取り込みにはログインが必要です。");
      onOpenAuth && onOpenAuth();
      return;
    }
    if (allMembers.length === 0) {
      alert("先にExcelファイルを読み込んでください。");
      return;
    }
    const currentNames = new Set(dbMembers.map(m => m.name_normalized));
    const toImport = allMembers.filter(m => 
      ALLOWED_PARTS.includes(m.part) && !currentNames.has(m.nameNormalized)
    );

    if (toImport.length === 0) {
      alert("出欠表内の弦4パート（Vn, Va, Vc, Cb）の全メンバーは既に登録済みです。");
      return;
    }

    if (!window.confirm(`出欠表から未登録の弦楽器メンバー ${toImport.length} 名を取り込みますか？`)) return;

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
      alert(`${toImport.length} 名のメンバーを取り込みました。`);
    } catch (err) {
      alert("インポート中にエラーが発生しました: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0b1324] border border-[#233554] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#dde4f0]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b2a47] bg-[#070e1c]">
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <h2 className="text-lg font-bold">パートメンバー管理 (Supabase)</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              !isSupabaseConfigured 
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                : user
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950/80 text-red-400 border border-red-800'
            }`}>
              {!isSupabaseConfigured
                ? '▲ ローカル保存モード (.env未設定)'
                : user
                  ? `● ログイン中 (${user.email})`
                  : '🔒 未ログイン（閲覧・保存制限中）'
              }
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* 認証警告バナー（未ログイン時） */}
        {isAuthRequired && (
          <div className="bg-gradient-to-r from-red-950/90 to-amber-950/90 border-b border-red-900/60 px-6 py-3 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-red-200">
              <span className="text-base">🔒</span>
              <span>
                <strong>データベースへのアクセスは認証済みアカウントのみに制限されています。</strong>
                データの取得・編集・保存を行うにはログインしてください。
              </span>
            </div>
            <button
              onClick={() => onOpenAuth && onOpenAuth()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow transition"
            >
              🔑 ログインする
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          
          {/* 左カラム：メンバー一覧 */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5 flex-wrap">
                {['All', 'Vn', 'Va', 'Vc', 'Cb'].map(p => (
                  <button
                    key={p}
                    onClick={() => { setSelectedPart(p); if (p !== 'All') setFormPart(p); }}
                    className={`text-xs px-2.5 py-1 rounded transition ${
                      selectedPart === p 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'bg-[#15233c] text-gray-300 hover:bg-[#1f3358]'
                    }`}
                  >
                    {p === 'All' ? 'すべて' : p}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#1e2f4d] rounded-xl flex-1 overflow-y-auto max-h-[380px] bg-[#060c18]">
              {loadingMembers ? (
                <div className="p-4 text-center text-sm text-gray-400">読み込み中…</div>
              ) : filteredDbMembers.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  {isAuthRequired 
                    ? 'ログインすると登録済みメンバー一覧が表示されます。' 
                    : '登録されたメンバーはいません。'}
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f1d35] sticky top-0 border-b border-[#1e2f4d]">
                    <tr>
                      <th className="p-2.5">パート</th>
                      <th className="p-2.5">氏名</th>
                      <th className="p-2.5">前曲</th>
                      <th className="p-2.5">メイン曲</th>
                      <th className="p-2.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDbMembers.map(m => (
                      <tr key={m.id || m.name} className="border-b border-[#14233c] hover:bg-[#11203b]">
                        <td className="p-2.5 font-bold text-blue-400">{m.part}</td>
                        <td className="p-2.5 font-medium">
                          {m.name}
                          {m.is_top && <span className="ml-1 text-amber-400 font-bold">♪</span>}
                        </td>
                        <td className="p-2.5 text-gray-400">
                          {m.assignments?.mae ? `${m.assignments.mae.sub_part}/${m.assignments.mae.side}` : '-'}
                        </td>
                        <td className="p-2.5 text-gray-400">
                          {m.assignments?.main ? `${m.assignments.main.sub_part}/${m.assignments.main.side}` : '-'}
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <button 
                            onClick={() => startEdit(m)}
                            disabled={isAuthRequired}
                            className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 disabled:opacity-30 text-blue-300 text-[11px]"
                          >
                            編集
                          </button>
                          <button 
                            onClick={() => handleDelete(m)}
                            disabled={isAuthRequired}
                            className="px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 disabled:opacity-30 text-red-300 text-[11px]"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleImportFromExcel}
                disabled={isSubmitting || allMembers.length === 0 || isAuthRequired}
                className="flex-1 bg-[#122b45] hover:bg-[#1c3d61] disabled:opacity-40 text-blue-300 text-xs py-2 px-3 rounded-lg border border-blue-800/60 font-medium transition"
              >
                📥 Excelから未登録者を取り込む ({allMembers.length}名中)
              </button>
              <button
                onClick={loadDbMembers}
                className="bg-[#15233c] hover:bg-[#1f3358] text-gray-300 text-xs py-2 px-3 rounded-lg border border-gray-700 font-medium transition"
              >
                🔄 再読込
              </button>
            </div>
          </div>

          {/* 右カラム：登録・編集フォーム */}
          <div className="w-full md:w-1/2 bg-[#08101e] border border-[#1a2c47] rounded-xl p-5 flex flex-col">
            <h3 className="font-bold text-sm mb-4 text-[#89a4c7] flex items-center justify-between">
              <span>{editingMember ? `✏️ 「${editingMember.name}」の編集` : '➕ メンバー新規登録'}</span>
              {editingMember && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  新規登録に戻る
                </button>
              )}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">楽器パート</label>
                  <select 
                    value={formPart} 
                    onChange={e => setFormPart(e.target.value)}
                    disabled={isAuthRequired}
                    className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-2.5 py-1.5 text-white disabled:opacity-40"
                  >
                    {ALLOWED_PARTS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">氏名</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 山田 太郎"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    disabled={isAuthRequired}
                    className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-2.5 py-1.5 text-white placeholder-gray-600 disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="formIsTop"
                  checked={formIsTop}
                  onChange={e => setFormIsTop(e.target.checked)}
                  disabled={isAuthRequired}
                  className="rounded bg-[#060d1c] border-[#243650] text-blue-500"
                />
                <label htmlFor="formIsTop" className="text-gray-300 select-none">
                  ♪ 主席 / 副主席（最前列優先配置）
                </label>
              </div>

              {/* 前曲設定 */}
              <div className="border border-[#182740] rounded-lg p-3 bg-[#060c18]">
                <div className="font-semibold text-gray-300 mb-2">🎵 前曲・中曲での配置設定</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">パート区分</label>
                    <select 
                      value={formMaeSubPart} 
                      onChange={e => setFormMaeSubPart(e.target.value)}
                      disabled={isAuthRequired}
                      className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-2 py-1 text-white disabled:opacity-40"
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
                      className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-2 py-1 text-white disabled:opacity-40"
                    >
                      <option value="オモテ">オモテ (外側)</option>
                      <option value="ウラ">ウラ (内側)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* メイン曲設定 */}
              <div className="border border-[#182740] rounded-lg p-3 bg-[#060c18]">
                <div className="font-semibold text-gray-300 mb-2">🎼 メイン曲での配置設定</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">パート区分</label>
                    <select 
                      value={formMainSubPart} 
                      onChange={e => setFormMainSubPart(e.target.value)}
                      disabled={isAuthRequired}
                      className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-2 py-1 text-white disabled:opacity-40"
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
                      className="w-full bg-[#060d1c] border border-[#243650] rounded-lg px-2 py-1 text-white disabled:opacity-40"
                    >
                      <option value="オモテ">オモテ (外側)</option>
                      <option value="ウラ">ウラ (内側)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                {editingMember && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || isAuthRequired}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition shadow"
                >
                  {isSubmitting ? '保存中…' : editingMember ? '更新してSupabaseに保存' : 'Supabaseに新規保存'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1b2a47] bg-[#070e1c] flex justify-between items-center text-xs text-gray-400">
          <div>💡 RLSポリシー: <code className="text-blue-300">authenticated</code> (認証済みアカウントのみアクセス可能)</div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a2c47] hover:bg-[#253d61] text-white transition font-medium"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}
