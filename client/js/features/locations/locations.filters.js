export function setupFilters({ onSearchChange, onApplyFilters, onClearFilters }) {
  const search = document.querySelector("#locations-search");
  const toggle = document.querySelector("#filters-toggle");
  const menu = document.querySelector("#filters-menu");
  const apply = document.querySelector("#filters-apply");
  const clear = document.querySelector("#filters-clear");

  const category = document.querySelector("#filter-category");
  const neighborhood = document.querySelector("#filter-neighborhood");
  const sort = document.querySelector("#filter-sort");
  const order = document.querySelector("#filter-order");

  // Dropdown toggle
  toggle.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });

  // Live search (debounced)
  let t = null;
  search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => onSearchChange(search.value), 250);
  });

  apply.addEventListener("click", () => {
    menu.classList.add("hidden");
    onApplyFilters({
      category: category.value,
      neighborhood: neighborhood.value,
      sort: sort.value,
      order: order.value,
    });
  });

  clear.addEventListener("click", () => {
    category.value = "";
    neighborhood.value = "";
    sort.value = "rating";
    order.value = "desc";
    menu.classList.add("hidden");
    onClearFilters();
  });
}
