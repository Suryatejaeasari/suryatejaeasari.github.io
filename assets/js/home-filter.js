
(() => {
  const bar = document.getElementById("home-filter");
  if (!bar) return;

  const buttons = [...bar.querySelectorAll("button[data-filter]")];
  const cards = [...document.querySelectorAll("#post-list .card-wrapper")];

  const tokens = (el, attr) =>
    (el.getAttribute(attr) || "").split(/\s+/).filter(Boolean);

  const apply = (raw) => {
    buttons.forEach(b => {
      const on = b.dataset.filter === raw;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    const [kind, value] = raw.includes(":")
      ? raw.split(":")
      : ["all", ""];

    cards.forEach(card => {
      let show = true;

      if (kind === "cat") {
        show = tokens(card, "data-cats").includes(value);

      } else if (kind === "type") {
        show = tokens(card, "data-type").includes(value);

      } else if (kind === "access") {
        show = (card.dataset.access || "public") === value;
      }

      card.style.display = show ? "" : "none";
    });

    const hash =
      raw === "cat:projects" ? "projects" :
      raw === "type:publication" ? "publications" :
      raw === "type:case-study" ? "case-studies" :
      raw === "access:locked" ? "locked" : "";

    if (hash) {
      history.replaceState(null, "", `#${hash}`);
    } else {
      history.replaceState(null, "", location.pathname + location.search);
    }
  };

  const fromHash = () => {
    const h = location.hash.replace("#", "");

    if (h === "projects") return "cat:projects";
    if (h === "publications") return "type:publication";
    if (h === "case-studies" || h === "case%20studies") {
      return "type:case-study";
    }
    if (h === "locked") return "access:locked";

    return "all";
  };

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (btn) apply(btn.dataset.filter);
  });

  window.addEventListener("hashchange", () => {
    apply(fromHash());
  });

  apply(fromHash());
})();
