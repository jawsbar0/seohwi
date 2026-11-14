/* 서휘 기록보관소 — 빌드 없는 정적 위키
   내용: content/index.json(목록·인포박스) + content/pages/<slug>.md(본문) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const main = $("#main"), side = $("#side"), q = $("#q"), results = $("#results");
  let DB = null;
  const cache = {};

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const bySlug = (s) => DB.pages.find((p) => p.slug === s);
  const byTitle = (t) => DB.pages.find((p) => p.title === t || (p.aliases || []).includes(t));
  const catOf = (id) => DB.categories.find((c) => c.id === id);
  const initial = (p) => p.mark || (p.title || "?").replace(/\s.*/, "").slice(-2);

  // 같은 문서는 늘 같은 모양이 나오게 하는 작은 난수
  const rng = (seed) => { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };

  function pic(p, big) {
    const ph = `<div class="ph${p.blur ? " blur" : ""}"><span>${esc(initial(p))}</span>${big ? `<small>${p.img ? "" : "IMAGE PENDING"}</small>` : ""}</div>`;
    const img = p.img ? `<img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()">` : "";
    return ph + img;
  }

  // ── 마크다운 확장 ──
  function prep(md, slug) {
    const r = rng(slug || "x");
    md = md.replace(/^:::sealed[ \t]*(.*)\n([\s\S]*?)^:::[ \t]*$/gm, (_, label, hint) => {
      const n = 2 + Math.floor(r() * 3);
      const bars = Array.from({length: n}, () => `<i style="width:${45 + Math.floor(r() * 55)}%"></i>`).join("");
      return `\n<div class="sealed"><span class="stamp">${esc(label.trim() || "열람 제한")}</span><div class="bars">${bars}</div><p class="hint">${esc(hint.trim()).replace(/\n/g, "<br>")}</p></div>\n`;
    });
    md = md.replace(/\[\[■(\d*)\]\]/g, (_, w) => `<span class="rd" style="--w:${w || 4}em" aria-label="가려진 내용"></span>`);
    md = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, label) => {
      const p = bySlug(t.trim()) || byTitle(t.trim());
      const text = esc(label || (p ? p.title : t));
      return p ? `<a class="wl" href="#/p/${p.slug}">${text}</a>` : `<a class="wl red" title="아직 없는 기록">${text}</a>`;
    });
    return md;
  }

  async function getMd(slug) {
    if (cache[slug] != null) return cache[slug];
    const res = await fetch(`content/pages/${encodeURIComponent(slug)}.md`);
    cache[slug] = res.ok ? await res.text() : "";
    return cache[slug];
  }

  // ── 사이드바 ──
  function buildSide(cur) {
    let h = `<a href="#/"${!cur ? ' class="on"' : ""}>개요</a>`;
    for (const c of DB.categories) {
      h += `<h4>${esc(c.name)}</h4>`;
      const list = DB.pages.filter((p) => p.cat === c.id);
      let g = null;
      if (c.gallery) h += `<a href="#/c/${c.id}"${cur === "c:" + c.id ? ' class="on"' : ""}>전체 보기</a>`;
      for (const p of list) {
        if (p.group && p.group !== g) { g = p.group; h += `<div class="grp">${esc(g)}</div>`; }
        h += `<a href="#/p/${p.slug}"${cur === p.slug ? ' class="on"' : ""}>${esc(p.short || p.title)}${p.sealed ? '<span class="lock">제한</span>' : ""}</a>`;
      }
    }
    side.innerHTML = h;
  }

  // ── 화면 ──
  function home() {
    const s = DB.site;
    const cats = DB.categories.map((c) => {
      const first = DB.pages.find((p) => p.cat === c.id);
      const href = c.gallery ? `#/c/${c.id}` : first ? `#/p/${first.slug}` : "#/";
      return `<a class="card" href="${href}"><em>${esc(c.code || c.id.toUpperCase())}</em><b>${esc(c.name)}</b><span>${esc(c.desc || "")}</span></a>`;
    }).join("");
    const people = DB.pages.filter((p) => p.cat === "people" && p.featured).map(personCard).join("");
    main.innerHTML = `
      <section class="hero">
        <div class="eyebrow">${esc(s.eyebrow || "ARCHIVE")}</div>
        <h1>${esc(s.title)}</h1>
        <p>${esc(s.intro)}</p>
        <div class="notice"><b>열람 안내</b><span>${esc(s.notice)}</span></div>
      </section>
      <div class="sec-h"><h2>분류</h2></div>
      <div class="cards">${cats}</div>
      <div class="sec-h"><h2>주요 인물</h2><a href="#/c/people">인물 전체 →</a></div>
      <div class="gal">${people}</div>
      <p class="foot">${esc(s.footer || "")}</p>`;
    document.title = s.title;
  }

  function personCard(p) {
    return `<a class="pc" href="#/p/${p.slug}"><div class="pic">${pic(p)}${p.sealed ? '<span class="lk">제한</span>' : ""}</div><b>${esc(p.title)}</b><small>${esc(p.card || p.summary || "")}</small></a>`;
  }

  function category(id) {
    const c = catOf(id);
    if (!c) return notFound();
    const list = DB.pages.filter((p) => p.cat === id);
    let h = `<div class="crumb"><a href="#/">기록보관소</a> / ${esc(c.name)}</div><div class="doc"><h1>${esc(c.name)}</h1><p class="lede">${esc(c.desc || "")}</p></div>`;
    const groups = [...new Set(list.map((p) => p.group || ""))];
    for (const g of groups) {
      if (g) h += `<div class="grp-h">${esc(g)}</div>`;
      h += `<div class="gal">${list.filter((p) => (p.group || "") === g).map(personCard).join("")}</div>`;
    }
    main.innerHTML = h;
    document.title = `${c.name} · ${DB.site.title}`;
  }

  async function page(slug) {
    const p = bySlug(slug);
    if (!p) return notFound();
    const c = catOf(p.cat);
    const md = await getMd(slug);
    const html = marked.parse(prep(md, slug), {mangle: false, headerIds: false});
    const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("") + (p.sealed ? '<span class="tag s">일부 열람 제한</span>' : "");
    let info = "";
    if (p.info) {
      const rows = Object.entries(p.info).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${prep(esc(v), slug)}</dd>`).join("");
      info = `<aside class="info"><div class="pic">${pic(p, true)}</div><h3>${esc(p.title)}</h3>${p.alt ? `<div class="alt">${esc(p.alt)}</div>` : ""}<dl>${rows}</dl>${p.quote ? `<p class="quote">“${esc(p.quote)}”</p>` : ""}</aside>`;
    }
    const sib = DB.pages.filter((x) => x.cat === p.cat), i = sib.indexOf(p);
    const prev = sib[i - 1], next = sib[i + 1];
    const pager = `<nav class="pager">${prev ? `<a href="#/p/${prev.slug}"><small>← 이전</small>${esc(prev.title)}</a>` : ""}${next ? `<a class="nx" href="#/p/${next.slug}"><small>다음 →</small>${esc(next.title)}</a>` : ""}</nav>`;
    const doc = `<div class="doc"><div class="crumb"><a href="#/">기록보관소</a> / ${c ? (c.gallery ? `<a href="#/c/${c.id}">${esc(c.name)}</a>` : esc(c.name)) : ""}${p.group ? " / " + esc(p.group) : ""}</div><h1>${esc(p.title)}</h1>${p.summary ? `<p class="lede">${esc(p.summary)}</p>` : ""}${tags ? `<div class="meta">${tags}</div>` : ""}</div>`;
    main.innerHTML = info
      ? `${doc}<div class="has-info doc" style="max-width:1180px">${info}<div class="body">${html}</div></div>${pager}`
      : `${doc}<div class="doc body">${html}</div>${pager}`;
    document.title = `${p.title} · ${DB.site.title}`;
  }

  function notFound() {
    main.innerHTML = `<div class="doc"><div class="crumb">404</div><h1>기록 없음</h1><p class="lede">요청한 기록은 존재하지 않거나, 처음부터 없었던 것으로 처리되었습니다.</p><p><a href="#/">기록보관소로 돌아가기</a></p></div>`;
  }

  async function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [kind, ...rest] = h.split("/");
    const arg = decodeURIComponent(rest.join("/"));
    document.body.classList.remove("nav-open");
    $(".menu-btn").setAttribute("aria-expanded", "false");
    if (kind === "p") { buildSide(arg); await page(arg); }
    else if (kind === "c") { buildSide("c:" + arg); category(arg); }
    else { buildSide(null); home(); }
    window.scrollTo(0, 0);
    main.focus({preventScroll: true});
  }

  // ── 검색 ──
  let act = -1;
  function search() {
    const t = q.value.trim().toLowerCase();
    if (!t) { results.classList.remove("on"); return; }
    const hits = DB.pages.filter((p) => [p.title, p.summary, p.card, ...(p.aliases || []), ...(p.tags || [])].join(" ").toLowerCase().includes(t)).slice(0, 12);
    act = -1;
    results.innerHTML = hits.length ? hits.map((p) => `<a href="#/p/${p.slug}">${esc(p.title)}<small>${esc(catOf(p.cat)?.name || "")} · ${esc(p.card || p.summary || "")}</small></a>`).join("") : `<div class="none">일치하는 기록이 없습니다.</div>`;
    results.classList.add("on");
  }
  q.addEventListener("input", search);
  q.addEventListener("focus", search);
  q.addEventListener("keydown", (e) => {
    const items = [...results.querySelectorAll("a")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); if (!items.length) return;
      act = (act + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle("act", i === act));
    } else if (e.key === "Enter") {
      const a = items[act] || items[0]; if (a) { location.hash = a.getAttribute("href"); q.value = ""; results.classList.remove("on"); q.blur(); }
    } else if (e.key === "Escape") { q.value = ""; results.classList.remove("on"); q.blur(); }
  });
  results.addEventListener("click", () => { q.value = ""; results.classList.remove("on"); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".search")) results.classList.remove("on"); });
  document.addEventListener("keydown", (e) => { if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); } });

  // ── 모바일 메뉴 ──
  $(".menu-btn").addEventListener("click", (e) => { const on = document.body.classList.toggle("nav-open"); e.currentTarget.setAttribute("aria-expanded", on); });
  $("#scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));

  fetch("content/index.json").then((r) => r.json()).then((d) => {
    DB = d;
    $("#siteTitle").textContent = d.site.title;
    $("#siteSub").textContent = d.site.sub || "";
    window.addEventListener("hashchange", route);
    route();
  }).catch(() => { main.innerHTML = '<p class="loading">목록을 불러오지 못했습니다. 로컬에서 열었다면 간단한 서버로 열어 주세요(README 참고).</p>'; });
})();
