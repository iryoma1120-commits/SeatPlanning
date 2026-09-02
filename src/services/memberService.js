import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const TABLE_NAME = 'part_members';

/**
 * 姓名の表記ゆれを正規化する（空白をすべて除去）
 */
export const normalizeName = (name) => {
  if (!name) return '';
  return name.replace(/[\s　]+/g, '');
};

/**
 * 指定パート（未指定の場合は全パート）のメンバー一覧を取得
 */
export async function fetchPartMembers(part = null) {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[memberService] Supabaseが未設定のため、ローカルストレージを確認します。');
    const local = localStorage.getItem(`seat_members_${part || 'all'}`);
    return local ? JSON.parse(local) : [];
  }

  let query = supabase.from(TABLE_NAME).select('*').order('name');
  if (part) {
    query = query.eq('part', part);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[memberService] fetchPartMembers error:', error);
    throw error;
  }
  return data || [];
}

/**
 * メンバー情報の追加または更新 (Upsert)
 */
export async function upsertPartMember(member) {
  const normalized = normalizeName(member.name);
  const payload = {
    ...member,
    name_normalized: normalized,
    updated_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured || !supabase) {
    // ローカルストレージへのフォールバック保存
    const key = `seat_members_${member.part || 'all'}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = list.findIndex(m => m.name_normalized === normalized);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payload, id: list[idx].id || 'local-' + Date.now() };
    } else {
      list.push({ ...payload, id: 'local-' + Date.now() });
    }
    localStorage.setItem(key, JSON.stringify(list));
    return list;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'part,name_normalized' })
    .select();

  if (error) {
    // onConflict制約がない場合は通常INSERT/UPDATE
    if (member.id) {
      const { data: updated, error: updateErr } = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', member.id)
        .select();
      if (updateErr) throw updateErr;
      return updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from(TABLE_NAME)
        .insert([payload])
        .select();
      if (insertErr) throw insertErr;
      return inserted;
    }
  }
  return data;
}

/**
 * メンバーの削除
 */
export async function deletePartMember(id, part = null) {
  if (!isSupabaseConfigured || !supabase) {
    const key = `seat_members_${part || 'all'}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = list.filter(m => m.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    return filtered;
  }

  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) {
    console.error('[memberService] deletePartMember error:', error);
    throw error;
  }
  return true;
}

/**
 * 複数メンバーの一括保存・更新 (Upsert)
 */
export async function bulkUpsertPartMembers(members) {
  if (!members || members.length === 0) return [];

  const payloads = members.map(m => {
    const p = {
      part: m.part,
      name: m.name,
      name_normalized: normalizeName(m.name),
      is_top: Boolean(m.is_top),
      assignments: m.assignments || {},
      updated_at: new Date().toISOString()
    };
    if (m.id && typeof m.id === 'string' && !m.id.startsWith('local-')) {
      p.id = m.id;
    }
    return p;
  });

  if (!isSupabaseConfigured || !supabase) {
    const key = `seat_members_${members[0]?.part || 'all'}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    payloads.forEach(p => {
      const idx = list.findIndex(item => item.name_normalized === p.name_normalized);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...p };
      } else {
        list.push({ ...p, id: 'local-' + Date.now() });
      }
    });
    localStorage.setItem(key, JSON.stringify(list));
    return payloads;
  }

  // Supabase での一括 upsert
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(payloads, { onConflict: 'part,name_normalized' })
    .select();

  if (error) {
    console.warn('[memberService] batch upsert fallback to individual update:', error);
    // onConflict が設定されていない場合の個別更新フォールバック
    const results = [];
    for (const m of members) {
      const res = await upsertPartMember(m);
      results.push(res);
    }
    return results;
  }
  return data;
}

/**
 * 複数メンバーの一括保存 (互換用)
 */
export async function bulkSavePartMembers(members) {
  return bulkUpsertPartMembers(members);
}
