
const PRICE_RANGES = {
  all: {
    label: "all price ranges",
    matches: () => true
  },
  low: {
    label: "under $2/GB",
    matches: price => price < 2
  },
  mid: {
    label: "$2-$3.99/GB",
    matches: price => price >= 2 && price < 4
  },
  high: {
    label: "$4+/GB",
    matches: price => price >= 4
  }
};

function readPrice(element) {
  const rawPrice = element?.dataset?.rangePrice || element?.dataset?.price || "";
  const price = Number.parseFloat(rawPrice);
  return Number.isFinite(price) ? price : null;
}

function matchesPriceRange(price, range) {
  const priceRange = PRICE_RANGES[range] || PRICE_RANGES.all;
  if (range !== "all" && price === null) return false;
  return priceRange.matches(price);
}

function priceRangeLabel(range) {
  return (PRICE_RANGES[range] || PRICE_RANGES.all).label;
}

function hasActiveFilters(query, type, priceRange) {
  return Boolean(query) || type !== "all" || priceRange !== "all";
}

function setupComparisonTable() {
  const rows = Array.from(document.querySelectorAll("[data-host-row]"));
  if (!rows.length) return;

  rows.forEach(row => {
    const rank = row.querySelector(".rank");
    const rankText = rank?.textContent || "";
    row.dataset.searchText = row.textContent.replace(rankText, "").toLowerCase();
  });

  const searchInput = document.querySelector("#hostSearch");
  const typeFilter = document.querySelector("#typeFilter");
  const priceRangeFilter = document.querySelector("#priceRangeFilter");
  const filterStatus = document.querySelector("#filterStatus");
  const resetFilters = document.querySelector("#resetFilters");
  const noResultsRow = document.querySelector("#noResultsRow");

  function rankFor(row, type) {
    if (type !== "all") return Number(row.dataset.categoryRank || row.dataset.rank);
    return Number(row.dataset.rank);
  }

  function compareRows(a, b, type) {
    const rankDifference = rankFor(a, type) - rankFor(b, type);
    if (rankDifference) return rankDifference;
    return Number(a.dataset.rank) - Number(b.dataset.rank);
  }

  function updateRows() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const type = typeFilter?.value || "all";
    const priceRange = priceRangeFilter?.value || "all";
    const filtersAreActive = hasActiveFilters(query, type, priceRange);

    rows.forEach(row => {
      const text = row.dataset.searchText || row.textContent.toLowerCase();
      const rowType = row.dataset.type;
      const rowRangePrice = readPrice(row);
      const matchesSearch = text.includes(query);
      const matchesType = type === "all" || rowType === type;
      const matchesRange = matchesPriceRange(rowRangePrice, priceRange);
      row.style.display = matchesSearch && matchesType && matchesRange ? "" : "none";
    });

    const tbody = rows[0]?.parentElement;
    let visibleCount = 0;
    const sortedRows = [...rows].sort((a, b) => compareRows(a, b, type));
    sortedRows.forEach(row => {
      if (row.style.display !== "none") {
        visibleCount += 1;
        const rank = row.querySelector(".rank");
        if (rank) rank.textContent = `${visibleCount}.`;
      }
      tbody.appendChild(row);
    });
    if (noResultsRow) {
      noResultsRow.hidden = visibleCount > 0;
      tbody.appendChild(noResultsRow);
    }
    if (filterStatus) {
      const context = type === "all" ? "overall editorial ranking" : `${type} category ranking`;
      const priceContext = priceRange === "all" ? "" : ` Price range: ${priceRangeLabel(priceRange)}.`;
      const activeText = filtersAreActive ? " Active filters applied." : "";
      filterStatus.textContent = `${visibleCount} of ${rows.length} hosts shown, ranked by ${context}.${priceContext}${activeText}`;
    }
    if (resetFilters) resetFilters.disabled = !filtersAreActive;
  }

  const controls = [searchInput, typeFilter, priceRangeFilter];
  controls.forEach(el => el && el.addEventListener("input", updateRows));
  controls.forEach(el => el && el.addEventListener("change", updateRows));
  resetFilters?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (typeFilter) typeFilter.value = "all";
    if (priceRangeFilter) priceRangeFilter.value = "all";
    updateRows();
    searchInput?.focus();
  });
  updateRows();
}

function setupReviewFilters() {
  const cards = Array.from(document.querySelectorAll("[data-review-card]"));
  if (!cards.length) return;

  const searchInput = document.querySelector("#reviewSearch");
  const typeFilter = document.querySelector("#reviewTypeFilter");
  const priceRangeFilter = document.querySelector("#reviewPriceRangeFilter");
  const filterStatus = document.querySelector("#reviewFilterStatus");
  const resetFilters = document.querySelector("#resetReviewFilters");
  const noResults = document.querySelector("#reviewNoResults");
  const grid = document.querySelector("#reviewGrid");

  cards.forEach(card => {
    card.dataset.searchText = card.textContent.toLowerCase();
  });

  function compareCards(a, b) {
    return Number(a.dataset.rank) - Number(b.dataset.rank);
  }

  function updateCards() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const type = typeFilter?.value || "all";
    const priceRange = priceRangeFilter?.value || "all";
    const filtersAreActive = hasActiveFilters(query, type, priceRange);
    let visibleCount = 0;

    cards.sort(compareCards).forEach(card => {
      const text = card.dataset.searchText || card.textContent.toLowerCase();
      const cardType = card.dataset.type;
      const price = readPrice(card);
      const matchesSearch = text.includes(query);
      const matchesType = type === "all" || cardType === type;
      const matchesRange = matchesPriceRange(price, priceRange);
      const isVisible = matchesSearch && matchesType && matchesRange;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
      grid?.appendChild(card);
    });

    if (noResults) noResults.hidden = visibleCount > 0;
    if (filterStatus) {
      const priceContext = priceRange === "all" ? "" : ` Price range: ${priceRangeLabel(priceRange)}.`;
      const activeText = filtersAreActive ? " Active review filters applied." : "";
      filterStatus.textContent = `${visibleCount} of ${cards.length} reviews shown.${priceContext}${activeText}`;
    }
    if (resetFilters) resetFilters.disabled = !filtersAreActive;
  }

  const controls = [searchInput, typeFilter, priceRangeFilter];
  controls.forEach(el => el && el.addEventListener("input", updateCards));
  controls.forEach(el => el && el.addEventListener("change", updateCards));
  resetFilters?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (typeFilter) typeFilter.value = "all";
    if (priceRangeFilter) priceRangeFilter.value = "all";
    updateCards();
    searchInput?.focus();
  });
  updateCards();
}

setupComparisonTable();
setupReviewFilters();
