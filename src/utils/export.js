export function generateTextOutput(date, part, piece, sessions, pults) {
  const isVn = (part === "Vn1st" || part === "Vn2nd");

  let t = `【${part} ${piece}】\n`;
  t += isVn ? `ウラ　　　オモテ\n` : `オモテ　　ウラ\n`;

  const lp = pults.filter(p => p.col === "L").sort((a, b) => a.row - b.row);
  
  // 表示されている全メンバーの名前を抽出
  const activeNames = pults.flatMap(p => p.slots).filter(Boolean);
  
  for (let i = 0; i < lp.length; i++) {
    const pult = lp[i];
    // Vnの場合は slots[0]がウラ、slots[1]がオモテとして格納されている
    const left = formatName(pult.slots[0] || "－", activeNames);
    const right = formatName(pult.slots[1] || "－", activeNames);
    t += pad(left, 8) + right + "\n";
  }

  const total = pults.reduce((s, p) => s + p.slots.filter(Boolean).length, 0);
  t += `\n合計 ${total}名`;

  return t;
}

function formatName(fullName, allNames) {
  if (fullName === "－") return "－";
  
  const parts = fullName.split(/[\s　]/);
  const last = parts[0];
  const first = parts[1] || "";

  // 全メンバーの中で、同じ苗字を持つ人が他にいるかチェック
  const hasSameLast = allNames.some(name => {
    if (name === fullName) return false;
    return name.split(/[\s　]/)[0] === last;
  });

  if (hasSameLast && first) {
    return `${last}(${first[0]})`;
  }
  return last;
}

function pad(str, len) {
  let w = 0;
  for (const ch of str) w += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1;
  return str + " ".repeat(Math.max(0, len - w));
}