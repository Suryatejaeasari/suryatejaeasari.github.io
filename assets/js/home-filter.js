
(() => {
  const bar = document.getElementById("home-filter");
  if (!bar) return;

  const buttons = [...bar.querySelectorAll("button[data-filter]")];
  const cards = [...document.querySelectorAll("#post-list .card-wrapper")];
  const lockedToggle = document.getElementById("base-locked-only");

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

      // Apply Locked-only toggle independently.
      const lockedMatch =
        !lockedToggle?.checked ||
        card.dataset.access === "locked";

      card.style.display = show && lockedMatch ? "" : "none";
    });

    const hash =
      raw === "cat:projects" ? "projects" :
      raw === "type:publication" ? "publications" :
      raw === "type:case-study" ? "case-studies" :
      raw === "cat:notes" ? "notes" :
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

    if (h === "notes") return "cat:notes";
    if (h === "locked") return "access:locked";

    return "all";
  };

  // Remember the selected category independently of the toggle.
  let selectedFilter = fromHash();

  // Category buttons.
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;

    selectedFilter = btn.dataset.filter;
    apply(selectedFilter);
  });

  // Locked-only toggle.
  lockedToggle?.addEventListener("change", () => {
    apply(selectedFilter);
  });

  // Browser back/forward navigation.
  window.addEventListener("hashchange", () => {
    selectedFilter = fromHash();
    apply(selectedFilter);
  });

  // Initial filtering.
  apply(selectedFilter);
})();
