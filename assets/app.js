/* DIP End-Sem Prep: routing, Markdown pages, diagrams, progress, home widgets, theme and phone helpers. */

const PAGES = [
  { id: "home", name: "Home" },
  { id: "analysis", name: "PYQ analysis", group: "start" },
  { id: "pyqs", name: "All past papers", group: "start" },
  { id: "style", name: "How to write answers", group: "start" },
  { id: "videos", name: "Video lectures", group: "watch" },
  { id: "unit1", name: "Unit 1 · Fundamentals & spatial", group: "unit" },
  { id: "unit2", name: "Unit 2 · Frequency & restoration", group: "unit" },
  { id: "unit3", name: "Unit 3 · Colour & morphology", group: "unit" },
  { id: "unit4", name: "Unit 4 · Registration & segmentation", group: "unit" },
  { id: "unit5", name: "Unit 5 · Features & recognition", group: "unit" },
  { id: "mock1", name: "Mock Paper 1 · predicted", group: "mock" },
  { id: "mock2", name: "Mock Paper 2", group: "mock" },
  { id: "mock3", name: "Mock Paper 3", group: "mock" },
  { id: "lastnight", name: "Last-night sheet", group: "revise" }
];
const byId = Object.fromEntries(PAGES.map(p => [p.id, p]));
const STUDY = PAGES.filter(p => p.id !== "home");   // the 13 pages that can be marked as done

// Topic frequency across the six papers (2017, 2018, 2019, 2025-26 end-sem; 2025 Mid-1, Mid-2).
const FREQ = [
  { t: "Morphology: dilation, erosion, opening, closing", u: 3, n: 6, href: "#unit3" },
  { t: "Restoration: degradation model + noise models", u: 2, n: 5, href: "#unit2" },
  { t: "Segmentation: thresholding, regions, split-merge", u: 4, n: 5, href: "#unit4" },
  { t: "Histogram equalization (theory + numerical)", u: 1, n: 4, href: "#unit1" },
  { t: "Edge and line detection, gradient masks", u: 4, n: 4, href: "#unit4" },
  { t: "Colour models: RGB, HSI, conversion", u: 3, n: 4, href: "#unit3" },
  { t: "Sampling and quantization", u: 1, n: 4, href: "#unit1" },
  { t: "Frequency filters, homomorphic, periodic noise", u: 2, n: 4, href: "#unit2" },
  { t: "Grey-level transforms, contrast stretching, slicing", u: 1, n: 3, href: "#unit1" },
  { t: "Fundamental steps, components, image model", u: 1, n: 3, href: "#unit1" },
  { t: "Visual perception, brightness adaptation", u: 1, n: 2, href: "#unit1" },
  { t: "Wiener / inverse filter (MMSE)", u: 2, n: 2, href: "#unit2" }
];

const $ = id => document.getElementById(id);
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const cache = {};
let current = null;

/* ---------- storage ---------- */
function load(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
const done = load("dip-done", {});
const isDone = id => !!done[id];

/* ---------- theme ---------- */
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const darkMq = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => { const t = root.dataset.theme; return t ? t === "dark" : darkMq.matches; };
function paintTheme() {
  const dark = isDark();
  document.querySelectorAll(".themebtn").forEach(b => {
    b.innerHTML = (dark ? SUN : MOON) + "<span>" + (dark ? "Light mode" : "Dark mode") + "</span>";
    b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  });
}
document.querySelectorAll(".themebtn").forEach(b => b.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("dip-theme", next); } catch (e) {}
  paintTheme(); onThemeChange();
}));
darkMq.addEventListener("change", () => { paintTheme(); onThemeChange(); });
function onThemeChange() { if (current && current !== "home") renderDoc(current, true); }
paintTheme();

const css = name => getComputedStyle(root).getPropertyValue(name).trim();

/* ---------- Markdown + diagrams ---------- */
// ```mermaid fences become diagrams; on phones, left-to-right charts are redrawn top-to-bottom so labels stay readable.
const renderer = new marked.Renderer();
const baseCode = renderer.code.bind(renderer);
renderer.code = (code, lang, esc) => {
  if (lang !== "mermaid") return baseCode(code, lang, esc);
  let src = code.replace(/\s*&\s*/g, " and ");   // Mermaid prints "&" as "&amp;" in labels
  if (innerWidth < 700) src = src.replace(/^(flowchart|graph)\s+LR/m, "$1 TB");
  return `<div class="diagram"><pre class="mermaid">${src.replace(/</g, "&lt;")}</pre></div>`;
};
marked.use({ renderer, gfm: true });

// ::: ans Title / ::: tip Title / ::: warn Title ... ::: become styled boxes.
function boxes(md) {
  return md.replace(/^::: ?(\w+)(?: (.*))?\n([\s\S]*?)^:::[ \t]*$/gm, (_, kind, title, body) =>
    `<div class="box box-${kind}">${title ? `<p class="box-t">${title}</p>` : ""}\n\n${body}\n\n</div>`);
}

// "@yt <id> | title | channel | duration" lines become a grid of video cards; the player loads only when tapped.
const escHtml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function videos(md) {
  return md.replace(/(?:^@yt .*(?:\r?\n|$))+/gm, block => {
    const cards = block.trim().split(/\r?\n/).map(line => {
      const [id, title, channel, len] = line.slice(4).split("|").map(x => escHtml(x.trim()));
      return `<button type="button" class="vid" data-yt="${id}" aria-label="Play: ${title} (${channel}, ${len})">` +
        `<span class="vid-thumb"><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy"><span class="vid-play" aria-hidden="true"></span><span class="vid-len">${len}</span></span>` +
        `<span class="vid-t">${title}</span><span class="vid-c">${channel}</span></button>`;
    });
    return `<div class="vids">${cards.join("")}</div>\n\n`;
  });
}
// Tapped cards become a full-width YouTube player (IFrame API) with speed buttons and a full-screen button.
// YouTube's embedded player accepts 0.25×–2× only; higher rates are silently capped at 2×.
let ytApi = null;
function loadYT() {
  return ytApi ??= new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = reject;
    document.head.append(s);
  });
}
const savedRate = () => { const r = Number(load("vid-rate", 1)); return r > 0 ? r : 1; };
function playVideo(btn) {
  const id = btn.dataset.yt, title = btn.querySelector(".vid-t").textContent;
  const box = document.createElement("div"); box.className = "vid-thumb vid-on";
  const slot = document.createElement("div"); box.append(slot);
  const bar = document.createElement("div"); bar.className = "vid-bar";
  const card = document.createElement("div"); card.className = "vid playing";
  card.append(box, btn.querySelector(".vid-t"), btn.querySelector(".vid-c"), bar);
  btn.replaceWith(card);
  card.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });

  const fs = document.createElement("button"); fs.type = "button"; fs.className = "vid-btn"; fs.textContent = "⛶ Full screen";
  // Real full screen where allowed; otherwise (some embedded browsers) the player fills the window instead.
  const setMax = on => { card.classList.toggle("vid-max", on); document.body.classList.toggle("vid-max-open", on); fs.textContent = on ? "✕ Exit full size" : "⛶ Full screen"; };
  fs.addEventListener("click", () => {
    if (card.classList.contains("vid-max")) return setMax(false);
    const req = box.requestFullscreen || box.webkitRequestFullscreen;
    try { const p = req && req.call(box); if (p && p.catch) p.catch(() => setMax(true)); } catch (e) { setMax(true); }
    setTimeout(() => { if (!document.fullscreenElement && !document.webkitFullscreenElement) setMax(true); }, 600);
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && card.classList.contains("vid-max")) setMax(false); });
  const yt = document.createElement("a"); yt.className = "vid-yt"; yt.href = `https://www.youtube.com/watch?v=${id}`; yt.target = "_blank"; yt.rel = "noopener"; yt.textContent = "Open on YouTube ↗";

  const fallback = () => {   // API blocked: plain embed, YouTube's own controls only
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    frame.title = title; frame.allowFullscreen = true;
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    slot.replaceWith(frame); bar.append(fs, yt);
  };
  loadYT().then(YT => {
    new YT.Player(slot, {
      host: "https://www.youtube-nocookie.com", videoId: id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: e => {
          const p = e.target, rates = p.getAvailablePlaybackRates().filter(r => r >= 1);
          const label = document.createElement("span"); label.className = "vid-sp-l"; label.textContent = "Speed";
          const group = document.createElement("span"); group.className = "vid-speeds"; group.setAttribute("role", "group"); group.setAttribute("aria-label", "Playback speed");
          const mark = r => group.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.rate) === r)));
          rates.forEach(r => {
            const b = document.createElement("button"); b.type = "button"; b.className = "vid-btn"; b.dataset.rate = r; b.textContent = r + "×";
            b.addEventListener("click", () => { p.setPlaybackRate(r); save("vid-rate", r); mark(r); });
            group.append(b);
          });
          const want = rates.includes(savedRate()) ? savedRate() : 1;
          p.setPlaybackRate(want); mark(want);
          p.addEventListener("onPlaybackRateChange", ev => mark(ev.data));
          const note = document.createElement("span"); note.className = "vid-note"; note.textContent = "2× is YouTube's limit";
          bar.append(label, group, note, fs, yt);
          p.playVideo();
        }
      }
    });
    const frame = box.querySelector("iframe"); if (frame) frame.title = title;
  }).catch(fallback);
}
document.addEventListener("click", e => { const b = e.target.closest("button.vid"); if (b) playVideo(b); });

function initMermaid() {
  mermaid.initialize({
    startOnLoad: false, securityLevel: "strict", theme: "base",
    flowchart: { htmlLabels: false, curve: "basis" },
    themeVariables: {
      fontFamily: css("--body"), fontSize: "14px",
      primaryColor: css("--accent-soft"), primaryBorderColor: css("--accent"), primaryTextColor: css("--ink"),
      secondaryColor: css("--hi-soft"), tertiaryColor: css("--bg"),
      lineColor: css("--muted"), textColor: css("--ink"), mainBkg: css("--accent-soft"), nodeBorder: css("--accent"),
      clusterBkg: css("--bg"), clusterBorder: css("--line"), edgeLabelBackground: css("--surface"), titleColor: css("--ink")
    }
  });
}

/* ---------- navigation state ---------- */
function markNav(page) {
  const grp = byId[page] && byId[page].group;
  document.querySelectorAll("[data-page]").forEach(a => {
    a.classList.toggle("on", a.dataset.page === page);
    if (a.closest(".side-nav")) a.classList.toggle("done", isDone(a.dataset.page));
  });
  document.querySelectorAll(".bottombar [data-group]").forEach(a => a.classList.toggle("on", a.dataset.group === grp));
  const moreOn = ["pyqs", "style", "videos"].includes(page);
  $("moreBtn").classList.toggle("on", moreOn);
}

/* ---------- end-sem countdown (date is tentative; change EXAM_DATE when the date sheet is out) ---------- */
const EXAM_DATE = "2026-12-15";
function daysToExam() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());   // YYYY-MM-DD in IST
  const utc = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((utc(EXAM_DATE) - utc(today)) / 864e5);
}
function updateCountdowns() {
  const days = daysToExam();
  const [num, label] = days > 1 ? [days, "days to end-sem"] : days === 1 ? ["1", "day to end-sem"] : days === 0 ? ["0", "end-sem is today"] : ["✓", "end-sem is over"];
  [["cdnum", "cdlabel"], ["sidecd", "sidecdl"]].forEach(([n, l]) => { $(n).textContent = num; $(l).textContent = label; });
  $("countdown").textContent = days > 1 ? days + " days to go" : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Done";
}
updateCountdowns();
setInterval(updateCountdowns, 60 * 60 * 1000);

/* ---------- routing ---------- */
// "#videos/unit2" opens a page and scrolls to the element with id "v-unit2".
function route() {
  let [page, sub] = location.hash.slice(1).split("/");
  if (!byId[page]) page = "home";
  show(page, sub);
}

function show(page, sub) {
  const first = current === null;
  current = page;
  closeSheet();
  markNav(page);
  $("topTitle").textContent = page === "home" ? "DIP Prep" : byId[page].name;
  const home = page === "home";
  $("home").hidden = !home; $("docpage").hidden = home;
  const sec = home ? $("home") : $("docpage");
  if (!first && !reduceMotion) { sec.classList.remove("enter"); void sec.offsetWidth; sec.classList.add("enter"); }
  window.scrollTo(0, 0);
  if (home) { document.title = "DIP End-Sem Prep · MJPRU CS-403T"; renderHome(); heroAnim.start(); }
  else { heroAnim.stop(); renderDoc(page, false, sub); }
}

async function renderDoc(page, keepScroll, sub) {
  const doc = $("doc"), y = scrollY;
  if (!cache[page]) doc.innerHTML = '<p class="loading">Loading…</p>';
  try {
    cache[page] ??= await fetch(`content/${page}.md`, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); });
  } catch (e) {
    doc.innerHTML = `<p class="loading">Could not load this page (${e.message}). Check your connection and reload.</p>`;
    return;
  }
  if (current !== page) return;
  doc.innerHTML = marked.parse(boxes(videos(cache[page])));
  doc.querySelectorAll("h2, h3").forEach(h => { if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); });
  doc.querySelectorAll("table").forEach(t => t.setAttribute("tabindex", "0"));
  const h1 = doc.querySelector("h1");
  document.title = (h1 ? h1.textContent + " · " : "") + "DIP End-Sem Prep";

  // mock papers get an exam-mode switch that hides the answers
  const isMock = byId[page].group === "mock";
  $("docTools").hidden = !isMock;
  setExamMode(isMock && !!load("dip-exam-" + page, false), page);

  paintDone(page);
  renderPager(page);
  window.dipIcons && window.dipIcons();
  if (keepScroll) window.scrollTo(0, y);
  const target = sub && $("v-" + sub);
  if (target) target.scrollIntoView();

  initMermaid();
  try { await mermaid.run({ nodes: doc.querySelectorAll("pre.mermaid") }); } catch (e) { console.warn(e); }
  if (keepScroll) window.scrollTo(0, y);
}

function setExamMode(on, page) {
  $("doc").classList.toggle("exam-on", on);
  const b = $("examMode");
  b.setAttribute("aria-pressed", String(on));
  b.innerHTML = on ? '<i data-lucide="eye"></i><span>Show answers</span>' : '<i data-lucide="eye-off"></i><span>Exam mode: hide answers</span>';
  b.dataset.page = page;
  window.dipIcons && window.dipIcons();
}
$("examMode").addEventListener("click", e => {
  const b = e.currentTarget, page = b.dataset.page, on = b.getAttribute("aria-pressed") !== "true";
  save("dip-exam-" + page, on); setExamMode(on, page);
});

function paintDone(page) {
  const b = $("doneBtn"), on = isDone(page);
  b.setAttribute("aria-pressed", String(on));
  b.innerHTML = on ? '<i data-lucide="check-check"></i><span>Done · tap to undo</span>' : '<i data-lucide="check"></i><span>Mark this page as done</span>';
  b.dataset.page = page;
  window.dipIcons && window.dipIcons();
}
$("doneBtn").addEventListener("click", e => {
  const page = e.currentTarget.dataset.page;
  if (isDone(page)) delete done[page]; else done[page] = Date.now();
  save("dip-done", done);
  paintDone(page); markNav(page);
});

function renderPager(page) {
  const i = PAGES.findIndex(p => p.id === page), prev = PAGES[i - 1], next = PAGES[i + 1];
  const pg = $("pager"); pg.innerHTML = "";
  const link = (p, cls, label) => { const a = document.createElement("a"); a.className = "pg " + cls; a.href = "#" + p.id; a.innerHTML = `<span class="l">${label}</span><span class="n"></span>`; a.querySelector(".n").textContent = p.name; return a; };
  if (prev) pg.append(link(prev, "prev", "← Previous"));
  if (next) pg.append(link(next, "next", "Next →"));
}

/* ---------- home ---------- */
function renderHome() {
  const units = PAGES.filter(p => p.group === "unit"), mocks = PAGES.filter(p => p.group === "mock"), start = PAGES.filter(p => p.group === "start");
  const count = list => list.filter(p => isDone(p.id)).length;
  const nextOf = list => list.find(p => !isDone(p.id));
  const all = count(STUDY), nextAll = nextOf(STUDY);
  const cards = [
    { icon: "chart-column", list: start, label: "PYQs and answer style", sub: l => l ? "next: " + l.name : "all done" },
    { icon: "book-open", list: units, label: "Units read", sub: l => l ? "next: " + l.name.split(" · ")[0] : "all five done" },
    { icon: "timer", list: mocks, label: "Mock papers written", sub: l => l ? "next: " + l.name.split(" · ")[0] : "all three done" },
    { icon: "flag", list: STUDY, label: "Whole kit", sub: l => l ? Math.round(all * 100 / STUDY.length) + "% of pages done" : "ready for the exam" }
  ];
  const box = $("stats"); box.innerHTML = "";
  const C = 2 * Math.PI * 26, fills = [];
  cards.forEach(c => {
    const n = count(c.list), nx = nextOf(c.list), pct = n / c.list.length;
    const a = document.createElement("a"); a.className = "stat" + (pct === 1 ? " good" : ""); a.href = "#" + (nx ? nx.id : c.list[0].id);
    a.innerHTML = `<span class="ring"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="rt" cx="32" cy="32" r="26"/><circle class="rf" cx="32" cy="32" r="26" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"/></svg><i data-lucide="${c.icon}"></i></span><span class="sx"><span class="l"></span><span class="v">${n}/${c.list.length}</span><span class="s"></span></span>`;
    a.querySelector(".l").textContent = c.label; a.querySelector(".s").textContent = c.sub(nx);
    box.append(a); fills.push([a.querySelector(".rf"), pct]);
  });
  const cta = $("ctaNext");
  if (all === 0) { cta.href = "#analysis"; cta.textContent = "Start with the PYQ analysis"; }
  else if (nextAll) { cta.href = "#" + nextAll.id; cta.textContent = "Continue: " + nextAll.name.split(" · ")[0]; }
  else { cta.href = "#lastnight"; cta.textContent = "Revise: last-night sheet"; }

  const fq = $("freq");
  if (!fq.childElementCount) FREQ.forEach(f => {
    const a = document.createElement("a"); a.className = "fq" + (f.n >= 5 ? " hot" : ""); a.href = f.href;
    a.innerHTML = `<span class="t"><small>Unit ${f.u}</small></span><span class="b"><i></i></span><span class="n">${f.n} / 6</span>`;
    a.querySelector(".t").prepend(document.createTextNode(f.t));
    a.dataset.pct = (f.n / 6 * 100).toFixed(1);
    fq.append(a);
  });
  window.dipIcons && window.dipIcons();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fills.forEach(([f, p]) => { f.style.strokeDashoffset = (C * (1 - p)).toFixed(2); });
    fq.querySelectorAll(".fq").forEach(a => { a.querySelector(".b i").style.width = a.dataset.pct + "%"; });
  }));
}

/* Hero animation: a grid of pixels sweeps from a dark, low-contrast image to its equalized version,
   and the small card shows the histogram doing the same (the Mock 1 numerical: 6,14,20,8,4,4,4,4 → 0,6,14,0,20,8,8,8). */
const heroAnim = (function () {
  const cv = document.querySelector(".hero-net"), hc = document.querySelector(".hist-anim");
  if (!cv || !hc) return { start() {}, stop() {} };
  const ctx = cv.getContext("2d"), hx = hc.getContext("2d");
  const BEFORE = [6, 14, 20, 8, 4, 4, 4, 4], AFTER = [0, 6, 14, 0, 20, 8, 8, 8], MAP = [1, 2, 4, 5, 6, 6, 7, 7];
  let raf = 0, t0 = 0, cols = 0, rows = 0, cells = [], W = 0, H = 0, dpr = 1;
  function setup() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hr = hc.getBoundingClientRect(); hc.width = hr.width * dpr; hc.height = hr.height * dpr; hx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = 22; cols = Math.ceil(W / size); rows = Math.ceil(H / size); cells = [];
    // a smooth dark "image": grey levels 0..7 weighted toward the low end
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = 0.5 + 0.5 * Math.sin(x * 0.35 + Math.cos(y * 0.3) * 1.6) * Math.cos(y * 0.22 - x * 0.08);
      cells.push(Math.max(0, Math.min(7, Math.round(v * v * 4.2 + Math.random() * 0.8))));
    }
  }
  function frame(ts) {
    if (!t0) t0 = ts;
    const period = 7000, p = ((ts - t0) % period) / period;          // 0..1 loop
    const sweep = p < 0.45 ? p / 0.45 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3; // forward, hold, back
    const acc = css("--accent"), size = 22;
    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const r = cells[y * cols + x], edge = x / cols;
      const s = edge < sweep ? MAP[r] : r;
      // keep the text clear: fade toward the left, and on phones (text spans the full width) keep the grid faint
      const fade = W < 700 ? 0.3 * (y / rows) : Math.max(0, (edge - 0.35) / 0.65);
      ctx.globalAlpha = (0.04 + s / 7 * 0.32) * fade;
      ctx.fillStyle = acc; ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    }
    ctx.globalAlpha = 1;
    // histogram card
    const hw = hc.width / dpr, hh = hc.height / dpr, bw = hw / 8, mx = 20, k = sweep * sweep * (3 - 2 * sweep);
    hx.clearRect(0, 0, hw, hh);
    for (let i = 0; i < 8; i++) {
      const v = BEFORE[i] + (AFTER[i] - BEFORE[i]) * k, h = v / mx * (hh - 6);
      hx.fillStyle = acc; hx.globalAlpha = 0.35 + 0.65 * (v / mx);
      hx.fillRect(i * bw + 2, hh - h, bw - 4, h);
    }
    hx.globalAlpha = 1; hx.fillStyle = css("--line"); hx.fillRect(0, hh - 1, hw, 1);
    raf = requestAnimationFrame(frame);
  }
  function drawStatic() { t0 = 0; frame(0); cancelAnimationFrame(raf); raf = 0; }
  addEventListener("resize", () => { if (raf || current === "home") { setup(); if (reduceMotion) drawStatic(); } });
  return {
    start() { setup(); if (reduceMotion) { drawStatic(); return; } if (!raf) raf = requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(raf); raf = 0; }
  };
})();

/* ---------- phones: More sheet, back to top ---------- */
const sheet = $("moreSheet"), moreBtn = $("moreBtn");
function openSheet() { sheet.hidden = false; moreBtn.setAttribute("aria-expanded", "true"); document.body.classList.add("sheet-open"); window.dipIcons && window.dipIcons(); }
function closeSheet() { if (sheet.hidden) return; sheet.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); document.body.classList.remove("sheet-open"); }
moreBtn.addEventListener("click", () => sheet.hidden ? openSheet() : closeSheet());
sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
$("sheetClose").addEventListener("click", closeSheet);
addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

const up = $("totop");
const onScroll = () => up.classList.toggle("show", scrollY > 900);
addEventListener("scroll", onScroll, { passive: true });
up.addEventListener("click", () => scrollTo({ top: 0 }));

const topbar = document.querySelector(".topbar");
const setNavH = () => root.style.setProperty("--navh", (getComputedStyle(topbar).display === "none" ? 0 : topbar.offsetHeight) + "px");
setNavH(); addEventListener("resize", setNavH);

/* ---------- boot ---------- */
addEventListener("hashchange", route);
route();
