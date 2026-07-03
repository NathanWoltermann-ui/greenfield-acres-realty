/* ============================================================
   Featured listings renderer — pulls the cached MLS feed from
   /api/featured and swaps it into the featured cards (home page)
   and the land grid (/land). Falls back silently to the static
   markup when the feed is unavailable (e.g. local dev).
   ============================================================ */

(() => {
  const track = document.querySelector("[data-featured-track]");
  const landGrid = document.querySelector('[data-featured-grid="land"]');
  const landEmpty = document.querySelector('[data-featured-empty="land"]');
  if (!track && !landGrid) return;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const specChips = (l) => {
    const chips = [];
    if (l.beds) chips.push(`${l.beds} bd`);
    if (l.baths) chips.push(`${l.baths} ba`);
    if (l.sqft) chips.push(`${l.sqft.toLocaleString("en-US")} sq ft`);
    if (l.acres) chips.push(`${l.acres} ac`);
    return chips;
  };

  const buildCard = (l) => {
    const card = el("article", "card");

    const media = el("div", "card__media");
    const img = el("img");
    img.loading = "lazy";
    img.src = l.image || "/assets/listings/glade-valley-road.jpg";
    img.alt = `${l.address} — ${l.city}, ${l.state}`;
    media.appendChild(img);
    const tag = l.propType && l.propType.length < 26 ? l.propType : l.city;
    if (tag) media.appendChild(el("span", "card__tag", tag));
    card.appendChild(media);

    const body = el("div", "card__body");
    const top = el("div", "card__top");
    top.appendChild(el("h3", null, l.address));
    if (l.priceDisplay) top.appendChild(el("span", "card__price", l.priceDisplay));
    body.appendChild(top);
    body.appendChild(el("p", "card__loc", `${l.city}, ${l.state}`));

    const chips = specChips(l);
    if (chips.length) {
      const specs = el("div", "card__specs");
      specs.style.marginBottom = "0.9rem";
      chips.forEach((c) => specs.appendChild(el("span", null, c)));
      body.appendChild(specs);
    }

    const inquire = el("p", "card__inquire");
    const a = el("a", null, "View full details →");
    a.href = l.url || "https://greenfieldacresrealty.idxbroker.com/i/mls-search";
    a.target = "_blank";
    a.rel = "noopener";
    inquire.appendChild(a);
    body.appendChild(inquire);

    card.appendChild(body);
    return card;
  };

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  fetch("/api/featured")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      /* home page: replace static cards with the live feed, rotating order */
      if (track && data.source === "idx" && data.homes && data.homes.length >= 3) {
        const cta = track.querySelector(".card--cta");
        track.querySelectorAll(".card:not(.card--cta)").forEach((c) => c.remove());
        shuffle(data.homes).forEach((l) => track.insertBefore(buildCard(l), cta));
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }

      /* land page: render land parcels, or point to the live land search */
      if (landGrid) {
        if (data.land && data.land.length) {
          data.land.forEach((l) => landGrid.appendChild(buildCard(l)));
        } else if (landEmpty) {
          landEmpty.hidden = false;
        }
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }
    })
    .catch(() => {
      if (landEmpty) landEmpty.hidden = false;
    });
})();
