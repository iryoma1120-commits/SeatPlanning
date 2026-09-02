-- ==============================================================================
-- 弦4パート（Vn, Va, Vc, Cb）以外のメンバーを削除するSQLスクリプト
-- ==============================================================================

-- 1. 【確認用】削除対象となるレコードを事前に確認する場合（SELECT）
-- 実行して、意図しないメンバーが含まれていないかご確認ください。
SELECT 
  id, 
  part, 
  name, 
  created_at 
FROM public.part_members 
WHERE part NOT IN ('Vn', 'Va', 'Vc', 'Cb')
ORDER BY part, name;


-- 2. 【削除実行用】弦4パート（Vn, Va, Vc, Cb）以外のメンバーを削除
DELETE FROM public.part_members 
WHERE part NOT IN ('Vn', 'Va', 'Vc', 'Cb');


-- 3. 【完了確認用】削除後に残ったパート別の件数を確認
SELECT 
  part, 
  count(*) as member_count 
FROM public.part_members 
GROUP BY part 
ORDER BY part;
