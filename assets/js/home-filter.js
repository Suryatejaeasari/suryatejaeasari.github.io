(() => {
  const bar = document.getElementById("home-filter");
  if (!bar) return;

  const buttons = [...bar.querySelectorAll("button[data-filter]")];
  const cards = [...document.querySelectorAll("[data-cats],[data-type]")];

  const tokens = (el, attr) =>
    (el.getAttribute(attr) || "").split(/\s+/).filter(Boolean);

  const apply = (raw) => {
    buttons.forEach(b => {
      const on = b.dataset.filter === raw;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    const [kind, value] = raw.includes(":") ? raw.split(":") : ["all", ""];

    cards.forEach(card => {
      let show = true;

      if (kind === "cat") {
        show = tokens(card, "data-cats").includes(value);
      } else if (kind === "type") {
        show = tokens(card, "data-type").includes(value);
      }

      card.style.display = show ? "" : "none";
    });

    const hash =
      raw === "cat:projects" ? "projects" :
      raw === "type:publication" ? "publications" : "";
    window.location.hash = hash ? `#${hash}` : "";
  };

  const fromHash = () => {
    const h = location.hash.replace("#", "");
    if (h === "projects") return "cat:projects";
    if (h === "publications") return "type:publication";
    return "all";
  };

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (btn) apply(btn.dataset.filter);
  });

  apply(fromHash());
})();
