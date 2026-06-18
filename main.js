/* ============================================================
   Greenfield Acres Realty — interactions
   GSAP + ScrollTrigger + Lenis
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* always start at the top — the intro choreography assumes it */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* anchor links route through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: -70 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------- Split helpers ---------- */
function splitWords(el) {
  const text = el.textContent.trim().replace(/\s+/g, " ");
  el.innerHTML = text
    .split(" ")
    .map((w) => `<span class="word"><span>${w}</span></span>`)
    .join(" ");
}
document.querySelectorAll("[data-split]").forEach(splitWords);

/* ---------- Preloader → hero intro ---------- */
const preloader = document.getElementById("preloader");

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(".hero__title .line > span", {
    y: 0,
    duration: 1.1,
    stagger: 0.12,
  });
  tl.to(
    "[data-hero-fade]",
    { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
    "-=0.6"
  );
  return tl;
}

window.addEventListener("load", () => {
  if (prefersReduced) {
    preloader.remove();
    gsap.set(".hero__title .line > span", { y: 0 });
    gsap.set("[data-hero-fade]", { opacity: 1, y: 0 });
    return;
  }
  const tl = gsap.timeline();
  tl.to(preloader, {
    opacity: 0,
    duration: 0.7,
    delay: 1.25,
    ease: "power2.inOut",
    onComplete: () => preloader.remove(),
  });
  tl.add(heroIntro(), "-=0.35");
});

/* ---------- Nav behavior ---------- */
const nav = document.getElementById("nav");
let lastY = 0;
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle("is-scrolled", y > 60);
    if (y > 300 && y > lastY + 4) nav.classList.add("is-hidden");
    else if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
  },
});

/* ---------- Mobile menu ---------- */
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");

function closeMenu() {
  burger.classList.remove("is-open");
  mobileMenu.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  mobileMenu.setAttribute("aria-hidden", "true");
  if (lenis) lenis.start();
}
burger.addEventListener("click", () => {
  const open = !mobileMenu.classList.contains("is-open");
  burger.classList.toggle("is-open", open);
  mobileMenu.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
  if (lenis) open ? lenis.stop() : lenis.start();
});

/* ---------- Hero parallax ---------- */
if (!prefersReduced) {
  gsap.to("[data-hero-media] img", {
    yPercent: 12,
    scale: 1.06,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

/* ---------- Generic reveals ---------- */
document.querySelectorAll("[data-reveal]").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: prefersReduced ? 0 : 1,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 88%" },
  });
});

/* split headline reveals */
document.querySelectorAll("[data-split]").forEach((el) => {
  gsap.to(el.querySelectorAll(".word > span"), {
    y: 0,
    duration: prefersReduced ? 0 : 0.9,
    stagger: 0.025,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 86%" },
  });
});

/* image clip reveals */
document.querySelectorAll("[data-reveal-img]").forEach((el) => {
  const img = el.querySelector("img");
  if (!img || prefersReduced) return;
  gsap.fromTo(
    img,
    { clipPath: "inset(0 0 100% 0)", scale: 1.15 },
    {
      clipPath: "inset(0 0 0% 0)",
      scale: 1,
      duration: 1.3,
      ease: "power3.inOut",
      scrollTrigger: { trigger: el, start: "top 85%" },
    }
  );
});

/* about image parallax */
if (!prefersReduced) {
  document.querySelectorAll("[data-parallax] img").forEach((img) => {
    gsap.to(img, {
      yPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: img.closest("[data-parallax]"),
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

/* ---------- Counters ---------- */
document.querySelectorAll("[data-count]").forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    const proxy = { v: 0 };
    gsap.to(proxy, {
      v: target,
      duration: prefersReduced ? 0 : 1.6,
      ease: "power2.out",
      onUpdate: () => { el.textContent = Math.round(proxy.v); },
    });
  };
  ScrollTrigger.create({
    trigger: el,
    start: "top 92%",
    onEnter: run,
    onEnterBack: run,
  });
});

/* ---------- Horizontal listings (desktop pin) ---------- */
const mm = gsap.matchMedia();
mm.add("(min-width: 901px)", () => {
  const track = document.querySelector("[data-listings-track]");
  const pin = document.querySelector("[data-listings-pin]");
  if (!track || !pin) return;

  const getDistance = () => track.scrollWidth - window.innerWidth;

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: pin,
      start: "top 12%",
      end: () => "+=" + getDistance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  return () => {
    tween.scrollTrigger && tween.scrollTrigger.kill();
    tween.kill();
    gsap.set(track, { x: 0 });
  };
});

/* ---------- Reviews carousel ---------- */
const slides = gsap.utils.toArray("[data-reviews] .review");
const dotsWrap = document.querySelector("[data-review-dots]");
let current = 0;
let autoTimer = null;

slides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.className = "reviews__dot" + (i === 0 ? " is-active" : "");
  dot.setAttribute("aria-label", `Review ${i + 1}`);
  dot.addEventListener("click", () => goTo(i, true));
  dotsWrap.appendChild(dot);
});
const dots = dotsWrap.querySelectorAll(".reviews__dot");

function goTo(i, manual) {
  current = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle("is-active", idx === current));
  dots.forEach((d, idx) => d.classList.toggle("is-active", idx === current));
  if (manual) restartAuto();
}
function restartAuto() {
  clearInterval(autoTimer);
  if (!prefersReduced) autoTimer = setInterval(() => goTo(current + 1), 5500);
}
restartAuto();

document.querySelector("[data-review-prev]").addEventListener("click", () => goTo(current - 1, true));
document.querySelector("[data-review-next]").addEventListener("click", () => goTo(current + 1, true));

/* ---------- Footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* refresh triggers once images settle */
window.addEventListener("load", () => ScrollTrigger.refresh());
