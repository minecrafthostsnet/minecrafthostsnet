
const rows = Array.from(document.querySelectorAll("[data-host-row]"));
const searchInput = document.querySelector("#hostSearch");
const typeFilter = document.querySelector("#typeFilter");
const priceUnitFilter = document.querySelector("#priceUnitFilter");
const priceRangeFilter = document.querySelector("#priceRangeFilter");
const filterStatus = document.querySelector("#filterStatus");
const resetFilters = document.querySelector("#resetFilters");
const noResultsRow = document.querySelector("#noResultsRow");

rows.forEach(row => {
  const rank = row.querySelector(".rank");
  const rankText = rank?.textContent || "";
  row.dataset.searchText = row.textContent.replace(rankText, "").toLowerCase();
});

function matchesPriceRange(price, range) {
  if (range === "low") return price < 4;
  if (range === "mid") return price >= 4 && price < 7;
  if (range === "high") return price >= 7;
  return true;
}

function rankFor(row, type) {
  if (type !== "all") return Number(row.dataset.categoryRank || row.dataset.rank);
  return Number(row.dataset.rank);
}

function compareRows(a, b, type) {
  const rankDifference = rankFor(a, type) - rankFor(b, type);
  if (rankDifference) return rankDifference;
  return Number(a.dataset.rank) - Number(b.dataset.rank);
}

function hasActiveFilters(query, type, priceUnit, priceRange) {
  return Boolean(query) || type !== "all" || priceUnit !== "all" || priceRange !== "all";
}

function updateRows() {
  if (!rows.length) return;
  const query = (searchInput?.value || "").trim().toLowerCase();
  const type = typeFilter?.value || "all";
  const priceUnit = priceUnitFilter?.value || "all";
  const priceRange = priceRangeFilter?.value || "all";
  const filtersAreActive = hasActiveFilters(query, type, priceUnit, priceRange);

  rows.forEach(row => {
    const text = row.dataset.searchText || row.textContent.toLowerCase();
    const rowType = row.dataset.type;
    const rowRangePrice = Number(row.dataset.rangePrice || row.dataset.price);
    const rowPriceUnit = row.dataset.priceUnit;
    const matchesSearch = text.includes(query);
    const matchesType = type === "all" || rowType === type;
    const matchesPriceUnit = priceUnit === "all" || rowPriceUnit === priceUnit;
    const matchesRange = matchesPriceRange(rowRangePrice, priceRange);
    row.style.display = matchesSearch && matchesType && matchesPriceUnit && matchesRange ? "" : "none";
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
    const activeText = filtersAreActive ? " Active filters applied." : "";
    filterStatus.textContent = `${visibleCount} of ${rows.length} hosts shown, ranked by ${context}.${activeText}`;
  }
  if (resetFilters) resetFilters.disabled = !filtersAreActive;
}
const controls = [searchInput, typeFilter, priceUnitFilter, priceRangeFilter];
controls.forEach(el => el && el.addEventListener("input", updateRows));
controls.forEach(el => el && el.addEventListener("change", updateRows));
resetFilters?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  if (typeFilter) typeFilter.value = "all";
  if (priceUnitFilter) priceUnitFilter.value = "all";
  if (priceRangeFilter) priceRangeFilter.value = "all";
  updateRows();
  searchInput?.focus();
});
updateRows();
