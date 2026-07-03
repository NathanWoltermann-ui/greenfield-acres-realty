/* ============================================================
   Home-Finder wizard — typeform-style guided search.
   Works fully standalone: builds live MLS search links from the
   answers and sends Aimee a lead via Netlify Forms. When the
   /api/concierge endpoint has an ANTHROPIC_API_KEY, the result
   step is upgraded with a personally written AI note.
   ============================================================ */

(() => {
  const stage = document.querySelector("[data-finder]");
  if (!stage) return;

  const IDX_BASE = "https://greenfieldacresrealty.idxbroker.com";
  const CITY_IDS = { "Sparta": 44011, "Blowing Rock": 4531, "Boone": 4970, "Banner Elk": 2514, "West Jefferson": 50899 };
  const LABELS = {
    intent: { "primary": "a primary home", "second-home": "a second home", "retirement": "a retirement home", "investment": "an investment property", "selling": "selling a property" },
    budget: { "under-400": "under $400k", "400-800": "$400k–$800k", "800-1500": "$800k–$1.5M", "over-1500": "$1.5M+", "land": "land to build on" },
    timeline: { "asap": "as soon as possible", "3-6-months": "in 3–6 months", "6-12-months": "in 6–12 months", "dreaming": "someday soon" },
    style: { "log-cabin": "a log cabin or lodge", "farm": "a farm with acreage", "estate": "a luxury estate", "village": "a village home", "build": "land to build on" },
  };

  const answers = { intent: "", budget: "", timeline: "", towns: [], style: "", musthaves: [], name: "", contact: "", notes: "" };

  const steps = () =>
    answers.intent === "selling"
      ? ["intent", "timeline", "towns", "contact", "result"]
      : ["intent", "budget", "timeline", "towns", "style", "musthaves", "contact", "result"];

  let idx = 0;
  const progressBar = document.querySelector("[data-finder-progress]");

  const show = (i) => {
    idx = Math.max(0, Math.min(i, steps().length - 1));
    const current = steps()[idx];
    stage.querySelectorAll(".finder__step").forEach((s) => s.classList.toggle("is-active", s.dataset.step === current));
    if (progressBar) progressBar.style.width = `${(idx / (steps().length - 1)) * 100}%`;
    if (current === "result") renderResult();
  };

  /* single-choice steps auto-advance */
  stage.querySelectorAll(".finder__step").forEach((stepEl) => {
    const multi = stepEl.querySelector("[data-multi]");
    stepEl.querySelectorAll(".finder__opt").forEach((opt) => {
      opt.addEventListener("click", () => {
        const key = stepEl.dataset.step;
        if (multi) {
          opt.classList.toggle("is-selected");
        } else {
          stepEl.querySelectorAll(".finder__opt").forEach((o) => o.classList.remove("is-selected"));
          opt.classList.add("is-selected");
          answers[key] = opt.dataset.value;
          setTimeout(() => show(idx + 1), 260);
        }
      });
    });
  });

  stage.querySelectorAll("[data-finder-next]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const stepEl = btn.closest(".finder__step");
      const key = stepEl.dataset.step;
      answers[key] = [...stepEl.querySelectorAll(".finder__opt.is-selected")].map((o) => o.dataset.value);
      show(idx + 1);
    })
  );

  stage.querySelectorAll("[data-finder-back]").forEach((btn) =>
    btn.addEventListener("click", () => show(idx - 1))
  );

  /* ---------- search link building ---------- */
  const buildSearchURL = (opts = {}) => {
    const p = new URLSearchParams();
    const landIntent = answers.budget === "land" || answers.style === "build";
    p.set("pt", opts.land || landIntent ? "6" : "1");
    const towns = answers.towns.filter((t) => CITY_IDS[t]);
    if (towns.length) {
      p.set("ccz", "city");
      towns.forEach((t) => p.append("city[]", String(CITY_IDS[t])));
    }
    const [lp, hp] = { "under-400": [null, 400000], "400-800": [400000, 800000], "800-1500": [800000, 1500000], "over-1500": [1500000, null] }[answers.budget] || [null, null];
    if (lp) p.set("lp", String(lp));
    if (hp) p.set("hp", String(hp));
    if (answers.musthaves.includes("5+ acres")) p.set("acres", "5");
    p.set("srt", opts.srt || "newest");
    return `${IDX_BASE}/idx/results/listings?${p.toString()}`;
  };

  /* ---------- lead submission ---------- */
  const submitLead = () => {
    const body = new URLSearchParams({
      "form-name": "home-finder",
      name: answers.name,
      contact: answers.contact,
      intent: answers.intent,
      budget: answers.budget,
      timeline: answers.timeline,
      towns: answers.towns.join(", "),
      style: answers.style,
      musthaves: answers.musthaves.join(", "),
      notes: answers.notes,
    });
    return fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() }).catch(() => {});
  };

  const submitBtn = stage.querySelector("[data-finder-submit]");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      answers.name = stage.querySelector("[data-fin-name]")?.value.trim() || "";
      answers.contact = stage.querySelector("[data-fin-contact]")?.value.trim() || "";
      answers.notes = stage.querySelector("[data-fin-notes]")?.value.trim() || "";
      if (answers.contact) submitLead();
      show(idx + 1);
    });
  }

  /* ---------- result step ---------- */
  const renderResult = () => {
    const summary = stage.querySelector("[data-finder-summary]");
    const links = stage.querySelector("[data-finder-links]");
    if (!summary || !links) return;

    const firstName = answers.name.split(" ")[0] || "friend";
    const townsTxt = answers.towns.filter((t) => t !== "not-sure").join(", ") || "the whole High Country";
    const selling = answers.intent === "selling";

    summary.innerHTML = "";
    const h = document.createElement("h4");
    const p = document.createElement("p");
    if (selling) {
      h.textContent = `Thanks, ${firstName} — let's get your property sold.`;
      p.textContent = `Aimee has your details and will reach out ${answers.timeline === "asap" ? "right away" : "shortly"} to talk pricing, staging, and her luxury marketing plan for ${townsTxt}. With CLHMS GUILD credentials and the High Country MLS behind her, your listing will be in good hands.`;
    } else {
      h.textContent = `Your trail map is ready, ${firstName}.`;
      p.textContent = `You're looking for ${LABELS.style[answers.style] || "a mountain home"} in ${townsTxt}, ${LABELS.budget[answers.budget] || "at your budget"}, ${LABELS.timeline[answers.timeline] || "on your timeline"}${answers.musthaves.length ? ` — with ${answers.musthaves.join(", ").toLowerCase()}` : ""}. The searches below are live from the MLS, and Aimee now has your wishlist in hand.`;
    }
    summary.appendChild(h);
    summary.appendChild(p);

    const aiNote = document.createElement("p");
    aiNote.style.marginTop = "0.9rem";
    aiNote.style.fontStyle = "italic";
    aiNote.style.color = "var(--mist)";
    summary.appendChild(aiNote);

    links.innerHTML = "";
    const mkBtn = (text, href, brass) => {
      const a = document.createElement("a");
      a.className = brass ? "btn btn--brass" : "btn btn--ghost";
      a.innerHTML = `<span>${text}</span>`;
      a.href = href;
      if (href.startsWith("http")) { a.target = "_blank"; a.rel = "noopener"; }
      links.appendChild(a);
    };
    if (selling) {
      mkBtn("Call Aimee — 336-466-7727", "tel:+13364667727", true);
      mkBtn("WhatsApp Aimee", "https://wa.me/13364667727");
    } else {
      mkBtn("See My Matches — Newest First", buildSearchURL(), true);
      mkBtn("Highest Price First", buildSearchURL({ srt: "prd" }));
      if (answers.style === "farm" || answers.budget === "land" || answers.style === "build") {
        mkBtn("Land & Acreage Matches", buildSearchURL({ land: true }));
      }
      mkBtn("Book a Call With Aimee", "#schedule");
    }

    /* optional AI concierge note — activates once ANTHROPIC_API_KEY is set */
    fetch("/api/concierge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.ai && data.message) aiNote.textContent = `“${data.message}” — Aimee's concierge`;
      })
      .catch(() => {});
  };

  show(0);
})();
