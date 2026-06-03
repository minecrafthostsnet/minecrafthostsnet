const CURRENCY_KEY = "minecraftHostsCurrency";
const CURRENCY_PARAM = "currency";
const CURRENCY_RATES = {
  USD: 1,
  AUD: 1.39248,
  EUR: 0.858443,
  GBP: 0.742253,
  CAD: 1.383724
};
const CURRENCY_NAMES = {
  USD: "USD",
  AUD: "AUD",
  EUR: "EUR",
  GBP: "GBP",
  CAD: "CAD"
};
let currentCurrency = "USD";

const PRICE_RANGES = {
  all: {
    matches: () => true
  },
  low: {
    matches: price => price < 2
  },
  mid: {
    matches: price => price >= 2 && price < 4
  },
  high: {
    matches: price => price >= 4
  }
};

function normalizeCurrency(currency) {
  const normalized = String(currency || "").trim().toUpperCase();
  return CURRENCY_RATES[normalized] ? normalized : null;
}

function readQueryParam(query, key) {
  const source = String(query || "").replace(/^\?/, "");
  if (!source) return null;
  const pairs = source.split("&");
  for (const pair of pairs) {
    const [rawName, rawValue = ""] = pair.split("=");
    try {
      if (decodeURIComponent(rawName.replace(/\+/g, " ")) === key) {
        return decodeURIComponent(rawValue.replace(/\+/g, " "));
      }
    } catch {
      if (rawName === key) return rawValue;
    }
  }
  return null;
}

function setQueryParam(url, key, value) {
  const [withoutHash, hash = ""] = String(url || "").split("#");
  const [path, query = ""] = withoutHash.split("?");
  const pairs = query ? query.split("&").filter(Boolean) : [];
  const encodedKey = encodeURIComponent(key);
  const encodedValue = encodeURIComponent(value);
  let found = false;
  const updatedPairs = pairs.map(pair => {
    const [rawName] = pair.split("=");
    let decodedName = rawName;
    try {
      decodedName = decodeURIComponent(rawName.replace(/\+/g, " "));
    } catch {
      // Keep the raw name if decoding fails.
    }
    if (decodedName !== key) return pair;
    found = true;
    return `${encodedKey}=${encodedValue}`;
  });
  if (!found) updatedPairs.push(`${encodedKey}=${encodedValue}`);
  const queryString = updatedPairs.join("&");
  return `${path}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}

function getCurrencyFromUrl() {
  return normalizeCurrency(readQueryParam(window.location.search, CURRENCY_PARAM));
}

function getCurrencyFromCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_KEY}=([^;]*)`));
  return match ? normalizeCurrency(decodeURIComponent(match[1])) : null;
}

function getStoredCurrency() {
  try {
    const saved = normalizeCurrency(window.localStorage.getItem(CURRENCY_KEY));
    if (saved) return saved;
  } catch {
    // Ignore storage errors and try the next persistence option.
  }
  try {
    const saved = normalizeCurrency(window.sessionStorage.getItem(CURRENCY_KEY));
    if (saved) return saved;
  } catch {
    // Ignore storage errors and try the next persistence option.
  }
  return getCurrencyFromCookie();
}

function getSelectedCurrency() {
  const fromUrl = getCurrencyFromUrl();
  if (fromUrl) return fromUrl;
  const saved = getStoredCurrency();
  if (saved) return saved;
  return "USD";
}

function saveSelectedCurrency(currency) {
  const normalized = normalizeCurrency(currency);
  if (!normalized) return;
  try {
    window.localStorage.setItem(CURRENCY_KEY, normalized);
  } catch {
    // Local storage can be blocked; session/cookie fallbacks still keep the selection usable.
  }
  try {
    window.sessionStorage.setItem(CURRENCY_KEY, normalized);
  } catch {
    // Session storage can also be blocked.
  }
  document.cookie = `${CURRENCY_KEY}=${encodeURIComponent(normalized)}; path=/; max-age=31536000; SameSite=Lax`;
}

function formatCurrency(amountUsd, currency = currentCurrency) {
  const rate = CURRENCY_RATES[currency] || 1;
  const convertedAmount = amountUsd * rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(convertedAmount);
}

function convertUsdText(text, currency = currentCurrency) {
  if (currency === "USD") return text;
  return text.replace(/\$(\d+(?:\.\d+)?)/g, (_, amount) => formatCurrency(Number(amount), currency));
}

function addCurrencyParamToHref(href, currency) {
  if (!href || href.startsWith("#")) return href;
  if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) return href;
  return setQueryParam(href, CURRENCY_PARAM, currency);
}

function syncInternalCurrencyLinks(currency) {
  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");
    const updatedHref = addCurrencyParamToHref(href, currency);
    if (updatedHref !== href) link.setAttribute("href", updatedHref);
  });
}

function reloadWithCurrency(currency) {
  saveSelectedCurrency(currency);
  const nextHref = setQueryParam(window.location.href, CURRENCY_PARAM, currency);
  if (nextHref !== window.location.href) {
    window.location.assign(nextHref);
    return;
  }
  window.location.reload();
}

function collectCurrencyTextNodes() {
  const nodes = [];
  const ignoredParents = "script, style, select, option, noscript";
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.includes("$")) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(ignoredParents)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  while (walker.nextNode()) {
    nodes.push({
      node: walker.currentNode,
      originalText: walker.currentNode.nodeValue
    });
  }
  return nodes;
}

function priceRangeLabel(range, currency = currentCurrency) {
  if (range === "low") return `under ${formatCurrency(2, currency)}/GB`;
  if (range === "mid") return `${formatCurrency(2, currency)}-${formatCurrency(3.99, currency)}/GB`;
  if (range === "high") return `${formatCurrency(4, currency)}+/GB`;
  return "all price ranges";
}

function updatePriceRangeOptions(currency = currentCurrency) {
  const optionSets = [
    document.querySelector("#priceRangeFilter"),
    document.querySelector("#reviewPriceRangeFilter")
  ].filter(Boolean);

  optionSets.forEach(select => {
    const labels = {
      all: "All normalized price ranges",
      low: `Low: ${priceRangeLabel("low", currency)}`,
      mid: `Mid: ${priceRangeLabel("mid", currency)}`,
      high: `High: ${priceRangeLabel("high", currency)}`
    };
    Array.from(select.options).forEach(option => {
      if (labels[option.value]) option.textContent = labels[option.value];
    });
  });
}

function setupCurrencySelector() {
  const selectors = Array.from(document.querySelectorAll("[data-currency-select]"));
  const currencyTextNodes = collectCurrencyTextNodes();

  function applyCurrency(currency) {
    currentCurrency = normalizeCurrency(currency) || "USD";
    saveSelectedCurrency(currentCurrency);
    currencyTextNodes.forEach(({ node, originalText }) => {
      node.nodeValue = convertUsdText(originalText, currentCurrency);
    });
    selectors.forEach(selector => {
      selector.value = currentCurrency;
      selector.setAttribute("aria-label", `Display prices in ${CURRENCY_NAMES[currentCurrency]}`);
    });
    updatePriceRangeOptions(currentCurrency);
    syncInternalCurrencyLinks(currentCurrency);
    document.dispatchEvent(new CustomEvent("currencychange", { detail: { currency: currentCurrency } }));
  }

  selectors.forEach(selector => {
    selector.addEventListener("change", event => {
      const currency = normalizeCurrency(event.target.value);
      if (!currency) return;
      if (currency === currentCurrency) return;
      reloadWithCurrency(currency);
    });
  });

  applyCurrency(getSelectedCurrency());
}

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

function hasActiveFilters(query, type, priceRange) {
  return Boolean(query) || type !== "all" || priceRange !== "all";
}

function normalizeSearchText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesSearchText(text, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  const normalizedText = normalizeSearchText(text);
  return normalizedQuery.split(" ").every(token => normalizedText.includes(token));
}

function setupComparisonTable() {
  const rows = Array.from(document.querySelectorAll("[data-host-row]"));
  if (!rows.length) return;

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

  function rowSearchText(row) {
    const rank = row.querySelector(".rank");
    const rankText = rank?.textContent || "";
    return row.textContent.replace(rankText, "").toLowerCase();
  }

  function updateRows() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const type = typeFilter?.value || "all";
    const priceRange = priceRangeFilter?.value || "all";
    const filtersAreActive = hasActiveFilters(query, type, priceRange);

    rows.forEach(row => {
      const text = rowSearchText(row);
      const rowType = row.dataset.type;
      const rowRangePrice = readPrice(row);
      const matchesSearch = matchesSearchText(text, query);
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
  document.addEventListener("currencychange", updateRows);
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
      const text = card.textContent.toLowerCase();
      const cardType = card.dataset.type;
      const price = readPrice(card);
      const matchesSearch = matchesSearchText(text, query);
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
  document.addEventListener("currencychange", updateCards);
  resetFilters?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (typeFilter) typeFilter.value = "all";
    if (priceRangeFilter) priceRangeFilter.value = "all";
    updateCards();
    searchInput?.focus();
  });
  updateCards();
}

setupCurrencySelector();
setupComparisonTable();
setupReviewFilters();
