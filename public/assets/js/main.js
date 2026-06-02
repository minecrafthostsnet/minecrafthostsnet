
const rows = Array.from(document.querySelectorAll("[data-host-row]"));
const searchInput = document.querySelector("#hostSearch");
const typeFilter = document.querySelector("#typeFilter");
const priceUnitFilter = document.querySelector("#priceUnitFilter");
const priceRangeFilter = document.querySelector("#priceRangeFilter");
const sortSelect = document.querySelector("#sortHosts");
const filterStatus = document.querySelector("#filterStatus");

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

function updateRows() {
  if (!rows.length) return;
  const query = (searchInput?.value || "").toLowerCase();
  const type = typeFilter?.value || "all";
  const priceUnit = priceUnitFilter?.value || "all";
  const priceRange = priceRangeFilter?.value || "all";
  const sort = sortSelect?.value || "rank";

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
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
  const visibleRows = rows.filter(row => row.style.display !== "none");
  visibleRows.sort((a, b) => {
    if (sort === "price") return Number(a.dataset.price) - Number(b.dataset.price);
    return rankFor(a, type) - rankFor(b, type);
  });
  visibleRows.forEach((row, index) => {
    const rank = row.querySelector(".rank");
    if (rank) rank.textContent = `${index + 1}.`;
    tbody.appendChild(row);
  });
  if (filterStatus) {
    const context = type === "all" ? "overall editorial ranking" : `${type} category ranking`;
    const sortContext = sort === "price" ? "sorted by advertised starting amount" : `ranked by ${context}`;
    filterStatus.textContent = `${visibleRows.length} of ${rows.length} hosts shown, ${sortContext}.`;
  }
}
const controls = [searchInput, typeFilter, priceUnitFilter, priceRangeFilter, sortSelect];
controls.forEach(el => el && el.addEventListener("input", updateRows));
controls.forEach(el => el && el.addEventListener("change", updateRows));
updateRows();
