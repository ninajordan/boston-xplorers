const BASE_URL = "https://boston-xplorers-production.up.railway.app/api/locations";

export async function browseLocations({
  query,
  category,
  neighborhood,
  sort = "rating",
  order = "desc",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (category) params.set("category", category);
  if (neighborhood) params.set("neighborhood", neighborhood);
  if (sort) params.set("sort", sort);
  if (order) params.set("order", order);
  params.set("page", page);
  params.set("limit", limit);

  console.log("browseLocations URL:", `${BASE_URL}/browse-locations?${params.toString()}`);

  const res = await fetch(`${BASE_URL}/browse-locations?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load locations: ${res.status}`);
  return res.json();
}
export async function viewLocation(id) {
  const res = await fetch(`${BASE_URL}/view-location/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to load location ${id}: ${res.status}`);
  return res.json();
}
export async function listCategories() {
  const res = await fetch(
    "https://boston-xplorers-production.up.railway.app/categories/list-categories"
  );

  if (!res.ok) {
    throw new Error(`Failed to load categories: ${res.status}`);
  }

  return res.json();
}
