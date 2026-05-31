/**
 * 現在の座席配置をクリップボードコピー用のテキスト形式に変換する
 */
export function generateTextOutput(date, part, piece, sessions, pults) {
  const isVn = (part === "Vn1st" || part === "Vn2nd");

  let t = `【${part} ${piece}】\n`;
  // バイオリンは [ウラ, オモテ]、それ以外は [オモテ, ウラ] の順でラベルを表示
  t += isVn ? `ウラ　　　オモテ\n` : `オモテ　　ウラ\n`;

  // カラムごとにプルトをソート
  const lp = pults.filter(p => p.col === "L").sort((a, b) => a.row - b.row);

  // 同姓の判定に使用するため、表示されている全メンバー名をリスト化
  const activeNames = pults.flatMap(p => p.slots).filter(Boolean);

  for (let i = 0; i < lp.length; i++) {
    const pult = lp[i];
    // Vnの場合、内部データ構造は slots[0]=ウラ(Inside), slots[1]=オモテ(Outside)
    const left = formatName(pult.slots[0] || "－", activeNames);
    const right = formatName(pult.slots[1] || "－", activeNames);
    // 8文字分の等幅パディングを適用して体裁を整える
    t += pad(left, 8) + right + "\n";
  }

  const total = pults.reduce((s, p) => s + p.slots.filter(Boolean).length, 0);
  t += `\n合計 ${total}名`;

  return t;
}

/**
 * 名前を整形する。同姓がいる場合は「佐藤(健)」のように頭文字を付与する。
 */
function formatName(fullName, allNames) {
  if (fullName === "－") return "－";

  const parts = fullName.split(/[\s　]/); // 半角/全角スペースで分割
  const last = parts[0];
  const first = parts[1] || "";

  // 自分以外のメンバーに同じ苗字の人がいるかチェック
  const hasSameLast = allNames.some(name => {
    if (name === fullName) return false;
    return name.split(/[\s　]/)[0] === last;
  });

  // 同姓がいる場合は苗字に名前の1文字目を添える
  if (hasSameLast && first) {
    return `${last}(${first[0]})`;
  }
  return last; // 基本は苗字のみ表示
}

/**
 * 全角文字を考慮した簡易的な文字列パディング
 */
function pad(str, len) {
  let w = 0;
  for (const ch of str) w += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1;
  return str + " ".repeat(Math.max(0, len - w));
}