/* Normandie Débouche — interactions */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STATIC_BREAKPOINT = 520;

function wireFooterYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = String(new Date().getFullYear());
}

function wireSmoothAnchors() {
  if (prefersReduced) return;

  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a[href^='#']");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", href);
  });
}

function wireReveals() {
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length) return;

  if (prefersReduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  let i = 0;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.style.transitionDelay = `${Math.min(6, i) * 60}ms`;
        i += 1;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((el) => io.observe(el));
}

function wireForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const name = form.querySelector("[name='name']")?.value?.trim() || "";
    const phone = form.querySelector("[name='phone']")?.value?.trim() || "";
    const message = form.querySelector("[name='message']")?.value?.trim() || "";

    const subject = encodeURIComponent("Demande — Normandie Débouche");
    const body = encodeURIComponent(
      `Nom : ${name}\nTéléphone : ${phone}\n\nMessage :\n${message}`
    );

    window.location.href = `mailto:normandiedebouche@gmail.com?subject=${subject}&body=${body}`;
  });
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Morph values for one card across its scroll segment (0 = hidden before, 1 = hidden after). */
function cardMorph(segmentT) {
  const t = clamp(segmentT, 0, 1);

  if (t < 0.14) {
    const p = t / 0.14;
    return {
      opacity: p,
      y: lerp(72, 0, p),
      z: lerp(-120, 0, p),
      scale: lerp(0.88, 1, p),
      rx: lerp(12, 0, p),
      blur: lerp(6, 0, p),
      interactive: p > 0.5,
    };
  }

  if (t > 0.86) {
    const p = (t - 0.86) / 0.14;
    return {
      opacity: 1 - p,
      y: lerp(0, -64, p),
      z: lerp(0, -80, p),
      scale: lerp(1, 0.94, p),
      rx: lerp(0, -8, p),
      blur: lerp(0, 5, p),
      interactive: p < 0.4,
    };
  }

  const hold = (t - 0.14) / 0.72;
  return {
    opacity: 1,
    y: Math.sin(hold * Math.PI) * -4,
    z: 0,
    scale: 1,
    rx: 0,
    blur: 0,
    interactive: true,
    iconY: Math.sin(hold * Math.PI * 2) * -6,
    pxX: Math.sin(hold * Math.PI) * 6,
    pxY: Math.cos(hold * Math.PI) * 8,
    pxScale: 1.05 + Math.sin(hold * Math.PI) * 0.07,
  };
}

function wireServicesParallax() {
  const scene = document.querySelector(".services-scene");
  const sticky = scene?.querySelector(".services-scene__sticky");
  const dots = [...document.querySelectorAll(".services-progress__dot")];
  const cards = [...document.querySelectorAll(".service-card")];
  if (!scene || !sticky || !cards.length) return;

  const count = cards.length;
  const parallaxEls = cards.map((card) => ({
    card,
    parallax: card.querySelector(".service__parallax"),
    icon: card.querySelector(".service__icon"),
  }));

  const useStatic = () => prefersReduced || window.innerWidth < STATIC_BREAKPOINT;

  function setMode() {
    const staticMode = useStatic();
    scene.classList.toggle("services-scene--static", staticMode);
    scene.classList.toggle("services-scene--active", !staticMode);
    return !staticMode;
  }

  let ticking = false;
  let active = setMode();

  function applyFrame() {
    ticking = false;
    if (!active) return;

    const rect = scene.getBoundingClientRect();
    const scrollable = scene.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = clamp(-rect.top / scrollable, 0, 1);
    const segment = 1 / count;

    sticky.style.setProperty("--glow-x", `${-12 + progress * 24}%`);
    sticky.style.setProperty("--glow-y", `${-8 + progress * 16}%`);
    sticky.style.setProperty("--glow-scale", String(0.9 + progress * 0.2));
    sticky.style.setProperty("--glow-opacity", String(0.5 + progress * 0.5));

    let activeIndex = 0;

    parallaxEls.forEach(({ card, parallax, icon }, i) => {
      const segStart = i * segment - segment * 0.12;
      const segEnd = (i + 1) * segment + segment * 0.12;
      const segLen = segEnd - segStart;
      const segmentT = segLen > 0 ? (progress - segStart) / segLen : 0;
      const m = cardMorph(segmentT);

      card.style.opacity = String(m.opacity);
      card.style.transform = `translate3d(0, ${m.y}px, ${m.z}px) scale(${m.scale}) rotateX(${m.rx}deg)`;
      card.style.filter = m.blur > 0.1 ? `blur(${m.blur}px)` : "none";
      card.style.zIndex = String(Math.round(m.opacity * 10) + i);
      card.classList.toggle("is-interactive", !!m.interactive);

      if (m.opacity > 0.45) activeIndex = i;

      if (parallax) {
        const px = m.pxX ?? 0;
        const py = m.pxY ?? 0;
        const ps = m.pxScale ?? 1.05;
        parallax.style.transform = `translate3d(${px}%, ${py}%, 0) scale(${ps})`;
      }

      if (icon) {
        const iy = m.iconY ?? 0;
        icon.style.transform = `translateY(${iy}px)`;
      }
    });

    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === activeIndex));
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyFrame);
    }
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      if (!active) return;
      const scrollable = scene.offsetHeight - window.innerHeight;
      const target = scene.offsetTop + (scrollable / count) * i + 1;
      window.scrollTo({ top: target, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  window.addEventListener(
    "scroll",
    () => {
      if (active) requestTick();
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    const wasActive = active;
    active = setMode();
    if (active) {
      requestTick();
    } else if (wasActive) {
      parallaxEls.forEach(({ card, parallax, icon }) => {
        card.style.cssText = "";
        card.classList.remove("is-interactive");
        if (parallax) parallax.style.transform = "";
        if (icon) icon.style.transform = "";
      });
    }
  });

  if (active) {
    requestTick();
  } else {
    scene.classList.add("services-scene--static");
  }
}

wireFooterYear();
wireSmoothAnchors();
wireReveals();
wireForm();
wireServicesParallax();
