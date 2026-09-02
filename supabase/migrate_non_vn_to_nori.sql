-- ==============================================================================
-- Va, Vc, Cb メンバーのパート区分を「乗り / 降り」に統一するマイグレーションSQL
-- （Vnの1st/2nd/降り設定には一切影響を与えません）
-- ==============================================================================

-- Va, Vc, Cb の既存レコードで、sub_part が '1st' や '2nd' となっているものを '乗り' に更新
UPDATE public.part_members
SET assignments = jsonb_build_object(
  'mae', jsonb_build_object(
    'sub_part', CASE 
      WHEN assignments->'mae'->>'sub_part' = '降り' THEN '降り' 
      ELSE '乗り' 
    END,
    'side', COALESCE(assignments->'mae'->>'side', 'オモテ')
  ),
  'naka', jsonb_build_object(
    'sub_part', CASE 
      WHEN assignments->'naka'->>'sub_part' = '降り' THEN '降り' 
      ELSE '乗り' 
    END,
    'side', COALESCE(assignments->'naka'->>'side', 'オモテ')
  ),
  'main', jsonb_build_object(
    'sub_part', CASE 
      WHEN assignments->'main'->>'sub_part' = '降り' THEN '降り' 
      ELSE '乗り' 
    END,
    'side', COALESCE(assignments->'main'->>'side', 'オモテ')
  )
)
WHERE part != 'Vn';

-- 更新結果の確認（Va, Vc, Cb のパート区分が「乗り」または「降り」になっていることを確認）
SELECT 
  part, 
  name, 
  assignments->'mae'->>'sub_part'  AS mae, 
  assignments->'naka'->>'sub_part' AS naka, 
  assignments->'main'->>'sub_part' AS main 
FROM public.part_members 
WHERE part != 'Vn'
ORDER BY part, name;
