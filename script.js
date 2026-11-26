
(() => {
"use strict";
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;
const compactLayout = matchMedia("(max-width: 980px)").matches;
const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const root = document.documentElement;
root.classList.add("no-loader");
document.getElementById("yr").textContent = new Date().getFullYear();
/* V5: all cards remain readable, even if motion setup fails. Animate once on entry. */
if (!reduce && typeof IntersectionObserver !== "undefined") {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add("in-view-once"); reveal.unobserve(entry.target);
    }
  }, {threshold:0});
  $$("[data-reveal], .pillars").forEach(el => reveal.observe(el));
  const activeMotion = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle("motion-paused", !entry.isIntersecting));
  }, {threshold:0});
  $$(".hero__fallback, .hero__visual, .svc .vis, .orbit, .marquee__track").forEach(el => {
    el.classList.add("motion-paused"); activeMotion.observe(el);
  });
}


/* V4: measure the actual loaded display font against its own container.
   Keep all authored headline lines intact, at every viewport width. */
(function fitResponsiveTitles(){
  const titles = $$(".hero__name, .sec-title, .contact__title");
  let frame = 0;
  function fit(){
    frame = 0;
    for (const title of titles){
      title.style.removeProperty("font-size");
      const available = title.clientWidth - 6;
      if (available <= 0) continue;
      const lines = $$(".line > span, .split-line > span", title);
      const widest = Math.max(0, ...lines.map(line => line.offsetWidth));
      const size = parseFloat(getComputedStyle(title).fontSize);
      if (widest > available) title.style.fontSize = (size * available / widest * .985) + "px";
    }
    fitRoles();
  }
  function fitRoles(){
    const role = $(".hero__role"), list = $(".hero__role-list");
    if (!role || !list) return;
    list.style.removeProperty("font-size");
    const available = role.clientWidth - 2;
    const natural = list.offsetWidth;
    if (available > 0 && natural > available) {
      const fixed = [...list.children].filter(el => el.tagName === "I").reduce((sum, el) => sum + el.offsetWidth, 0) + parseFloat(getComputedStyle(list).columnGap || 0) * (list.children.length - 1);
      const size = parseFloat(getComputedStyle(list).fontSize);
      list.style.fontSize = (size * Math.max(0.25, (available - fixed - 2) / Math.max(1, natural - fixed))) + "px";
    }
  }
  function queue(){ if (!frame) frame = requestAnimationFrame(fit); }
  fit(); addEventListener("resize", queue, {passive:true});
  addEventListener("load", queue, {once:true});
  if (document.fonts) { document.fonts.ready.then(queue); document.fonts.addEventListener?.("loadingdone", queue); }
  if (typeof ResizeObserver !== "undefined") {
    const widths = new WeakMap();
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (widths.get(entry.target) !== width) { widths.set(entry.target,width); queue(); }
      }
    });
    titles.forEach(title => observer.observe(title));
  }
})();
/* Touch selects one service at a time; desktop uses hover. */
(function serviceHighlight(){
  const cards = $$(".svc", $("#bento"));
  const clear = () => cards.forEach(c => c.classList.remove("svc--active"));
  cards.forEach(card => card.addEventListener("click", () => {
    if (matchMedia("(hover: none), (pointer: coarse)").matches) {
      const wasActive = card.classList.contains("svc--active"); clear();
      if (!wasActive) card.classList.add("svc--active");
    }
  }));
  document.addEventListener("click", e => { if (!e.target.closest(".svc")) clear(); });
})();

/* ---------------- toast ---------------- */
const openLink = (url) => { url = window.__asset ? window.__asset(url) : url; const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); };
const toastEl = $("#toast"); let toastT;
const toast = (m) => { toastEl.textContent = m; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2600); };

/* ---------------- icons ---------------- */
const ICONS = {
  play:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  poster:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 7h8M8 11h5"/>',
  logo:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18"/>',
  book:'<path d="M2 5l7-2 6 2 7-2v16l-7 2-6-2-7 2z"/><path d="M9 3v16M15 5v16"/>',
  ui:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 9v11"/>',
  card:'<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h6M6 14h4"/>',
  banner:'<rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 12h8"/>',
  menu:'<path d="M6 2h12v20H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  label:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  box:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
};
const svgIcon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]||ICONS.poster}</svg>`;

/* ---------------- placeholder art (temporary until real images are added) ---------------- */
function placeholder(cat, i){
  const [rw, rh] = cat.ratio; const W = 600, H = Math.round(600 * rh / rw);
  const hues = [["#2a4dff","#5ee7ff"],["#1b2fae","#3d8bff"],["#0f2a8a","#7ff0ff"],["#2448e6","#9ab8ff"]];
  const [a,b] = hues[i % hues.length];
  const s = (n) => ((Math.sin((i+1)*n*12.9898)*43758.5453)%1+1)%1;
  const cx = Math.round(W*(.25+s(1)*.5)), cy = Math.round(H*(.25+s(2)*.5)), r = Math.round(Math.min(W,H)*(.25+s(3)*.25));
  const shapes = {
    thumbnails:`<rect x="${W*.06}" y="${H*.62}" width="${W*.55}" height="${H*.2}" rx="10" fill="#fff" opacity=".9"/><circle cx="${W*.78}" cy="${H*.45}" r="${H*.22}" fill="url(#g)" opacity=".9"/>`,
    posters:`<rect x="${W*.1}" y="${H*.1}" width="${W*.8}" height="${H*.5}" rx="8" fill="url(#g)" opacity=".85"/><rect x="${W*.1}" y="${H*.68}" width="${W*.6}" height="${H*.06}" fill="#fff" opacity=".85"/><rect x="${W*.1}" y="${H*.78}" width="${W*.4}" height="${H*.03}" fill="#fff" opacity=".4"/>`,
    branding:`<circle cx="${W/2}" cy="${H*.44}" r="${W*.18}" fill="none" stroke="url(#g)" stroke-width="18"/><rect x="${W*.3}" y="${H*.74}" width="${W*.4}" height="${H*.04}" rx="6" fill="#fff" opacity=".8"/>`,
    cards:`<rect x="${W*.08}" y="${H*.14}" width="${W*.3}" height="${H*.3}" rx="10" fill="url(#g)"/><rect x="${W*.08}" y="${H*.62}" width="${W*.5}" height="${H*.06}" fill="#fff" opacity=".85"/><rect x="${W*.08}" y="${H*.74}" width="${W*.35}" height="${H*.04}" fill="#fff" opacity=".4"/>`,
    banners:`<rect x="${W*.05}" y="${H*.28}" width="${W*.42}" height="${H*.18}" fill="#fff" opacity=".9"/><rect x="${W*.05}" y="${H*.56}" width="${W*.2}" height="${H*.16}" rx="20" fill="url(#g)"/><circle cx="${W*.8}" cy="${H*.5}" r="${H*.36}" fill="url(#g)" opacity=".8"/>`,
    menus:`${[0,1,2,3,4].map(k=>`<rect x="${W*.15}" y="${H*(.28+k*.12)}" width="${W*(.5-k%2*.15)}" height="${H*.025}" fill="#fff" opacity=".6"/><rect x="${W*.75}" y="${H*(.28+k*.12)}" width="${W*.1}" height="${H*.025}" fill="#5ee7ff" opacity=".8"/>`).join("")}<rect x="${W*.15}" y="${H*.1}" width="${W*.7}" height="${H*.08}" fill="url(#g)"/>`,
    labels:`<circle cx="${W/2}" cy="${H/2}" r="${W*.34}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><circle cx="${W/2}" cy="${H/2}" r="${W*.26}" fill="url(#g)" opacity=".85"/>`,
    packaging:`<path d="M${W*.3} ${H*.25} L${W*.6} ${H*.18} L${W*.78} ${H*.28} L${W*.48} ${H*.36}Z" fill="#9ab8ff" opacity=".7"/><path d="M${W*.3} ${H*.25} L${W*.48} ${H*.36} L${W*.48} ${H*.82} L${W*.3} ${H*.7}Z" fill="url(#g)"/><path d="M${W*.48} ${H*.36} L${W*.78} ${H*.28} L${W*.78} ${H*.72} L${W*.48} ${H*.82}Z" fill="#14246e"/>`,
    ui:`<rect x="${W*.06}" y="${H*.08}" width="${W*.88}" height="${H*.84}" rx="16" fill="#0b1230" stroke="#3d8bff" stroke-opacity=".4"/><rect x="${W*.06}" y="${H*.08}" width="${W*.22}" height="${H*.84}" fill="#101a44"/><rect x="${W*.34}" y="${H*.18}" width="${W*.5}" height="${H*.25}" rx="10" fill="url(#g)"/><rect x="${W*.34}" y="${H*.5}" width="${W*.24}" height="${H*.3}" rx="10" fill="#1b2a66"/><rect x="${W*.62}" y="${H*.5}" width="${W*.22}" height="${H*.3}" rx="10" fill="#1b2a66"/>`,
    brochures:`<rect x="${W*.06}" y="${H*.1}" width="${W*.29}" height="${H*.8}" fill="#0b1230"/><rect x="${W*.355}" y="${H*.1}" width="${W*.29}" height="${H*.8}" fill="#101a44"/><rect x="${W*.65}" y="${H*.1}" width="${W*.29}" height="${H*.8}" fill="url(#g)"/><rect x="${W*.69}" y="${H*.7}" width="${W*.2}" height="${H*.05}" fill="#fff"/>`
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="r" cx="${cx/W}" cy="${cy/H}" r=".8"><stop stop-color="${a}" stop-opacity=".45"/><stop offset="1" stop-color="#05070e" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="#05070e"/><rect width="${W}" height="${H}" fill="url(#r)"/>${shapes[cat.id]||""}<text x="${W-16}" y="${H-14}" text-anchor="end" font-family="Arial" font-size="13" letter-spacing="2" fill="#8b95ae" opacity=".7">PREVIEW ${String(i+1).padStart(2,"0")}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
PORTFOLIO.forEach(c => {
  c.real = c.items.length > 0;
  c.list = c.real ? c.items.map(it => ({...it, cat:c.id})) : Array.from({length:6}, (_,i) => ({ src:placeholder(c,i), title:`${c.title} — preview ${i+1}`, cat:c.id, ph:true }));
});
const catById = Object.fromEntries(PORTFOLIO.map(c => [c.id, c]));

/* ---------------- folders ---------------- */
const foldersEl = $("#folders");
foldersEl.innerHTML = PORTFOLIO.map((c, i) => `
  <button class="folder" data-open-cat="${c.id}" aria-label="Open ${c.title} gallery">
    <div class="folder__body">
      <span class="folder__ic">${svgIcon(c.icon)}</span>
      <span class="folder__no">${String(i+1).padStart(2,"0")}</span>
      <div class="sheets">${c.list.slice(0,3).reverse().map(it => `<div class="sheet"><img src="${it.src}" alt="" loading="lazy"></div>`).join("")}</div>
      <div class="folder__front">
        <h3>${c.title}</h3>
        <div class="folder__count"><span>${c.real ? c.items.length + (c.items.length===1?" project":" projects") : "Coming soon"}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
      </div>
    </div>
  </button>`).join("");
$("#footCats").innerHTML = PORTFOLIO.slice(0,6).map(c => `<li><button data-open-cat="${c.id}">${c.title}</button></li>`).join("");

/* ---------------- marquee ---------------- */
const star = '<svg viewBox="0 0 24 24" fill="url(#mg)"><defs><linearGradient id="mg" x1="0" x2="1"><stop stop-color="#5ee7ff"/><stop offset="1" stop-color="#2a4dff"/></linearGradient></defs><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"/></svg>';
const words = ["Graphic Design","<span class='o'>Video Editing</span>","UGC Ads","<span class='o'>AI Content</span>","Branding","<span class='o'>Social Media</span>","Motion"];
const set = `<div class="marquee__item">${words.map(w => `<span>${w}</span>${star}`).join("")}</div>`;
$("#marq").innerHTML = set + set;

/* ---------------- about portrait copy ---------------- */
/* Independent about portrait is embedded above. */

/* ---------------- CV (embedded PDF) ---------------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-cv]"); if (!b) return;
  e.preventDefault();
  if (b.dataset.cv === "view") { openLink(SITE.cvUrl); }
  else { const a = document.createElement("a"); a.href = window.__asset(SITE.cvUrl); a.download = SITE.cvName; document.body.appendChild(a); a.click(); a.remove(); toast("CV download started"); }
  closeMenu();
});

/* ---------------- copy email ---------------- */
$("#copyEmail")?.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(SITE.email); }
  catch { const t = document.createElement("textarea"); t.value = SITE.email; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
  toast("Email copied to clipboard");
});

/* ---------------- smooth scroll (Lenis) ---------------- */
let lenis = null;
if (!reduce && !compactLayout && typeof window.Lenis !== "undefined") {
  lenis = new Lenis({ lerp:.09, smoothWheel:true });
  if (hasGSAP) {
    lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  } else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
const scrollToEl = (target) => {
  const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: el.id === "home" ? 0 : -70, duration:1.4 });
  else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
};
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute("href"); if (id.length < 2) return;
  e.preventDefault(); closeMenu(); scrollToEl(id);
  history.replaceState(null, "", id);
});
let lockCount = 0;
const lockScroll = (on) => {
  lockCount = Math.max(0, lockCount + (on ? 1 : -1));
  const locked = lockCount > 0;
  document.body.style.overflow = locked ? "hidden" : "";
  if (lenis) locked ? lenis.stop() : lenis.start();
};

/* ---------------- nav ---------------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
addEventListener("scroll", onScroll, {passive:true}); onScroll();
const pill = $(".nav__pill"); const navAs = $$("#navLinks a");
function setActive(id){
  navAs.forEach(a => {
    const on = a.getAttribute("href") === "#" + id;
    a.classList.toggle("active", on);
    if (on) { pill.style.opacity = 1; pill.style.width = a.offsetWidth + "px"; pill.style.transform = `translateX(${a.offsetLeft}px)`; }
  });
}
const secIds = ["home","about","services","portfolio","videos","ai-lab","contact"];
const secMap = {experience:"about", print:"portfolio", software:"ai-lab"};
const io = new IntersectionObserver(ents => {
  ents.forEach(en => { if (en.isIntersecting) setActive(secMap[en.target.id] || en.target.id); });
}, { rootMargin:"-45% 0px -50% 0px" });
[...secIds, ...Object.keys(secMap)].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });

/* mobile menu */
const burger = $("#burger"), mmenu = $("#mmenu");
function closeMenu(){ if (!mmenu.classList.contains("open")) return; mmenu.classList.remove("open"); burger.setAttribute("aria-expanded","false"); mmenu.setAttribute("aria-hidden","true"); lockScroll(false); }
burger.addEventListener("click", () => {
  const open = !mmenu.classList.contains("open");
  if (!open) return closeMenu();
  mmenu.classList.add("open"); burger.setAttribute("aria-expanded","true"); mmenu.setAttribute("aria-hidden","false"); lockScroll(true);
  $$("a", mmenu).forEach((a,i) => a.style.transitionDelay = (0.15 + i*0.05) + "s");
  setTimeout(() => $("a", mmenu).focus(), 300);
});

/* ---------------- cursor ---------------- */
if (finePointer && !reduce) {
  const c = $(".cursor"), r = $(".cursor-ring"); let x=innerWidth/2, y=innerHeight/2, rx=x, ry=y;
  document.body.classList.add("has-cursor");
  addEventListener("pointermove", e => { x=e.clientX; y=e.clientY; c.style.transform=`translate(${x}px,${y}px)`; }, {passive:true});
  (function loop(){ rx += (x-rx)*.18; ry += (y-ry)*.18; r.style.transform=`translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
  document.addEventListener("pointerover", e => r.classList.toggle("hover", !!e.target.closest("a,button,[data-tilt],.folder,.vcard,.node,input,textarea,select")));
  document.addEventListener("mouseleave", () => document.body.classList.remove("has-cursor"));
  document.addEventListener("mouseenter", () => document.body.classList.add("has-cursor"));
}

/* ---------------- WebGL hero background ---------------- */
(function heroGL(){
  const cv = $("#gl"); let gl; try { gl = cv.getContext("webgl", {antialias:false, alpha:true, premultipliedAlpha:false}); } catch (_) { return; }
  if (!gl) { cv.style.display = "none"; return; }
  cv.addEventListener("webglcontextlost", () => { cv.style.display = "none"; });
  const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const fs = `precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
  void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*2.2;float tt=t*.045;
   vec2 q=vec2(fbm(p+tt),fbm(p+vec2(5.2,1.3)-tt));
   vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+tt*1.5),fbm(p+3.*q+vec2(8.3,2.8)-tt));
   float f=fbm(p+3.5*w+m*.4);
   vec3 c=vec3(.012,.016,.03);
   c=mix(c,vec3(.03,.07,.22),smoothstep(.25,.75,f));
   c=mix(c,vec3(.14,.3,1.),smoothstep(.62,.95,f)*.55);
   c+=vec3(.25,.8,1.)*pow(smoothstep(.72,1.,f),3.)*.35;
   float v=(1.-smoothstep(.2,1.25,length((uv-vec2(.68,.5))*vec2(1.3,1.))));
   c*=.35+v*.85;
   gl_FragColor=vec4(c,1.);}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr,"r"), uT = gl.getUniformLocation(pr,"t"), uM = gl.getUniformLocation(pr,"m");
  let mx=0,my=0,tmx=0,tmy=0, visible=true, start=performance.now();
  const scale = Math.min(devicePixelRatio, 1.5) * (innerWidth < 700 ? .45 : .5);
  const size = () => { cv.width = Math.round(cv.clientWidth*scale); cv.height = Math.round(cv.clientHeight*scale); gl.viewport(0,0,cv.width,cv.height); };
  size(); addEventListener("resize", size);
  addEventListener("pointermove", e => { tmx = e.clientX/innerWidth-.5; tmy = e.clientY/innerHeight-.5; }, {passive:true});
  let drawFrame = 0;
  function syncDraw(){
    if (visible && !document.hidden && !gl.isContextLost()) {
      if (!drawFrame) drawFrame = requestAnimationFrame(draw);
    } else if (drawFrame) { cancelAnimationFrame(drawFrame); drawFrame = 0; }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; syncDraw(); }).observe(cv);
  document.addEventListener("visibilitychange", syncDraw);
  const draw = (now) => {
    drawFrame = 0;
    if (visible && !document.hidden && !gl.isContextLost()) { mx += (tmx-mx)*.03; my += (tmy-my)*.03;
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, reduce ? 20 : (now-start)/1000); gl.uniform2f(uM, mx, -my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); cv.classList.add("gl-ready"); }
    if (!reduce && visible && !document.hidden && !gl.isContextLost()) drawFrame = requestAnimationFrame(draw);
  };
  syncDraw();
})();

/* ---------------- hero mouse parallax ---------------- */
if (finePointer && !reduce) {
  const vis = $("#heroVisual"); const layers = $$("[data-depth]", vis);
  let tx=0, ty=0, cx=0, cy=0;
  addEventListener("pointermove", e => { tx = (e.clientX/innerWidth - .5); ty = (e.clientY/innerHeight - .5); }, {passive:true});
  (function loop(){
    cx += (tx-cx)*.06; cy += (ty-cy)*.06;
    if (window.scrollY < innerHeight) layers.forEach(l => {
      const d = parseFloat(l.dataset.depth); const base = l.classList.contains("portrait") || l.classList.contains("aura") ? "translateX(-50%) " : "";
      const extra = l.classList.contains("aura") ? " translateY(-50%)" : "";
      l.style.transform = `${base}${extra} translate3d(${cx*d*-80}px,${cy*d*-60}px,0)`;
    });
    requestAnimationFrame(loop);
  })();
}

/* ---------------- tilt + spotlight ---------------- */
if (finePointer && !reduce) {
  $$("[data-tilt]").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect(); const px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
      el.style.setProperty("--mx", px*100 + "%"); el.style.setProperty("--my", py*100 + "%");
      el.style.transform = `rotateX(${(.5-py)*8}deg) rotateY(${(px-.5)*10}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transition = "transform .7s var(--ease),border-color .4s,box-shadow .5s"; el.style.transform = ""; setTimeout(() => el.style.transition = "", 700); });
  });
}

/* ---------------- print studio: cards ---------------- */
(function printStudio(){
  const cards = catById.cards, bro = catById.brochures;
  const front = cards.real ? `<div class="bcard__face" style="background-image:url('${cards.items[0].src}')"></div>` : null;
  const defFront = `<div class="bc-front" style="position:absolute;inset:0"><div class="m">MA</div><div><div class="n">Muhammad Awais</div><div class="r">Graphic Designer · Video Editor</div></div></div>`;
  const defBack = `<div class="bc-back" style="position:absolute;inset:0"><b>Let's create.</b><span>Contact details pending</span><span></span><span>Faisalabad, Pakistan</span></div>`;
  ["#bcA","#bcB"].forEach((id, k) => {
    const el = $(id); const f = $(".bcard__front", el), bk = $(".bcard__back", el);
    const face = (ASSETS.cardFaces || [])[k];
    if (face) { f.style.backgroundImage = `url('${face.front}')`; bk.style.backgroundImage = `url('${face.back}')`; }
    else { f.innerHTML = defFront; bk.innerHTML = defBack; }
  });
  const bB = $("#bcB"); bB.addEventListener("click", () => bB.classList.toggle("flipped"));
  bB.setAttribute("role","button"); bB.setAttribute("tabindex","0"); bB.setAttribute("aria-label","Flip business card");
  bB.addEventListener("keydown", e => { if (e.key==="Enter"||e.key===" ") { e.preventDefault(); bB.classList.toggle("flipped"); } });
  const stage = $("#cards3d"), wrapS = $("#cardStage");
  if (finePointer && !reduce) {
    wrapS.addEventListener("pointermove", e => { const r = wrapS.getBoundingClientRect(); const x = (e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      stage.style.transform = `rotateY(${x*24}deg) rotateX(${-y*18}deg)`; });
    wrapS.addEventListener("pointerleave", () => { stage.style.transition="transform 1s var(--ease)"; stage.style.transform=""; setTimeout(()=>stage.style.transition="",1000); });
  }
  // brochure panels
  const panels = [$("#triL"), $("#triC"), $("#triR")];
  if (bro.real) { const pg = bro.items[0].pages || [bro.items[0]]; [pg[1]||pg[0], pg[0], pg[2]||pg[0]].forEach((x, k) => { panels[k].style.backgroundImage = `url('${x.src}')`; panels[k].style.backgroundSize = 'cover'; panels[k].style.backgroundPosition = 'center'; }); }
  else {
    panels.forEach(p => p.classList.add("br-default"));
    $("#triL").innerHTML = `<div class="tri__content"><span>About</span><div class="tri__lines"><i></i><i></i><i></i></div></div>`;
    $("#triC").innerHTML = `<div class="tri__content"><span>Services</span><div class="tri__lines"><i></i><i></i><i></i><i></i></div></div>`;
    $("#triR").innerHTML = `<div class="tri__content"><span>Portfolio</span><b>Creative<br>Profile</b></div>`;
  }
  window.__setFold = (p) => { // p: 0 folded → 1 open
    const ang = (1-p) * 172;
    $("#triL").style.transform = `rotateY(${-ang}deg) translateZ(${(1-p)*1}px)`;
    $("#triR").style.transform = `rotateY(${ang * .985}deg) translateZ(${(1-p)*2}px)`;
    $("#tri").style.transform = `rotateX(${14 - p*4}deg) rotateY(${-14 + p*22}deg) scale(${.92 + p*.18})`;
  };
  window.__setFold(reduce ? 1 : 0.15);
})();

/* ---------------- gallery + lightbox ---------------- */
const gallery = $("#gallery"), galGrid = $("#galGrid"), galChips = $("#galChips");
let galCat = "all", galList = [], lastFocus = null;
galChips.innerHTML = [`<button class="chipf" data-f="all">All</button>`, ...PORTFOLIO.map(c => `<button class="chipf" data-f="${c.id}">${c.title}</button>`)].join("");
function renderGallery(cat){
  galCat = cat;
  galList = cat === "all" ? PORTFOLIO.flatMap(c => c.list) : catById[cat].list;
  $("#galName").textContent = cat === "all" ? "All work" : catById[cat].title;
  $("#galKicker").textContent = cat === "all" ? "Portfolio · all categories" : `Portfolio · ${catById[cat].real ? catById[cat].items.length + " projects" : "projects coming soon"}`;
  const anyPh = galList.some(i => i.ph);
  $("#galNote").textContent = anyPh ? "Preview layout — real project images will appear here." : "";
  $$(".chipf", galChips).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === cat)));
  const ncol = innerWidth < 640 ? 2 : innerWidth < 1000 ? 3 : 4;
  const cols = Array.from({length:ncol}, () => ({ h:0, html:[] }));
  galList.forEach((it, i) => {
    const c = catById[it.cat];
    const w = it.w || c.ratio[0], hh = it.h || c.ratio[1];
    const col = cols.reduce((m, x) => x.h < m.h - 0.02 ? x : m, cols[0]);
    col.h += hh / w;
    const t = it.title.replace(/"/g,"&quot;");
    col.html.push(`<button class="gitem" data-i="${i}" aria-label="Open ${t}"><img src="${it.src}" alt="${t}" loading="lazy" width="${w}" height="${hh}" style="aspect-ratio:${w}/${hh}">${it.pages ? `<span class="gitem__pages">${it.pages.length} pages</span>` : ""}<span class="gitem__cap">${it.title}<span>${c.title}</span></span></button>`);
  });
  galGrid.innerHTML = cols.map(c => `<div class="mcol">${c.html.join("")}</div>`).join("");
  const items = $$(".gitem", galGrid).sort((x, y) => x.dataset.i - y.dataset.i);
  items.forEach((el, i) => setTimeout(() => el.classList.add("in"), reduce ? 0 : 40 + Math.min(i, 20) * 45));
  gallery.scrollTop = 0;
}
galChips.addEventListener("click", e => { const b = e.target.closest(".chipf"); if (b) renderGallery(b.dataset.f); });
function openGallery(cat){
  lastFocus = document.activeElement; renderGallery(cat);
  gallery.classList.add("open"); lockScroll(true); setTimeout(() => $("#galClose").focus(), 100);
}
function closeGallery(){ gallery.classList.remove("open"); lockScroll(false); lastFocus && lastFocus.focus && lastFocus.focus(); }
document.addEventListener("click", e => { const b = e.target.closest("[data-open-cat]"); if (b) { e.preventDefault(); openGallery(b.dataset.openCat); } });
$("#galClose").addEventListener("click", closeGallery);
galGrid.addEventListener("click", e => { const b = e.target.closest(".gitem"); if (b) openLB(+b.dataset.i); });

const lb = $("#lightbox"), lbImg = $("#lbImg"); let lbI = 0, lbList = [];
function showLB(i){
  lbI = (i + lbList.length) % lbList.length; const it = lbList[lbI];
  lbImg.classList.add("swap");
  setTimeout(() => { lbImg.src = it.src; lbImg.alt = it.title; lbImg.onload = () => lbImg.classList.remove("swap"); if (lbImg.complete) lbImg.classList.remove("swap"); }, reduce ? 0 : 180);
  $("#lbCap").textContent = it.cap;
  $("#lbCount").textContent = `${String(lbI+1).padStart(2,"0")} / ${String(lbList.length).padStart(2,"0")}`;
  const nx = lbList[(lbI + 1) % lbList.length]; if (nx) { const p = new Image(); p.src = nx.src; }
}
let lbFrom = 0;
function openLB(i){
  const it = galList[i]; lbFrom = i;
  if (it.pages) lbList = it.pages.map((p, k) => ({ src:p.src, title:`${it.title} — page ${k+1}`, cap:`${it.title} · Page ${k+1} of ${it.pages.length}` }));
  else lbList = galList.map(x => ({ src:x.src, title:x.title, cap:`${x.title} — ${catById[x.cat].title}` }));
  showLB(it.pages ? 0 : i); lb.classList.add("open"); setTimeout(() => $("#lbClose").focus(), 80);
}
function closeLB(){ lb.classList.remove("open"); const b = $(`.gitem[data-i="${lbFrom}"]`); b && b.focus(); }
$("#lbPrev").addEventListener("click", () => showLB(lbI-1));
$("#lbNext").addEventListener("click", () => showLB(lbI+1));
$("#lbClose").addEventListener("click", closeLB);
lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lb__stage")) closeLB(); });
let sx = null; lb.addEventListener("touchstart", e => sx = e.touches[0].clientX, {passive:true});
lb.addEventListener("touchend", e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showLB(lbI + (dx < 0 ? 1 : -1)); sx = null; });

/* ---------------- videos ---------------- */
const vgrid = $("#vgrid");
const ytId = (u) => (u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
const vimeoId = (u) => (u.match(/vimeo\.com\/(?:video\/)?(\d+)/) || [])[1];
const driveId = (u) => (u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || [])[1];
const isFile = (u) => /\.(mp4|webm|mov)(\?|$)/i.test(u);
function videoPh(title, k, vertical){
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="v${k}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${k%2?"#0f2a8a":"#1b2fae"}"/><stop offset="1" stop-color="#03050b"/></linearGradient></defs><rect width="320" height="200" fill="url(#v${k})"/>${Array.from({length:7},(_,i)=>`<rect x="${10+i*44}" y="168" width="38" height="14" rx="3" fill="#5ee7ff" opacity="${.08+((i*7+k)%5)*.05}"/>`).join("")}<circle cx="${60+k*37%200}" cy="${50+k*23%60}" r="${40+k*11%30}" fill="#3d8bff" opacity=".18"/>${vertical?'<rect x="250" y="30" width="44" height="78" rx="8" fill="none" stroke="#9ab8ff" stroke-opacity=".5"/>':""}</svg>`;
  return `<div class="vcard__ph">${svg}</div>`;
}
let videoObserver;
function renderVideos(folder){
  videoObserver?.disconnect();
  const list = VIDEOS[folder];
  vgrid.innerHTML = list.map((v, i) => `
    <button class="vcard${v.wide ? " vcard--wide" : " vcard--tall"}" data-folder="${folder}" data-i="${i}" aria-label="Play ${v.title}">
      <div class="vcard__media">
        ${v.poster ? `<img src="${v.poster}" alt="" loading="lazy">` : videoPh(v.title, i + (folder==="edit"?6:0), v.vertical)}
        ${v.src && isFile(v.src) ? `<video src="${v.src}" muted loop playsinline preload="none"></video>` : ""}
        <span class="vcard__badge">${folder === "ai" ? "AI · UGC" : "Custom Edit"}</span>
        <span class="vcard__fmt">${v.vertical ? "9:16" : v.wide ? "16:9" : "1:1"}</span>
        <span class="vplay"><svg viewBox="0 0 24 24" fill="#fff"><path d="M7 4l13 8-13 8z"/></svg></span>
      </div>
      <div class="vcard__body"><h4>${v.title}</h4><p>${v.desc}${v.src ? "" : " · coming soon"}</p></div>
    </button>`).join("");
  if (hasGSAP && !reduce && !compactLayout && typeof IntersectionObserver !== "undefined") {
    const cards = $$(".vcard", vgrid);
    const videoEntry = videoObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || !entry.target.isConnected) return;
      gsap.from(entry.target, { y:16, opacity:.88, duration:.7, ease:"expo.out" });
      videoEntry.unobserve(entry.target);
    }));
    cards.forEach(card => videoEntry.observe(card));
  }
  $$(".vcard", vgrid).forEach(c => {
    const vid = $("video", c); if (!vid || !finePointer) return;
    c.addEventListener("mouseenter", () => { c.classList.add("previewing"); vid.play().catch(()=>{}); });
    c.addEventListener("mouseleave", () => { c.classList.remove("previewing"); vid.pause(); });
  });
}
const pad2 = n => String(n).padStart(2,"0");

const vtabs = $$(".vtab");
vtabs.forEach(t => t.addEventListener("click", () => {
  vtabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
  vgrid.setAttribute("aria-labelledby", t.id); renderVideos(t.dataset.folder);
}));
$(".vtabs").addEventListener("keydown", e => {
  if (!["ArrowLeft","ArrowRight"].includes(e.key)) return;
  const i = vtabs.indexOf(document.activeElement); const n = vtabs[(i + 1) % 2]; n.focus(); n.click();
});
renderVideos("ai");

const vm = $("#vmodal"), vmFrame = $("#vmFrame");
function openVideo(v){
  lastFocus = document.activeElement;
  $("#vmTitle").textContent = v.title; $("#vmDesc").textContent = v.desc;
  vmFrame.classList.toggle("vertical", !!v.vertical);
  vmFrame.classList.toggle("square", !v.vertical && !v.wide && !!v.src);
  let html = "";
  if (!v.src) html = `<div class="vsoon"><div><b>Coming soon</b><span>This video is being added to the portfolio.</span></div></div>`;
  else if (ytId(v.src)) html = `<iframe src="https://www.youtube.com/embed/${ytId(v.src)}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="${v.title}"></iframe>`;
  else if (vimeoId(v.src)) html = `<iframe src="https://player.vimeo.com/video/${vimeoId(v.src)}?autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${v.title}"></iframe>`;
  else if (driveId(v.src)) html = `<iframe src="https://drive.google.com/file/d/${driveId(v.src)}/preview" allow="autoplay; fullscreen" allowfullscreen title="${v.title}"></iframe>`;
  else html = `<video src="${v.src}" controls autoplay playsinline ${v.poster ? `poster="${v.poster}"` : ""}></video>`;
  vmFrame.innerHTML = html; vm.classList.add("open"); lockScroll(true); setTimeout(() => $("#vmClose").focus(), 80);
}
function closeVideo(){ vm.classList.remove("open"); lockScroll(false); setTimeout(() => vmFrame.innerHTML = "", 400); lastFocus && lastFocus.focus(); }
vgrid.addEventListener("click", e => { const c = e.target.closest(".vcard"); if (c) openVideo(VIDEOS[c.dataset.folder][+c.dataset.i]); });
$("#vmClose").addEventListener("click", closeVideo);
vm.addEventListener("click", e => { if (e.target === vm) closeVideo(); });
$("#vmFull").addEventListener("click", () => { const el = vmFrame; (el.requestFullscreen || el.webkitRequestFullscreen || (()=>{})).call(el); });

/* global keys */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (lb.classList.contains("open")) return closeLB();
    if (vm.classList.contains("open")) return closeVideo();
    if (gallery.classList.contains("open")) return closeGallery();
    closeMenu();
  }
  if (lb.classList.contains("open")) { if (e.key === "ArrowRight") showLB(lbI+1); if (e.key === "ArrowLeft") showLB(lbI-1); }
  // simple focus trap for open dialogs
  if (e.key === "Tab") {
    const dlg = [lb, vm, gallery].find(d => d.classList.contains("open")) || (mmenu.classList.contains("open") ? mmenu : null);
    if (!dlg) return;
    const f = $$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', dlg).filter(x => x.offsetParent !== null);
    if (dlg === mmenu) f.push(burger);
    if (!f.length) return; const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------------- AI orbit ---------------- */
(function orbit(){
  const ringsR = {1:"25%", 2:"37%", 3:"49%"}; // percentage of orbit size == radius of each ring
  const orbitEl = $("#orbit"), legend = $("#labLegend");
  const byRing = {1:[],2:[],3:[]}; AI_TOOLS.forEach(t => byRing[t.ring].push(t));
  const nodes = [];
  Object.entries(byRing).forEach(([ring, tools]) => {
    const spin = $(`.orbit__spin[data-ring="${ring}"]`); const dur = getComputedStyle(spin).getPropertyValue("--dur");
    tools.forEach((t, i) => {
      const a = (360 / tools.length) * i + ring * 25;
      const b = document.createElement("button");
      b.className = "node"; b.style.setProperty("--a", a + "deg"); b.setAttribute("aria-label", `${t.n} — ${t.cat}`);
      // radius relative to the spin element (which equals the ring box): half of ring width
      b.style.setProperty("--r", "calc(var(--ring-half))");
      b.innerHTML = `<span class="node__in" style="--dur:${dur}"><span>${t.g}</span></span>`;
      spin.appendChild(b); nodes.push([b, t]);
    });
  });
  const setRadii = () => $$(".orbit__spin").forEach(s => s.style.setProperty("--ring-half", (s.offsetWidth/2) + "px"));
  setRadii(); addEventListener("resize", setRadii);
  const cats = [...new Set(AI_TOOLS.map(t => t.cat))];
  legend.innerHTML = cats.map(c => `<div class="legend" data-cat="${c}"><span>${c}</span><span>${AI_TOOLS.filter(t=>t.cat===c).map(t=>t.n).join(", ")}</span></div>`).join("");
  const info = (t) => { $("#labCat").textContent = t.cat; $("#labName").classList.remove("workflow-name"); $("#labName").removeAttribute("aria-label"); $("#labName").textContent = t.n; $("#labDesc").textContent = t.d;
    nodes.forEach(([b, x]) => b.classList.toggle("on", x === t)); $$(".legend", legend).forEach(l => l.classList.toggle("on", l.dataset.cat === t.cat));
    if (hasGSAP && !reduce) gsap.fromTo("#labName", {y:14, opacity:0}, {y:0, opacity:1, duration:.5, ease:"expo.out"}); };
  nodes.forEach(([b, t]) => {
    b.addEventListener("mouseenter", () => { orbitEl.classList.add("paused"); info(t); });
    b.addEventListener("mouseleave", () => orbitEl.classList.remove("paused"));
    b.addEventListener("focus", () => { orbitEl.classList.add("paused"); info(t); });
    b.addEventListener("blur", () => orbitEl.classList.remove("paused"));
    b.addEventListener("click", () => info(t));
  });
  $$(".legend", legend).forEach(l => l.addEventListener("mouseenter", () => { const t = AI_TOOLS.find(x => x.cat === l.dataset.cat); info(t); }));
  // connection lines (static decorative spokes)
  const svg = $("#orbitLines");
  svg.innerHTML = `<defs><radialGradient id="ol"><stop stop-color="#5ee7ff" stop-opacity=".5"/><stop offset="1" stop-color="#2a4dff" stop-opacity="0"/></radialGradient></defs>` +
    Array.from({length:12}, (_,i) => { const a = i/12*Math.PI*2; return `<line x1="50" y1="50" x2="${50+Math.cos(a)*49}" y2="${50+Math.sin(a)*49}" stroke="url(#ol)" stroke-width=".15"/>`; }).join("");
})();

/* ---------------- contact form ---------------- */
const form = $("#contactForm"), fStatus = $("#fStatus");
const val = () => ({ name: $("#fName").value.trim(), email: $("#fEmail").value.trim(), type: $("#fType").value, msg: $("#fMsg").value.trim() });
function validate(){
  const v = val(); let bad = null;
  if (!v.name) bad = "#fName"; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) bad = "#fEmail"; else if (v.msg.length < 5) bad = "#fMsg";
  if (bad) { fStatus.className = "form__status err"; fStatus.textContent = bad === "#fEmail" ? "Please enter a valid email address." : "Please fill in your name and message."; $(bad).focus(); return null; }
  return v;
}
form.addEventListener("submit", e => { e.preventDefault(); const v=validate(); if(!v)return; const msg=`Name: ${v.name}\nEmail: ${v.email}\nProject: ${v.type}\n\n${v.msg}`; location.href="mailto:"+SITE.email+"?subject="+encodeURIComponent("Portfolio enquiry: "+v.type)+"&body="+encodeURIComponent(msg); fStatus.textContent="Your email app should open with your enquiry ready to send."; });
/* ---------------- back to top ---------------- */
$("#toTop").addEventListener("click", () => scrollToEl("#home"));

/* =====================================================================
   GSAP MOTION SYSTEM — each section gets its own animation identity
   ===================================================================== */
// split statement into words for scrub reveal
(function splitStatement(){
  const st = $("#statement"); const out = [];
  st.childNodes.forEach(n => {
    if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => out.push(/^\s+$/.test(w) || !w ? w : `<span class="w">${w}</span>`));
    else out.push(`<span class="w">${n.outerHTML}</span>`);
  });
  st.innerHTML = out.join("");
})();

if (!hasGSAP || reduce || compactLayout) { $$(".statement .w").forEach(w => w.style.opacity = 1); $$(".stat__num [data-count]").forEach(n => n.textContent = n.dataset.count); window.__setFold?.(1); return; }

gsap.registerPlugin(ScrollTrigger);

/* Hero entrance: no blocking loader, and only start when the hero is visible. */
const intro = gsap.timeline({ paused:true, defaults:{ ease:"expo.out", immediateRender:false } });
intro
  .from(".h-word", { yPercent:115, rotate:4, duration:1.4, stagger:.12 }, 0)
  .from("#portraitImg", { clipPath:"inset(100% 0 0 0)", y:60, duration:1.6, ease:"expo.inOut" }, 0)
  .from(".portrait__halo", { opacity:0, duration:1.4 }, 0)
  .from(".h-in", { y:30, opacity:0, duration:1.1, stagger:.08 }, .2)
  .from(".float, .pen-node", { y:40, opacity:0, scale:.8, duration:1.2, stagger:.09 }, .25)
  .from(".hero__scroll, .hero__meta", { opacity:0, duration:1 }, .4);
if (typeof IntersectionObserver !== "undefined") {
  const heroEntry = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { intro.play(); heroEntry.disconnect(); }
  });
  heroEntry.observe($("#home"));
} else { intro.play(); }

/* continuous float of hero objects */
const floatTweens = $$(".float, .pen-node").map((el, i) => {
  const inner = el.firstElementChild || el;
  return gsap.to(el.classList.contains("pen-node") ? el : inner, { y: i%2 ? 14 : -14, x: i%3 ? 6 : -6, duration: 3 + i*.6, repeat:-1, yoyo:true, ease:"sine.inOut", paused:true });
});
if (typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver(([entry]) => floatTweens.forEach(t => t.paused(!entry.isIntersecting))).observe($("#heroVisual"));
} else floatTweens.forEach(t => t.play());
/* hero scroll-out parallax */
gsap.to(".hero__copy", { yPercent:-18, opacity:.2, ease:"none", scrollTrigger:{ trigger:".hero", start:"top top", end:"bottom top", scrub:true } });
gsap.to("#heroVisual", { yPercent:12, ease:"none", scrollTrigger:{ trigger:".hero", start:"top top", end:"bottom top", scrub:true } });

/* section titles: masked line slide */
$$(".sec-title").forEach(t => {
  gsap.from($$(".split-line > span", t), { yPercent:110, duration:1.2, stagger:.1, ease:"expo.out", scrollTrigger:{ trigger:t, start:"top 85%" } });
});
$$(".sec-tag, .sec-sub").forEach(el => gsap.from(el, { opacity:0, y:20, duration:1, ease:"power3.out", scrollTrigger:{ trigger:el, start:"top 90%" } }));

/* generic data-reveal (fade-up) */

/* ABOUT: word-by-word light-up scrub + arch tilt */
gsap.to(".statement .w", { opacity:1, stagger:.05, ease:"none", scrollTrigger:{ trigger:"#statement", start:"top 80%", end:"bottom 45%", scrub:.6 } });
gsap.fromTo("#arch img", { yPercent:8, scale:1.1 }, { yPercent:-4, scale:1, ease:"none", scrollTrigger:{ trigger:"#about", start:"top bottom", end:"bottom top", scrub:true } });

/* EXPERIENCE: count-up + line draw + alternating slide */
$$(".stat__num [data-count]").forEach(n => {
  const o = { v:0 }; gsap.to(o, { v:+n.dataset.count, duration:2, ease:"power3.out", scrollTrigger:{ trigger:n, start:"top 88%" }, onUpdate:() => n.textContent = Math.round(o.v) });
});
gsap.from(".stat", { y:30, opacity:0, duration:1, stagger:.1, ease:"expo.out", scrollTrigger:{ trigger:".stats", start:"top 88%" } });
gsap.to(".tl-line i", { scaleY:1, ease:"none", scrollTrigger:{ trigger:"#timeline", start:"top 70%", end:"bottom 60%", scrub:.5 } });
$$(".tl-item").forEach((it, i) => {
  const mobile = innerWidth < 980; const dir = mobile ? 1 : (i % 2 ? 1 : -1);
  gsap.from($(".tl-card", it), { x: 80*dir, opacity:0, rotateY: 12*dir, duration:1.2, ease:"expo.out", scrollTrigger:{ trigger:it, start:"top 82%" } });
  gsap.from($(".tl-when", it), { opacity:0, y:20, duration:1, ease:"power3.out", scrollTrigger:{ trigger:it, start:"top 82%" } });
  gsap.from($(".tl-dot", it), { scale:0, duration:.8, ease:"back.out(3)", scrollTrigger:{ trigger:it, start:"top 75%" } });
});

/* SERVICES: rise from depth, staggered by grid */
gsap.from(".svc", { opacity:0, duration:.65, ease:"power2.out", stagger:.045, scrollTrigger:{ trigger:"#bento", start:"top 88%" } });

/* PORTFOLIO: folders flip up like files out of a drawer */
gsap.from(".folder", { rotateX:-70, y:60, opacity:0, transformOrigin:"50% 100%", duration:1.2, ease:"expo.out", stagger:{ each:.06, grid:"auto", from:"start" }, scrollTrigger:{ trigger:"#folders", start:"top 85%" } });

/* PRINT: cards drop in, brochure unfolds with scroll */
gsap.from(".bcard", { y:-120, opacity:0, rotateZ:20, duration:1.4, ease:"expo.out", stagger:.15, scrollTrigger:{ trigger:"#cardStage", start:"top 80%" } });
const fold = { p:.15 };
gsap.to(fold, { p:1, ease:"none", onUpdate:() => window.__setFold(fold.p), scrollTrigger:{ trigger:"#broStage", start:"top 85%", end:"center 45%", scrub:.8 } });
gsap.from(".stage", { y:50, opacity:0, duration:1.2, stagger:.12, ease:"expo.out", scrollTrigger:{ trigger:".print__grid", start:"top 88%" } });

/* VIDEOS: tabs slide in from sides */
gsap.from("#tab-ai", { x:-Math.min(40,innerWidth*.025), opacity:.88, immediateRender:false, duration:1.1, ease:"expo.out", scrollTrigger:{ trigger:".vtabs", start:"top 88%" } });
gsap.from("#tab-edit", { x:Math.min(40,innerWidth*.025), opacity:.88, immediateRender:false, duration:1.1, ease:"expo.out", scrollTrigger:{ trigger:".vtabs", start:"top 88%" } });

/* AI LAB: rings expand from core */
gsap.from(".orbit__ring", { scale:.2, opacity:0, duration:1.6, stagger:.12, ease:"expo.out", scrollTrigger:{ trigger:"#orbit", start:"top 80%" } });
gsap.from(".orbit__core", { scale:0, duration:1.2, ease:"back.out(1.6)", scrollTrigger:{ trigger:"#orbit", start:"top 80%" } });
gsap.from(".lab__info, .legend", { x:40, opacity:0, duration:1, stagger:.06, ease:"expo.out", scrollTrigger:{ trigger:".lab__grid", start:"top 80%" } });

/* SOFTWARE: icons pop */
gsap.from(".app", { scale:.6, opacity:0, y:30, duration:1, stagger:.06, ease:"back.out(1.7)", scrollTrigger:{ trigger:".soft__grid", start:"top 85%" } });

/* CONTACT: giant headline slides, cways stagger */
gsap.from(".contact__title .line > span", { yPercent:110, skewY:4, duration:1.4, stagger:.12, ease:"expo.out", scrollTrigger:{ trigger:".contact__title", start:"top 85%" } });
gsap.from(".footer__big", { yPercent:40, opacity:0, duration:1.6, ease:"expo.out", scrollTrigger:{ trigger:".footer__big", start:"top 98%" } });
gsap.to(".marquee__track", { x:"-=200", ease:"none", scrollTrigger:{ trigger:".marquee", start:"top bottom", end:"bottom top", scrub:1 } });

addEventListener("load", () => ScrollTrigger.refresh());
})();
