export function generateTextOutput(date, part, piece, sessions, pults) {
  const isVn = (part === "Vn1st" || part === "Vn2nd");

  let t = `【${part} ${piece}】\n`;
  t += isVn ? `ウラ　　　オモテ\n` : `オモテ　　ウラ\n`;

  const lp = pults.filter(p => p.col === "L").sort((a, b) => a.row - b.row);
  for (let i = 0; i < lp.length; i++) {
    const pult = lp[i];
    // Vnの場合は slots[0]がウラ、slots[1]がオモテとして格納されている
    const left = lastName(pult.slots[0] || "－");
    const right = lastName(pult.slots[1] || "－");
    t += pad(left, 8) + right + "\n";
  }

  const total = pults.reduce((s, p) => s + p.slots.filter(Boolean).length, 0);
  t += `\n合計 ${total}名`;

  return t;
}

function lastName(fullName) {
  return fullName.split(/[\s　]/)[0];
}

function pad(str, len) {
  let w = 0;
  for (const ch of str) w += /[\u3000-\u9fff]/.test(ch) ? 2 : 1;
  return str + " ".repeat(Math.max(0, len - w));
}