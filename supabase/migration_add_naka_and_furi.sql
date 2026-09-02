-- ==============================================================================
-- マイグレーションSQL: 前曲・中曲・メイン曲の3区分化 & 「降り」パート対応
-- ==============================================================================

-- 1. 既存のレコードで assignments に 'naka'（中曲）が存在しない場合、
--    前曲('mae')の設定をデフォルト値としてコピーして 'naka' を作成・更新する
UPDATE public.part_members
SET assignments = jsonb_set(
  assignments,
  '{naka}',
  COALESCE(assignments->'mae', '{"sub_part": "1st", "side": "オモテ"}'::jsonb),
  true
)
WHERE assignments->'naka' IS NULL;


-- 2. Supabaseダッシュボード（Table Editor / SQL Editor）から
--    前曲・中曲・メイン曲のパート（1st / 2nd / 降り）を一覧で確認できるビューを作成
CREATE OR REPLACE VIEW public.v_part_members_pieces AS
SELECT 
  id,
  part,
  name,
  is_top,
  assignments->'mae'->>'sub_part'  AS mae_part,
  assignments->'mae'->>'side'      AS mae_side,
  assignments->'naka'->>'sub_part' AS naka_part,
  assignments->'naka'->>'side'     AS naka_side,
  assignments->'main'->>'sub_part' AS main_part,
  assignments->'main'->>'side'     AS main_side,
  updated_at
FROM public.part_members
ORDER BY part, name;


-- 3. 【動作確認用】ビューの内容を確認
-- 前曲・中曲・メイン曲のパート（1st/2nd/降り）とオモテウラが列として一覧表示されます。
SELECT * FROM public.v_part_members_pieces;
