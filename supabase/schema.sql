-- 1. part_members テーブルの作成
CREATE TABLE IF NOT EXISTS public.part_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part TEXT NOT NULL,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  is_top BOOLEAN DEFAULT false,
  assignments JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 検索・名寄せ用のインデックス
CREATE INDEX IF NOT EXISTS idx_part_members_part ON public.part_members(part);
CREATE INDEX IF NOT EXISTS idx_part_members_name_normalized ON public.part_members(name_normalized);

-- 3. RLS（行単位セキュリティ）の有効化
ALTER TABLE public.part_members ENABLE ROW LEVEL SECURITY;

-- 既存の古いポリシーを削除（再実行時のため）
DROP POLICY IF EXISTS "Allow public read part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow public insert part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow public update part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow public delete part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow authenticated read part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow authenticated insert part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow authenticated update part_members" ON public.part_members;
DROP POLICY IF EXISTS "Allow authenticated delete part_members" ON public.part_members;

-- 【重要】認証済みアカウント（authenticatedロール）のみアクセスを許可
CREATE POLICY "Allow authenticated read part_members" 
  ON public.part_members FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated insert part_members" 
  ON public.part_members FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update part_members" 
  ON public.part_members FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete part_members" 
  ON public.part_members FOR DELETE 
  TO authenticated 
  USING (true);

-- 4. 旧 constants.js の初期データ（Vnパート：前曲・中曲・メイン曲）
INSERT INTO public.part_members (part, name, name_normalized, is_top, assignments)
VALUES
  ('Vn', '阿部 有彩', '阿部有彩', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '石井 良磨', '石井良磨', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '伊藤 有彩', '伊藤有彩', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '井上 彰', '井上彰', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}'),
  ('Vn', '畝田 和', '畝田和', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '大木 菜香', '大木菜香', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '大串 美音', '大串美音', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '奥澤 由弦', '奥澤由弦', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '落合 佑紀', '落合佑紀', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}'),
  ('Vn', '尾亦 里彩', '尾亦里彩', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '金森 結菜', '金森結菜', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '黒瀬 笙子', '黒瀬笙子', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '近藤 総司', '近藤総司', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '坂井 詠', '坂井詠', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}'),
  ('Vn', '佐々木 達彦', '佐々木達彦', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '佐藤 由梨花', '佐藤由梨花', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '志幸 直人', '志幸直人', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '清水 優暉', '清水優暉', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '杉田 愛', '杉田愛', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}'),
  ('Vn', '杉田 萌', '杉田萌', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '鈴木 颯人', '鈴木颯人', false, '{"mae": {"sub_part": "1st", "side": "ウラ"}, "naka": {"sub_part": "1st", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}'),
  ('Vn', '鈴木 美波', '鈴木美波', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}'),
  ('Vn', '高橋 飛羽', '高橋飛羽', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '綱谷 尚', '綱谷尚', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '濵中 紗句', '濵中紗句', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "オモテ"}}'),
  ('Vn', '平山 裕祐', '平山裕祐', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '深見 珠央', '深見珠央', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '向井 智春', '向井智春', false, '{"mae": {"sub_part": "1st", "side": "オモテ"}, "naka": {"sub_part": "1st", "side": "オモテ"}, "main": {"sub_part": "1st", "side": "ウラ"}}'),
  ('Vn', '村尾 京香', '村尾京香', false, '{"mae": {"sub_part": "2nd", "side": "ウラ"}, "naka": {"sub_part": "2nd", "side": "ウラ"}, "main": {"sub_part": "2nd", "side": "オモテ"}}'),
  ('Vn', '渡邊 寛生', '渡邊寛生', false, '{"mae": {"sub_part": "2nd", "side": "オモテ"}, "naka": {"sub_part": "2nd", "side": "オモテ"}, "main": {"sub_part": "2nd", "side": "ウラ"}}')
ON CONFLICT DO NOTHING;

-- 5. 【便利ビュー】Supabaseダッシュボードで前・中・メインのパート（1st/2nd/降り）を一覧確認できるビュー
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
FROM public.part_members;
