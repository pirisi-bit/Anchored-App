/**
 * Generates App Store / Play Store marketing screenshots for Anchored.
 *
 * Each frame is composed as SVG (a caption + a device mockup whose screen
 * mirrors the real app UI) and rasterised to PNG with ImageMagick (librsvg).
 * Output is written at the two iPhone sizes Apple requires:
 *   - 6.7" : 1290 x 2796
 *   - 6.5" : 1242 x 2688
 * and a 1080 x 1920 phone size for Google Play.
 *
 * Run:  node artifacts/mobile/store/generate-screenshots.mjs
 * (Requires the Inter font installed for fontconfig and `magick` on PATH.)
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "screenshots");

// ---- palette (mirrors artifacts/mobile/constants/colors.ts) ----
const C = {
  bg: "#F5F3EF",
  fg: "#1C1C1E",
  card: "#FFFFFF",
  muted: "#6B7280",
  border: "rgba(0,0,0,0.08)",
  primary: "#3B82F6",
  primaryFg: "#FFFFFF",
  sky: "#60B8FF",
  yellow: "#FFD93D",
  sage: "#6BCB77",
  orange: "#FF8C42",
  lavender: "#C589E8",
  coral: "#FF6B6B",
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const F = "Inter, 'DejaVu Sans', sans-serif";

function text(x, y, s, { size = 28, weight = 400, fill = C.fg, anchor = "start", spacing = 0 } = {}) {
  const ls = spacing ? ` letter-spacing="${spacing}"` : "";
  return `<text x="${x}" y="${y}" font-family="${F}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`;
}

function rrect(x, y, w, h, r, fill, { stroke, sw = 1 } = {}) {
  const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"${st}/>`;
}

// ---- canvas geometry (designed at 6.7") ----
const W = 1290;
const H = 2796;

// device mockup
const DEV_W = 968;
const DEV_X = (W - DEV_W) / 2;
const DEV_Y = 660;
const DEV_R = 96;
const BEZEL = 22;
const DEV_H = H - DEV_Y + 40; // run off the bottom edge

// inner screen
const sX = DEV_X + BEZEL;
const sY = DEV_Y + BEZEL;
const sW = DEV_W - BEZEL * 2;
const sR = DEV_R - BEZEL;

function statusBar() {
  const y = sY + 60;
  return [
    text(sX + 56, y, "9:41", { size: 30, weight: 600 }),
    // signal / wifi / battery (simplified)
    `<g transform="translate(${sX + sW - 150}, ${y - 22})">
       <rect x="0" y="6" width="34" height="16" rx="4" fill="${C.fg}"/>
       <rect x="44" y="2" width="36" height="20" rx="6" fill="none" stroke="${C.fg}" stroke-width="3"/>
       <rect x="48" y="6" width="24" height="12" rx="2" fill="${C.fg}"/>
       <rect x="82" y="8" width="4" height="8" rx="2" fill="${C.fg}"/>
     </g>`,
  ].join("");
}

const cardX = sX + 44;
const cardW = sW - 88;

function statusBadge(x, y, kind) {
  // kind: verified | self | unverified ; (x,y) is right edge / vertical center
  let bg, fg, label;
  if (kind === "verified") { bg = "rgba(107,203,119,0.18)"; fg = C.sage; label = "Verified"; }
  else if (kind === "self") { bg = "rgba(255,217,61,0.28)"; fg = "#B45309"; label = "Self-confirmed"; }
  else { bg = "#F3F4F6"; fg = C.muted; label = "Unverified"; }
  const w = kind === "self" ? 220 : kind === "verified" ? 150 : 150;
  const bx = x - w;
  const dot = kind === "unverified" ? "" :
    `<circle cx="${bx + 28}" cy="${y}" r="9" fill="${fg}"/>`;
  const tx = kind === "unverified" ? bx + w / 2 : bx + 46;
  const anchor = kind === "unverified" ? "middle" : "start";
  return `${rrect(bx, y - 26, w, 52, 26, bg)}${dot}${text(tx, y + 9, label, { size: 24, weight: 600, fill: fg, anchor })}`;
}

function actionBtn(x, y, w, label, { filled = false, icon } = {}) {
  const h = 76;
  const bg = filled ? C.primary : C.card;
  const stroke = filled ? C.primary : C.border;
  const fg = filled ? C.primaryFg : C.fg;
  const cx = x + w / 2;
  let ic = "";
  if (icon === "check") ic = `<path d="M ${cx - 58} ${y + 38} l 10 10 l 20 -22" fill="none" stroke="${fg}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (icon === "camera") ic = `<g stroke="${fg}" stroke-width="4" fill="none"><rect x="${cx - 66}" y="${y + 28}" width="34" height="24" rx="5"/><circle cx="${cx - 49}" cy="${y + 40}" r="7"/></g>`;
  if (icon === "file") ic = `<g stroke="${fg}" stroke-width="4" fill="none"><rect x="${cx - 64}" y="${y + 26}" width="26" height="30" rx="4"/><line x1="${cx - 58}" y1="${y + 36}" x2="${cx - 44}" y2="${y + 36}"/><line x1="${cx - 58}" y1="${y + 44}" x2="${cx - 44}" y2="${y + 44}"/></g>`;
  const tx = icon ? cx + 8 : cx;
  return `${rrect(x, y, w, h, 22, bg, { stroke, sw: 1.5 })}${ic}${text(tx, y + 48, label, { size: 26, weight: 500, fill: fg, anchor: "middle" })}`;
}

function anchorCard(x, y, { name, category, color, state }) {
  // state: 'todo' | 'self' | 'verified'
  const h = state === "todo" ? 224 : 168;
  let inner = "";
  inner += `<circle cx="${x + 40}" cy="${y + 56}" r="11" fill="${color}"/>`;
  inner += text(x + 70, y + 50, name, { size: 30, weight: 700 });
  inner += text(x + 70, y + 86, category, { size: 24, weight: 400, fill: C.muted });
  inner += statusBadge(x + cardW - 32, y + 56, state === "verified" ? "verified" : state === "self" ? "self" : "unverified");
  if (state === "todo") {
    const gap = 18;
    const bw = (cardW - 64 - gap * 2) / 3;
    const bx = x + 32;
    const by = y + 120;
    inner += actionBtn(bx, by, bw, "Confirm", { icon: "check" });
    inner += actionBtn(bx + bw + gap, by, bw, "Photo", { icon: "camera" });
    inner += actionBtn(bx + (bw + gap) * 2, by, bw, "Receipt", { icon: "file", filled: true });
  } else {
    inner += text(x + 70, y + 132, "View Proof  \u2192", { size: 26, weight: 500, fill: C.primary });
  }
  return rrect(x, y, cardW, h, 30, C.card, { stroke: C.border, sw: 1.5 }) + inner;
}

function progressCard(x, y, done, total, hint) {
  const h = 196;
  const pct = total === 0 ? 0 : done / total;
  const barX = x + 40, barY = y + 96, barW = cardW - 80, barH = 22;
  let s = rrect(x, y, cardW, h, 36, C.card, { stroke: C.border, sw: 1.5 });
  s += text(x + 40, y + 64, "Daily progress", { size: 30, weight: 600 });
  s += text(x + cardW - 40, y + 64, `${done}/${total}`, { size: 32, weight: 700, fill: C.primary, anchor: "end" });
  s += rrect(barX, barY, barW, barH, 11, "#EDEAE4");
  if (pct > 0) s += rrect(barX, barY, Math.max(barW * pct, barH), barH, 11, C.primary);
  s += text(x + 40, y + 158, hint, { size: 26, weight: 400, fill: C.muted });
  return s;
}

function header(date, title) {
  return text(cardX, sY + 150, date, { size: 28, weight: 500, fill: C.muted }) +
    text(cardX, sY + 214, title, { size: 64, weight: 700, spacing: -1 });
}

function bottomNav(active) {
  const navY = sY + (H - DEV_Y - BEZEL * 2 - 30) - 0; // approximate; place near bottom of visible screen
  const y = DEV_Y + DEV_H - 150;
  const items = [
    { k: "Today", icon: "home" },
    { k: "Anchors", icon: "anchor" },
    { k: "History", icon: "clock" },
    { k: "Settings", icon: "gear" },
  ];
  const colW = sW / items.length;
  let s = `<rect x="${sX}" y="${y}" width="${sW}" height="${H}" fill="${C.card}"/>`;
  s += `<line x1="${sX}" y1="${y}" x2="${sX + sW}" y2="${y}" stroke="${C.border}" stroke-width="1.5"/>`;
  items.forEach((it, i) => {
    const cx = sX + colW * i + colW / 2;
    const on = it.k === active;
    const col = on ? C.primary : C.muted;
    s += `<circle cx="${cx}" cy="${y + 46}" r="8" fill="${col}"/>`;
    s += text(cx, y + 92, it.k, { size: 22, weight: on ? 600 : 400, fill: col, anchor: "middle" });
  });
  return s;
}

// ---- screen builders (return SVG drawn within the clipped screen) ----
function screenDashboard({ allDone = false } = {}) {
  let s = `<rect x="${sX}" y="${sY}" width="${sW}" height="${H}" fill="${C.bg}"/>`;
  s += statusBar();
  if (allDone) {
    s += header("Tuesday, June 7", "Today");
    s += progressCard(cardX, sY + 250, 5, 5, "All anchors verified today. Nice work.");
    let y = sY + 250 + 196 + 36;
    const rows = [
      { name: "Locked front door", category: "Home Safety", color: C.sage, state: "verified" },
      { name: "Morning medication", category: "Medication", color: C.sky, state: "verified" },
      { name: "Paid electricity", category: "Bills & Receipts", color: C.yellow, state: "verified" },
      { name: "Fed pet", category: "Pet Care", color: C.orange, state: "verified" },
    ];
    for (const r of rows) { s += anchorCard(cardX, y, r); y += 168 + 28; }
  } else {
    s += header("Tuesday, June 7", "Today");
    s += progressCard(cardX, sY + 250, 2, 5, "40% done \u2014 keep it up.");
    let y = sY + 250 + 196 + 36;
    s += anchorCard(cardX, y, { name: "Locked front door", category: "Home Safety", color: C.sage, state: "verified" }); y += 168 + 28;
    s += anchorCard(cardX, y, { name: "Morning medication", category: "Medication", color: C.sky, state: "self" }); y += 168 + 28;
    s += anchorCard(cardX, y, { name: "Paid electricity", category: "Bills & Receipts", color: C.yellow, state: "todo" }); y += 224 + 28;
  }
  s += bottomNav("Today");
  return s;
}

function screenCapture() {
  // dimmed dashboard behind + capture sheet
  let s = `<rect x="${sX}" y="${sY}" width="${sW}" height="${H}" fill="${C.bg}"/>`;
  s += statusBar();
  s += header("Tuesday, June 7", "Today");
  s += progressCard(cardX, sY + 250, 2, 5, "40% done \u2014 keep it up.");
  // scrim
  s += `<rect x="${sX}" y="${sY}" width="${sW}" height="${H}" fill="rgba(0,0,0,0.45)"/>`;
  // sheet
  const shY = sY + 620;
  const shH = H;
  s += rrect(sX, shY, sW, shH, 48, C.card);
  s += `<rect x="${sX + sW / 2 - 36}" y="${shY + 30}" width="72" height="9" rx="4.5" fill="rgba(120,120,120,0.35)"/>`;
  s += text(cardX, shY + 110, "Proof: Paid electricity", { size: 34, weight: 700 });
  // preview image placeholder (a stylised receipt photo)
  const pvX = cardX, pvY = shY + 150, pvW = cardW, pvH = 560;
  s += `<defs><linearGradient id="pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCEFD8"/><stop offset="1" stop-color="#F3DFC0"/></linearGradient></defs>`;
  s += rrect(pvX, pvY, pvW, pvH, 30, "url(#pv)");
  // receipt mock inside
  const rcX = pvX + pvW / 2 - 150, rcY = pvY + 70, rcW = 300, rcH = 420;
  s += rrect(rcX, rcY, rcW, rcH, 16, "#FFFFFF");
  s += text(rcX + rcW / 2, rcY + 60, "RECEIPT", { size: 26, weight: 700, fill: "#9A7B4F", anchor: "middle", spacing: 3 });
  for (let i = 0; i < 6; i++) {
    s += rrect(rcX + 36, rcY + 110 + i * 44, rcW - 72 - (i % 2) * 40, 14, 7, "#E7DFD2");
  }
  s += rrect(rcX + 36, rcY + 110 + 6 * 44 + 20, rcW - 72, 22, 11, "#CBB68F");
  // actions
  const aY = pvY + pvH + 36;
  const aW = (cardW - 24) / 2;
  s += actionBtn(cardX, aY, aW, "Retake");
  s += `<g>${rrect(cardX + aW + 24, aY, aW, 76, 22, C.primary)}${text(cardX + aW + 24 + aW / 2, aY + 48, "Use this receipt", { size: 26, weight: 600, fill: C.primaryFg, anchor: "middle" })}</g>`;
  return s;
}

function screenTimeline() {
  let s = `<rect x="${sX}" y="${sY}" width="${sW}" height="${H}" fill="${C.bg}"/>`;
  s += statusBar();
  s += text(cardX, sY + 150, "Your proof, day by day", { size: 28, weight: 500, fill: C.muted });
  s += text(cardX, sY + 214, "History", { size: 64, weight: 700, spacing: -1 });

  const groups = [
    {
      date: "Today \u00b7 June 7", items: [
        { name: "Locked front door", color: C.sage, kind: "verified", t: "8:12 PM" },
        { name: "Morning medication", color: C.sky, kind: "self", t: "8:05 AM" },
      ]
    },
    {
      date: "Yesterday \u00b7 June 6", items: [
        { name: "Paid electricity", color: C.yellow, kind: "verified", t: "6:40 PM" },
        { name: "Evening medication", color: C.sky, kind: "self", t: "9:30 PM" },
        { name: "Fed pet", color: C.orange, kind: "verified", t: "7:15 AM" },
      ]
    },
  ];
  let y = sY + 300;
  for (const g of groups) {
    s += text(cardX, y, g.date, { size: 28, weight: 600, fill: C.fg });
    y += 44;
    for (const it of g.items) {
      const h = 132;
      s += rrect(cardX, y, cardW, h, 26, C.card, { stroke: C.border, sw: 1.5 });
      s += `<circle cx="${cardX + 44}" cy="${y + 56}" r="11" fill="${it.color}"/>`;
      s += text(cardX + 72, y + 50, it.name, { size: 29, weight: 600 });
      s += text(cardX + 72, y + 92, it.t, { size: 24, weight: 400, fill: C.muted });
      s += statusBadge(cardX + cardW - 28, y + 60, it.kind);
      y += h + 24;
    }
    y += 24;
  }
  s += bottomNav("History");
  return s;
}

function screenReminder() {
  let s = `<rect x="${sX}" y="${sY}" width="${sW}" height="${H}" fill="${C.bg}"/>`;
  s += statusBar();
  s += text(cardX, sY + 150, "Make it a habit", { size: 28, weight: 500, fill: C.muted });
  s += text(cardX, sY + 214, "Settings", { size: 64, weight: 700, spacing: -1 });

  // Reminder card
  const cy = sY + 300;
  const ch = 360;
  s += rrect(cardX, cy, cardW, ch, 32, C.card, { stroke: C.border, sw: 1.5 });
  s += text(cardX + 40, cy + 70, "Daily reminder", { size: 34, weight: 700 });
  // toggle on
  const tgX = cardX + cardW - 150, tgY = cy + 44;
  s += rrect(tgX, tgY, 110, 60, 30, C.sage);
  s += `<circle cx="${tgX + 110 - 30}" cy="${tgY + 30}" r="24" fill="#FFFFFF"/>`;
  s += text(cardX + 40, cy + 120, "One gentle nudge about anything you", { size: 26, weight: 400, fill: C.muted });
  s += text(cardX + 40, cy + 156, "haven't confirmed yet.", { size: 26, weight: 400, fill: C.muted });
  // time row
  s += `<line x1="${cardX + 40}" y1="${cy + 200}" x2="${cardX + cardW - 40}" y2="${cy + 200}" stroke="${C.border}" stroke-width="1.5"/>`;
  s += text(cardX + 40, cy + 268, "Reminder time", { size: 30, weight: 500 });
  s += rrect(cardX + cardW - 230, cy + 232, 190, 70, 18, "#F3F4F6");
  s += text(cardX + cardW - 135, cy + 278, "8:00 PM", { size: 30, weight: 600, anchor: "middle", fill: C.fg });

  // a notification banner preview floating above
  const nbY = cy + ch + 56;
  s += rrect(cardX, nbY, cardW, 180, 30, "#FFFFFF", { stroke: C.border, sw: 1.5 });
  s += rrect(cardX + 32, nbY + 36, 76, 76, 18, C.primary);
  s += `<path d="M ${cardX + 52} ${nbY + 86} q 18 -34 36 0" fill="none" stroke="#FFFFFF" stroke-width="5"/><circle cx="${cardX + 70}" cy="${nbY + 60}" r="9" fill="#FFFFFF"/>`;
  s += text(cardX + 130, nbY + 64, "Anchored", { size: 26, weight: 700 });
  s += text(cardX + 130, nbY + 110, "2 routines still need confirming today.", { size: 26, weight: 400, fill: C.muted });
  s += text(cardX + cardW - 40, nbY + 64, "now", { size: 22, weight: 400, fill: C.muted, anchor: "end" });

  s += bottomNav("Settings");
  return s;
}

// All-done celebratory state
function screenAllDone() {
  let s = `<rect x="${sX}" y="${sY}" width="${sW}" height="${H}" fill="${C.bg}"/>`;
  s += statusBar();
  s += header("Tuesday, June 7", "Today");
  s += progressCard(cardX, sY + 250, 5, 5, "All anchors verified today. Nice work.");
  // big check medallion
  const mcx = sX + sW / 2, mcy = sY + 760;
  s += `<circle cx="${mcx}" cy="${mcy}" r="150" fill="rgba(107,203,119,0.16)"/>`;
  s += `<circle cx="${mcx}" cy="${mcy}" r="104" fill="${C.sage}"/>`;
  s += `<path d="M ${mcx - 46} ${mcy} l 30 32 l 64 -70" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += text(mcx, mcy + 250, "You're all caught up", { size: 46, weight: 700, anchor: "middle" });
  s += text(mcx, mcy + 308, "Every anchor confirmed. Rest easy \u2014", { size: 28, weight: 400, fill: C.muted, anchor: "middle" });
  s += text(mcx, mcy + 348, "nothing's left to wonder about today.", { size: 28, weight: 400, fill: C.muted, anchor: "middle" });
  s += bottomNav("Today");
  return s;
}

// ---- frame composition ----
const FRAMES = [
  { name: "01-hero", caption: ["Everything's", "under control."], tint: C.sky, build: () => screenDashboard() },
  { name: "02-glance", caption: ["See what's done", "at a glance."], tint: C.sage, build: () => screenDashboard() },
  { name: "03-proof", caption: ["Proof you can trust", "\u2014 not just memory."], tint: C.yellow, build: () => screenCapture() },
  { name: "04-timeline", caption: ["Your dated record,", "always there."], tint: C.lavender, build: () => screenTimeline() },
  { name: "05-reminder", caption: ["One gentle nudge,", "on your schedule."], tint: C.orange, build: () => screenReminder() },
  { name: "06-alldone", caption: ["Nothing left to", "worry about today."], tint: C.sage, build: () => screenAllDone() },
];

function tintBg(hex, a) {
  // hex like #RRGGBB -> rgba over cream
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function frameSVG(frame) {
  const top = tintBg(frame.tint, 0.22);
  const screen = frame.build();
  const capY = 250;
  const lines = frame.caption
    .map((ln, i) => text(W / 2, capY + i * 86, ln, { size: 76, weight: 800, anchor: "middle", spacing: -1.5 }))
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="0.55" stop-color="${C.bg}"/>
      <stop offset="1" stop-color="${C.bg}"/>
    </linearGradient>
    <clipPath id="screenClip">
      <rect x="${sX}" y="${sY}" width="${sW}" height="${DEV_H - BEZEL * 2}" rx="${sR}" ry="${sR}"/>
    </clipPath>
    <filter id="devShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="30" stdDeviation="40" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${lines}
  <rect x="${DEV_X}" y="${DEV_Y}" width="${DEV_W}" height="${DEV_H}" rx="${DEV_R}" ry="${DEV_R}" fill="#0B0B0C" filter="url(#devShadow)"/>
  <g clip-path="url(#screenClip)">
    ${screen}
  </g>
  <rect x="${DEV_X}" y="${DEV_Y}" width="${DEV_W}" height="${DEV_H}" rx="${DEV_R}" ry="${DEV_R}" fill="none" stroke="#000000" stroke-width="${BEZEL}"/>
  <rect x="${sX}" y="${sY}" width="${sW}" height="${DEV_H - BEZEL * 2}" rx="${sR}" ry="${sR}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
</svg>`;
}

// ---- render ----
rmSync(OUT, { recursive: true, force: true });
const sizes = [
  { dir: "ios-6.7", w: 1290, h: 2796 },
  { dir: "ios-6.5", w: 1242, h: 2688 },
  { dir: "android-phone", w: 1080, h: 1920 },
];
for (const sz of sizes) mkdirSync(join(OUT, sz.dir), { recursive: true });

for (const frame of FRAMES) {
  const svg = frameSVG(frame);
  const svgPath = join(OUT, `${frame.name}.svg`);
  writeFileSync(svgPath, svg);
  for (const sz of sizes) {
    const png = join(OUT, sz.dir, `${frame.name}.png`);
    execFileSync("magick", ["-background", "none", "-density", "144", svgPath, "-resize", `${sz.w}x${sz.h}!`, png]);
    process.stdout.write(`  ${sz.dir}/${frame.name}.png\n`);
  }
  rmSync(svgPath);
}
console.log("done");
