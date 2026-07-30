(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     360° FRAME SEQUENCE — scroll-scrubbed hero
     ============================================================ */
  const FRAME_COUNT = 51;
  const frames = [];
  let framesLoaded = 0;

  const canvas = document.getElementById("rotCanvas");
  const ctx = canvas.getContext("2d");
  const frameCounterEl = document.getElementById("frameCounter");

  function pad(n){ return String(n).padStart(3, "0"); }

  function preloadFrames(){
    for (let i = 0; i < FRAME_COUNT; i++){
      const img = new Image();
      img.src = `assets/frames/frame_${pad(i)}.jpg`;
      img.onload = () => {
        framesLoaded++;
        if (i === 0) drawFrame(0);
      };
      frames.push(img);
    }
  }

  function resizeCanvas(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const h = window.innerHeight;
    const first = frames[0];
    const ratio = first && first.width ? first.width / first.height : 0.75;
    const w = h * ratio;
    canvas.style.height = h + "px";
    canvas.style.width = w + "px";
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let currentFrameIdx = -1;
  function drawFrame(idx){
    idx = Math.max(0, Math.min(FRAME_COUNT - 1, idx));
    if (idx === currentFrameIdx) return;
    const img = frames[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    currentFrameIdx = idx;
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    if (frameCounterEl){
      frameCounterEl.textContent = `FRAME ${pad(idx)} / ${FRAME_COUNT - 1} — 360° CAPTURE`;
    }
  }

  const heroSection = document.getElementById("hero");

  function updateHeroFrame(){
    const rect = heroSection.getBoundingClientRect();
    const total = heroSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const scrolled = -rect.top;
    let progress = scrolled / total;
    progress = Math.max(0, Math.min(1, progress));
    const idx = Math.round(progress * (FRAME_COUNT - 1));
    drawFrame(idx);
  }

  /* ============================================================
     Scroll progress rail
     ============================================================ */
  const progressFill = document.getElementById("progressFill");
  function updateProgressRail(){
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressFill.style.width = pct + "%";
  }

  /* ============================================================
     rAF loop — combine scroll-driven updates
     ============================================================ */
  let ticking = false;
  function onScroll(){
    if (!ticking){
      requestAnimationFrame(() => {
        updateHeroFrame();
        updateProgressRail();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    currentFrameIdx = -1;
    updateHeroFrame();
  });

  preloadFrames();
  // initial sizing once first frame is ready (fallback if slow network)
  const sizeInterval = setInterval(() => {
    if (frames[0] && frames[0].complete && frames[0].naturalWidth){
      resizeCanvas();
      updateHeroFrame();
      clearInterval(sizeInterval);
    }
  }, 40);
  // hard fallback
  setTimeout(() => { resizeCanvas(); updateHeroFrame(); }, 1200);

  /* ============================================================
     Side nav — active state via IntersectionObserver
     ============================================================ */
  const navNodes = document.querySelectorAll(".side-nav .node");
  const sections = ["hero", "build", "circuit", "pitch", "string"].map(id => document.getElementById(id));

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const id = entry.target.id;
        navNodes.forEach(n => n.classList.toggle("active", n.dataset.target === id));
      }
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  sections.forEach(sec => sec && navObserver.observe(sec));

  /* ============================================================
     Mobile nav toggle
     ============================================================ */
  const toggleBtn = document.getElementById("mobileNavToggle");
  const mobileNav = document.getElementById("mobileNav");
  toggleBtn.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
  mobileNav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => mobileNav.classList.remove("open"));
  });

  /* ============================================================
     Cursor glow (desktop only)
     ============================================================ */
  const glow = document.querySelector(".cursor-glow");
  if (glow && matchMedia("(hover:hover)").matches){
    window.addEventListener("mousemove", (e) => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    }, { passive: true });
  }

  /* ============================================================
     Reveal on scroll
     ============================================================ */
  const revealTargets = document.querySelectorAll(
    ".chapter-head, .chapter-copy, .chapter-stats, .gallery-item, .letterbox, .footer-inner"
  );
  revealTargets.forEach(el => el.classList.add("reveal"));

  if (!reduceMotion && "IntersectionObserver" in window){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add("in-view"));
  }

  /* ============================================================
     Letterbox rotation from data attribute
     ============================================================ */
  document.querySelectorAll(".letterbox[data-rotate]").forEach(el => {
    el.style.setProperty("--r", el.dataset.rotate + "deg");
  });

})();
