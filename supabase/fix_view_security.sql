-- ==============================================================================
-- ビューのセキュリティ強化・アクセス権限制限スクリプト
-- ==============================================================================

-- 1. 既存のビューを再作成し、`security_invoker = true` を有効化
--    これにより、ビューを実行したユーザー自身の権限で基底テーブル（part_members）の
--    RLS（Row Level Security: authenticatedのみ許可）が必ず評価されるようになります。
CREATE OR REPLACE VIEW public.v_part_members_pieces
WITH (security_invoker = true)
AS
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


-- 2. 権限の厳格化
--    未ログイン（anon）および全ユーザー（public）からのアクセス権を剥奪
REVOKE ALL ON public.v_part_members_pieces FROM anon, public;

--    認証済みアカウント（authenticated）のみに SELECT（読み取り）を許可
GRANT SELECT ON public.v_part_members_pieces TO authenticated;


-- 3. 【セキュリティ確認用】権限設定の確認クエリ
--    anon に SELECT 権限が含まれていないことを確認できます
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'v_part_members_pieces';
