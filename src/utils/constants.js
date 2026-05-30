export const VN_PARTS = {
  "阿部 有彩":  {mae:"1st",ms:"ウラ",   main:"1st",ns:"オモテ"},
  "阿部有彩":   {mae:"1st",ms:"ウラ",   main:"1st",ns:"オモテ"},
  "石井 良磨":  {mae:"2nd",ms:"オモテ", main:"2nd",ns:"オモテ"},
  "石井良磨":   {mae:"2nd",ms:"オモテ", main:"2nd",ns:"オモテ"},
  "伊藤 有彩":  {mae:"2nd",ms:"オモテ", main:"2nd",ns:"オモテ"},
  "伊藤有彩":   {mae:"2nd",ms:"オモテ", main:"2nd",ns:"オモテ"},
  "井上 彰":    {mae:"2nd",ms:"ウラ",   main:"2nd",ns:"ウラ"},
  "井上彰":     {mae:"2nd",ms:"ウラ",   main:"2nd",ns:"ウラ"},
  // ... (※文字数制限のため一部省略していますが、元のデータをすべてここに配置します) ...
  "渡邊 寛生":  {mae:"2nd",ms:"オモテ", main:"2nd",ns:"ウラ"},
  "渡邊寛生":   {mae:"2nd",ms:"オモテ", main:"2nd",ns:"ウラ"},
};

export const COLORS = {
  Vn:   {bg:"#0c1f3a",border:"#3b82f6",text:"#93c5fd",badge:"#1d4ed8"},
  Vn1st:{bg:"#0c1f3a",border:"#3b82f6",text:"#93c5fd",badge:"#1d4ed8"},
  Vn2nd:{bg:"#0b2016",border:"#4ade80",text:"#86efac",badge:"#15803d"},
  Va:   {bg:"#14163a",border:"#818cf8",text:"#c7d2fe",badge:"#4338ca"},
  Vc:   {bg:"#180f2e",border:"#a78bfa",text:"#ddd6fe",badge:"#6d28d9"},
  Cb:   {bg:"#1a0b2e",border:"#c084fc",text:"#e9d5ff",badge:"#7e22ce"},
  Fl:   {bg:"#0c2a1a",border:"#34d399",text:"#a7f3d0",badge:"#059669"},
  Ob:   {bg:"#0c2614",border:"#4ade80",text:"#bbf7d0",badge:"#16a34a"},
  Cl:   {bg:"#122610",border:"#86efac",text:"#dcfce7",badge:"#15803d"},
  Fg:   {bg:"#16260c",border:"#a3e635",text:"#ecfccb",badge:"#4d7c0f"},
  Hr:   {bg:"#2a180c",border:"#fb923c",text:"#fed7aa",badge:"#c2410c"},
  Tp:   {bg:"#2a100c",border:"#f87171",text:"#fecaca",badge:"#b91c1c"},
  Tb:   {bg:"#260a0a",border:"#fca5a5",text:"#fee2e2",badge:"#991b1b"},
  Perc: {bg:"#1c1a0c",border:"#fde047",text:"#fef08a",badge:"#a16207"},
  default:{bg:"#141414",border:"#94a3b8",text:"#cbd5e1",badge:"#475569"},
};

export const PART_ORDER=["Vn1st","Vn2nd","Va","Vc","Cb","Fl","Ob","Cl","Fg","Hr","Tp","Tb","Perc","Harp","Piano","Celesta"];

export function getC(part){
  return COLORS[part]||COLORS.default;
}