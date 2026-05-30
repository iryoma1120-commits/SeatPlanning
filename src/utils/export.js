export function generateTextOutput(date, part, piece, sessions, pults) {
  const isVn = (part === "Vn1st" || part === "Vn2nd");
  const sess = sessions.find(s => s.date === date) || {};

  let t = `【${part} 座席表】\n`;
  t += `📅 ${date}`;
  if (sess.time) t += `　${sess.time}`;
  if (sess.place) t += `　${sess.place}`;
  t += "\n";
  if (isVn) t += `🎵 ${piece}\n`;
  t += "─".repeat(16) + "\n";
  t += `オモテ　　ウラ\n`;

  const lp = pults.filter(p => p.col === "L").sort((a, b) => a.row - b.row);
  for (let i = 0; i < lp.length; i++) {
    const pult = lp[i];
    const omo = lastName(pult.slots[0] || "");
    const ura = lastName(pult.slots[1] || "");
    t += pad(omo, 6) + ura + "\n";
  }

  t += "─".repeat(16) + "\n";
  const total = pults.reduce((s, p) => s + p.slots.filter(Boolean).length, 0);
  t += `合計 ${total}名\n`;

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