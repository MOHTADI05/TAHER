/* Normandie Débouche — interactions */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOBILE_MAX = 768;

function scheduleIdle(fn, timeout = 2000) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, 50);
  }
}

function wireFooterYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = String(new Date().getFullYear());
}

function wireDropdowns() {
  const dropdowns = [...document.querySelectorAll(".nav__dropdown")];
  if (!dropdowns.length) return;

  dropdowns.forEach((dd) => {
    const btn = dd.querySelector(".nav__dropbtn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const open = dd.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  document.addEventListener("click", (e) => {
    dropdowns.forEach((dd) => {
      if (dd.classList.contains("is-open") && !dd.contains(e.target)) {
        dd.classList.remove("is-open");
        dd.querySelector(".nav__dropbtn")?.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function wireNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Ouvrir le menu");
  };

  const open = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fermer le menu");
  };

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) close();
    else open();
  });

  nav.addEventListener("click", (e) => {
    if (e.target?.closest?.("a")) close();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (e.target.closest(".topbar__inner")) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
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
  const success = document.getElementById("contact-success");
  if (!success) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("sent") !== "1") return;

  success.hidden = false;
  success.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "nearest" });
}

function wireServicesList() {
  const list = document.querySelector(".svc-list");
  if (!list) return;

  const items = [...list.querySelectorAll(".svc-item")];
  if (!items.length) return;

  items.forEach((item) => {
    const head = item.querySelector(".svc-item__head");
    if (!head) return;

    head.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");

      items.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".svc-item__head")?.setAttribute("aria-expanded", "false");
      });

      if (!wasOpen) {
        item.classList.add("is-open");
        head.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function wireTarifsSpread() {
  const list = document.querySelector(".tarifs");
  if (!list) return;

  const cards = [...list.querySelectorAll(".tarif")];
  if (cards.length < 2) return;

  const featured = cards.findIndex((c) => c.classList.contains("tarif--featured"));
  const center = featured >= 0 ? featured : Math.floor(cards.length / 2);

  let baseOffsets = [];
  let active = false;
  let ticking = false;

  const canSpread = () => !prefersReduced && window.innerWidth >= 760;

  function clearTransforms() {
    cards.forEach((c) => {
      c.style.transform = "";
      c.style.zIndex = "";
    });
    list.classList.remove("is-spread");
  }

  function measure() {
    const prev = cards.map((c) => c.style.transform);
    cards.forEach((c) => (c.style.transform = "none"));
    const cRect = list.getBoundingClientRect();
    const centerX = cRect.left + cRect.width / 2;
    baseOffsets = cards.map((c) => {
      const r = c.getBoundingClientRect();
      return r.left + r.width / 2 - centerX;
    });
    cards.forEach((c, i) => (c.style.transform = prev[i] || ""));
  }

  function apply() {
    ticking = false;
    if (!active) return;

    const rect = list.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * 0.92;
    const end = vh * 0.42;
    const p = clamp((start - rect.top) / (start - end), 0, 1);
    const inv = 1 - p;

    list.classList.add("is-spread");

    cards.forEach((card, i) => {
      const tx = -baseOffsets[i] * inv;

      if (i === center) {
        card.style.transform = `translateX(${tx}px) scale(${1 + 0.04 * inv})`;
        card.style.zIndex = "5";
        return;
      }

      const dir = i < center ? -1 : 1;
      const scale = 1 - 0.1 * inv;
      const ty = 16 * inv;
      const rot = dir * 5 * inv;
      card.style.transform = `translateX(${tx}px) translateY(${ty}px) scale(${scale}) rotate(${rot}deg)`;
      card.style.zIndex = String(3 - Math.abs(i - center));
    });
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(apply);
    }
  }

  function setMode() {
    active = canSpread();
    if (active) {
      measure();
      requestTick();
    } else {
      clearTransforms();
    }
  }

  setMode();

  window.addEventListener(
    "scroll",
    () => {
      if (active) requestTick();
    },
    { passive: true }
  );

  window.addEventListener("resize", setMode);
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

  if (t < 0.34) {
    const p = t / 0.34;
    return {
      opacity: Math.min(1, p * 1.3),
      y: lerp(140, 0, p),
      z: lerp(-320, 0, p),
      scale: lerp(0.7, 1, p),
      rx: lerp(16, 0, p),
      blur: lerp(10, 0, p),
      interactive: p > 0.6,
    };
  }

  if (t > 0.7) {
    const p = (t - 0.7) / 0.3;
    return {
      opacity: 1 - p,
      y: lerp(0, -110, p),
      z: lerp(0, -220, p),
      scale: lerp(1, 0.82, p),
      rx: lerp(0, -12, p),
      blur: lerp(0, 8, p),
      interactive: p < 0.4,
    };
  }

  const hold = (t - 0.34) / 0.36;
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

function wireParallaxScene(scene) {
  const sticky = scene?.querySelector(".services-scene__sticky");
  const dots = [...scene.querySelectorAll(".services-progress__dot")];
  const cards = [...scene.querySelectorAll(".service-card")];
  if (!scene || !sticky || !cards.length) return;

  const count = cards.length;
  const parallaxEls = cards.map((card) => ({
    card,
    parallax: card.querySelector(".service__parallax"),
    icon: card.querySelector(".service__icon"),
  }));

  const useStatic = () => prefersReduced || window.innerWidth <= MOBILE_MAX;

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

function wireServicesParallax() {
  const scenes = [...document.querySelectorAll(".services-scene")];
  if (!scenes.length) return;

  scenes.forEach((scene) => {
    if (prefersReduced || window.innerWidth <= MOBILE_MAX) {
      scene.classList.add("services-scene--static");
      return;
    }

    if (!("IntersectionObserver" in window)) {
      wireParallaxScene(scene);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          wireParallaxScene(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "320px" }
    );

    io.observe(scene);
  });
}

function formatStat(value) {
  if (value >= 1000) return value.toLocaleString("fr-FR");
  return String(value);
}

function runCounter(stat) {
  const numEl = stat.querySelector(".why-stat__num");
  const target = Number(stat.dataset.count || 0);
  const suffix = stat.dataset.suffix || "";
  if (!numEl || !target) {
    if (numEl) numEl.textContent = `${formatStat(target)}${suffix}`;
    return;
  }

  if (prefersReduced) {
    numEl.textContent = `${formatStat(target)}${suffix}`;
    return;
  }

  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const p = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = Math.round(target * eased);
    numEl.textContent = `${formatStat(current)}${suffix}`;
    if (p < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function wireWhyCardFlip() {
  const cards = [...document.querySelectorAll(".why-card--stat")];
  if (!cards.length) return;

  const touchLike = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  cards.forEach((card) => {
    if (touchLike) {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-expanded", "false");
      card.setAttribute("aria-label", "Afficher les statistiques — appuyez pour retourner la carte");
    }

    const toggle = () => {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-expanded", flipped ? "true" : "false");
    };

    card.addEventListener("click", (e) => {
      if (!touchLike) return;
      if (e.target.closest("a")) return;
      toggle();
    });

    card.addEventListener("keydown", (e) => {
      if (!touchLike) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
}

function wireCounters() {
  const stats = [...document.querySelectorAll(".why-stat[data-count]")];
  if (!stats.length) return;

  const paint = (stat) => {
    if (stat.dataset.counted === "1") return;
    stat.dataset.counted = "1";
    runCounter(stat);
  };

  if (prefersReduced || !("IntersectionObserver" in window)) {
    stats.forEach(paint);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        paint(entry.target);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.1, rootMargin: "120px 0px" }
  );

  stats.forEach((stat) => io.observe(stat));
  setTimeout(() => stats.forEach(paint), 800);
}

function wireLazyMedia() {
  const lazyVideos = [...document.querySelectorAll("video[data-src]")];
  if (lazyVideos.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const video = entry.target;
            const src = video.dataset.src;
            if (!src || video.dataset.loaded) continue;
            video.dataset.loaded = "true";
            video.src = src;
            video.load();
            video.play().catch(() => {});
            io.unobserve(video);
          }
        },
        { rootMargin: "240px" }
      );
      lazyVideos.forEach((video) => io.observe(video));
    } else {
      lazyVideos.forEach((video) => {
        video.src = video.dataset.src || "";
        video.play().catch(() => {});
      });
    }
  }

  const lazyFrames = [...document.querySelectorAll("iframe[data-src]")];
  if (lazyFrames.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const frame = entry.target;
          const src = frame.dataset.src;
          if (!src || frame.dataset.loaded) continue;
          frame.dataset.loaded = "true";
          frame.src = src;
          io.unobserve(frame);
        }
      },
      { rootMargin: "120px" }
    );
    lazyFrames.forEach((frame) => io.observe(frame));
  }
}

const GA_MEASUREMENT_ID = "";
const CONSENT_COOKIE = "nd_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 395;

function readCookie(name) {
  const match = document.cookie.split("; ").find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

function writeCookie(name, value, maxAge) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function applyGoogleConsent(granted) {
  ensureGtag();
  const state = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}

function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || window.__ndGaLoaded) return;
  window.__ndGaLoaded = true;
  ensureGtag();
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(script);
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function setConsent(choice) {
  writeCookie(CONSENT_COOKIE, choice, CONSENT_MAX_AGE);
  const granted = choice === "all";
  applyGoogleConsent(granted);
  if (granted) loadGoogleAnalytics();
  hideCookieBanner();
}

function hideCookieBanner() {
  document.getElementById("cookie-banner")?.setAttribute("hidden", "");
}

function showCookieBanner() {
  document.getElementById("cookie-banner")?.removeAttribute("hidden");
}

function wireCookieConsent() {
  ensureGtag();
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  if (document.getElementById("cookie-banner")) return;

  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-labelledby", "cookie-banner-title");
  banner.setAttribute("aria-describedby", "cookie-banner-text");
  banner.innerHTML = `
    <p class="cookie-banner__title" id="cookie-banner-title">Cookies et mesure d'audience</p>
    <p class="cookie-banner__text" id="cookie-banner-text">
      Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre accord,
      des cookies d'audience pour améliorer le référencement et nos pages (Google Analytics, Consent Mode v2).
      <a href="./politique-cookies.html">Politique cookies</a>.
    </p>
    <div class="cookie-banner__actions">
      <button type="button" class="btn btn--primary" data-cookie-choice="all">Tout accepter</button>
      <button type="button" class="btn btn--ghost" data-cookie-choice="necessary">Tout refuser</button>
      <a class="btn btn--outline" href="./politique-cookies.html">En savoir plus</a>
    </div>
  `;
  document.body.appendChild(banner);

  banner.addEventListener("click", (e) => {
    const choice = e.target?.closest?.("[data-cookie-choice]")?.getAttribute("data-cookie-choice");
    if (choice) setConsent(choice);
  });

  document.addEventListener("click", (e) => {
    if (!e.target?.closest?.("[data-open-cookies]")) return;
    writeCookie(CONSENT_COOKIE, "", 0);
    applyGoogleConsent(false);
    showCookieBanner();
  });

  const existing = readCookie(CONSENT_COOKIE);
  if (existing === "all" || existing === "necessary") {
    hideCookieBanner();
    applyGoogleConsent(existing === "all");
    if (existing === "all") loadGoogleAnalytics();
  }
}

function wireLegalFooter() {
  const copy = document.querySelector(".footer__copy");
  if (!copy || copy.querySelector(".footer__legal")) return;
  const legal = document.createElement("span");
  legal.className = "footer__legal";
  legal.innerHTML =
    '<a href="./mentions-legales.html">Mentions légales</a> · <a href="./politique-cookies.html">Cookies</a> · <button type="button" class="footer__cookies-btn" data-open-cookies>Gérer les cookies</button>';
  copy.appendChild(legal);
}

wireFooterYear();
wireNav();
wireDropdowns();
wireSmoothAnchors();
wireLazyMedia();
wireCookieConsent();
wireLegalFooter();

scheduleIdle(() => {
  wireReveals();
  wireForm();
  wireServicesList();
  wireServicesParallax();
  wireWhyCardFlip();
  wireCounters();
});
