
const rows = Array.from(document.querySelectorAll("[data-host-row]"));
const searchInput = document.querySelector("#hostSearch");
const typeFilter = document.querySelector("#typeFilter");
const sortSelect = document.querySelector("#sortHosts");

function updateRows() {
  if (!rows.length) return;
  const query = (searchInput?.value || "").toLowerCase();
  const type = typeFilter?.value || "all";
  const sort = sortSelect?.value || "rank";

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const rowType = row.dataset.type;
    const matchesSearch = text.includes(query);
    const matchesType = type === "all" || rowType === type;
    row.style.display = matchesSearch && matchesType ? "" : "none";
  });

  const tbody = rows[0]?.parentElement;
  const visibleRows = rows.filter(row => row.style.display !== "none");
  visibleRows.sort((a, b) => {
    if (sort === "price") return Number(a.dataset.price) - Number(b.dataset.price);
    if (sort === "score") return Number(b.dataset.score) - Number(a.dataset.score);
    return Number(a.dataset.rank) - Number(b.dataset.rank);
  });
  visibleRows.forEach(row => tbody.appendChild(row));
}
[searchInput, typeFilter, sortSelect].forEach(el => el && el.addEventListener("input", updateRows));
[searchInput, typeFilter, sortSelect].forEach(el => el && el.addEventListener("change", updateRows));
updateRows();
