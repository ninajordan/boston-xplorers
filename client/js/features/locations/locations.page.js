import { browseLocations, listCategories } from "./locations.api.js";
import { renderSections, showLocationModal, openModal, closeModal } from "./locations.render.js";
const ITINERARY_BASE_URL = "http://localhost:3000/api/itinerary";

let idToName = {};
let nameToId = {};
const state = {
  query: "",
  category: "",
  sort: "rating",
  order: "desc",
  page: 1,
  limit: 50,
};
async function browseItineraries() {
  const res = await fetch(`${ITINERARY_BASE_URL}/browse-itineraries`);
  if (!res.ok) throw new Error(`Failed to browse itineraries: ${res.status}`);
  return res.json();
}

async function createItinerary(itineraryName, startDate, endDate) {
  const res = await fetch(`${ITINERARY_BASE_URL}/create-itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itineraryName, startDate, endDate })
  });
  if (!res.ok) throw new Error(`Failed to create itinerary: ${res.status}`);
  return res.json();
}

async function viewItinerary(itineraryID) {
  const res = await fetch(
    `${ITINERARY_BASE_URL}/view-itinerary/${encodeURIComponent(itineraryID)}`,
  );
  if (!res.ok) throw new Error(`Failed to view itinerary ${itineraryID}: ${res.status}`);
  return res.json();
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.itineraries)) return payload.itineraries;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.success && Array.isArray(payload?.data)) return payload.data;
  return [];
}

function extractItineraryId(it) {
  return it.itineraryID ?? it._id ?? it.id;
}

function extractItineraryName(it, id) {
  return it.itineraryName ?? it.name ?? `Itinerary ${id}`;
}

const sectionIndex = new Map();
const PAGE_SIZE = 3;

function $(sel) {
  return document.querySelector(sel);
}

function normalizeLocationsPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.success && Array.isArray(payload.data)) return payload.data;
  return [];
}

function applyClientFilters(allLocations) {
  let list = [...allLocations];

  // Search includes category name
  if (state.query.trim()) {
    const q = state.query.trim().toLowerCase();

    list = list.filter((loc) => {
      const catId = (loc.category || "").trim();
      const catName = (idToName[catId] || "").toLowerCase();

      const hay = [loc.locationName, loc.locationDescription, loc.address, catName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }

  if (state.category) {
    const selectedId = state.category.trim(); // "002"
    list = list.filter((loc) => (loc.category || "").trim() === selectedId);
  }

  // Sort
  const dir = state.order === "asc" ? 1 : -1;

  if (state.sort === "rating") {
    list.sort((a, b) => (Number(a.starRating) - Number(b.starRating)) * dir);
  } else if (state.sort === "time") {
    list.sort((a, b) => (Number(a.timeToComplete) - Number(b.timeToComplete)) * dir);
  } else if (state.sort === "name") {
    list.sort(
      (a, b) => String(a.locationName || "").localeCompare(String(b.locationName || "")) * dir,
    );
  }

  return list;
}
function buildSections(locations) {
  const byCat = new Map();

  for (const loc of locations) {
    const raw = loc.category || "miscellaneous";
    const key = typeof raw === "string" ? raw.trim() : "miscellaneous";

    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key).push(loc);
  }

  const titleCase = (s) => s.replace(/(^|\s|_|\-)\w/g, (m) => m.toUpperCase());

  const sections = [];

  for (const [categoryKey, items] of byCat.entries()) {
    if (!sectionIndex.has(categoryKey)) {
      sectionIndex.set(categoryKey, 0);
    }

    let start = sectionIndex.get(categoryKey);

    const maxStart = Math.max(0, items.length - PAGE_SIZE);
    start = Math.min(start, maxStart);
    sectionIndex.set(categoryKey, start);

    const windowed = items.slice(start, start + PAGE_SIZE);

    sections.push({
      title: titleCase(idToName[categoryKey] ?? categoryKey),
      categoryKey,
      items: windowed,
      total: items.length,
      start,
    });
  }

  sections.sort((a, b) => a.title.localeCompare(b.title));

  return sections;
}
async function loadSidebarItineraries() {
  const listEl = document.querySelector("#itinerary-list");
  if (!listEl) return;

  listEl.innerHTML = `<div style="padding:8px 0; opacity:.85;">Loading…</div>`;

  try {
    const payload = await browseItineraries();
    const itineraries = normalizeListPayload(payload);

    if (!itineraries.length) {
      listEl.innerHTML = `<div style="padding:8px 0; opacity:.85;">No itineraries yet.</div>`;
      return;
    }

    listEl.innerHTML = "";

    itineraries.forEach((it) => {
      const id = extractItineraryId(it);
      if (!id) return;

      const name = extractItineraryName(it, id);

      const a = document.createElement("a");
      a.href = `./pages/itineraries.html?id=${encodeURIComponent(id)}`;
      a.textContent = name;

      a.addEventListener("click", async (e) => {
        e.preventDefault();

        try {
          const full = await viewItinerary(id);

          sessionStorage.setItem("activeItinerary", JSON.stringify(full));

          window.location.href = a.href;
        } catch (err) {
          console.error("Failed to open itinerary:", err);
          alert("Could not load itinerary. Check console for details.");
        }
      });

      listEl.appendChild(a);
    });
  } catch (err) {
    console.error("Sidebar itineraries failed:", err);
    listEl.innerHTML = `<div style="padding:8px 0; opacity:.85;">Could not load.</div>`;
  }
}

async function loadAndRender() {
  const container = $("#locations-sections");
  if (!container) {
    console.error("Missing #locations-sections in HTML.");
    return;
  }

  try {
    container.innerHTML = `<p style="padding:1rem;">Loading locations…</p>`;

    const [payload, categoryResponse] = await Promise.all([
      browseLocations(state),
      listCategories(),
    ]);

    const categories = categoryResponse?.categories ?? [];

    idToName = Object.fromEntries(
      categories.map((name, i) => [String(i + 1).padStart(3, "0"), name]),
    );

    nameToId = Object.fromEntries(
      Object.entries(idToName).map(([id, name]) => [name.toLowerCase(), id]),
    );
    const select = $("#filter-category");
    if (select) {
      select.innerHTML = `<option value="">All</option>`;
      categories.forEach((name, idx) => {
        const id = String(idx + 1).padStart(3, "0");
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        select.appendChild(opt);
      });
      select.value = state.category || "";
    }

    const allLocations = normalizeLocationsPayload(payload);
    let filtered = applyClientFilters(allLocations);

    console.log("BROWSE payload:", payload);
    console.log("allLocations length:", allLocations.length);
    console.log("filtered length:", filtered.length);
    console.log("sample location:", allLocations[0]);
    if (!filtered.length) {
      container.innerHTML = `<p style="padding:1rem;">No locations found.</p>`;
      return;
    }

    const modalEl = $("#location-modal");
    const modalBodyEl = $("#modal-body");

    const onCardClick = async (loc) => {
      if (!modalEl || !modalBodyEl) return;
      openModal(modalEl);
      modalBodyEl.innerHTML = `<p>Loading…</p>`;
      await showLocationModal(modalBodyEl, loc);
    };

    function onPrev(categoryKey) {
      const current = sectionIndex.get(categoryKey) || 0;
      sectionIndex.set(categoryKey, Math.max(0, current - PAGE_SIZE));
      renderSections(container, buildSections(filtered), onPrev, onNext, onCardClick, PAGE_SIZE);
    }

    function onNext(categoryKey) {
      const total = filtered.filter(
        (l) => (l.category || "miscellaneous").trim() === categoryKey,
      ).length;

      const current = sectionIndex.get(categoryKey) || 0;
      const maxStart = Math.max(0, total - PAGE_SIZE);

      sectionIndex.set(categoryKey, Math.min(current + PAGE_SIZE, maxStart));
      renderSections(container, buildSections(filtered), onPrev, onNext, onCardClick, PAGE_SIZE);
    }

    renderSections(container, buildSections(filtered), onPrev, onNext, onCardClick, PAGE_SIZE);
  } catch (err) {
    console.error("Failed to load locations:", err);
    container.innerHTML = `<p style="padding:1rem;">Could not load locations.</p>`;
  }
}

function wireModalClose() {
  const modalEl = $("#location-modal");
  if (!modalEl) return;

  $("#modal-close")?.addEventListener("click", () => closeModal(modalEl));
  $("#modal-backdrop")?.addEventListener("click", () => closeModal(modalEl));
}

function wireAddItineraryModal() {
  const modal = $("#add-itinerary-modal");
  const btn = $("#btn-add-itinerary");
  const cancelBtn = $("#itinerary-cancel");
  const closeBtn = $("#itinerary-modal-close");
  const backdrop = $("#itinerary-modal-backdrop");
  const form = $("#add-itinerary-form");
  
  const openItineraryModal = () => {
    if (modal) {
      modal.classList.remove("hidden");
      
      // Set min date to today
      const today = new Date().toISOString().split('T')[0];
      const startInput = $("#itinerary-start-date");
      const endInput = $("#itinerary-end-date");
      
      if (startInput) {
        startInput.min = today;
        startInput.value = today;
      }
      
      if (endInput) {
        endInput.min = today;
      }
    }
  };
  
  const closeItineraryModal = () => {
    modal?.classList.add("hidden");
    form?.reset();
  };
  
  btn?.addEventListener("click", openItineraryModal);
  cancelBtn?.addEventListener("click", closeItineraryModal);
  closeBtn?.addEventListener("click", closeItineraryModal);
  backdrop?.addEventListener("click", closeItineraryModal);
  
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const itineraryName = formData.get('itineraryName');
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    
    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be after or equal to start date');
      return;
    }
    
    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      
      const result = await createItinerary(itineraryName, startDate, endDate);
      
      console.log('Itinerary created:', result);
      
      // Close modal
      closeItineraryModal();
      
      // Refresh sidebar itineraries
      await loadSidebarItineraries();
      
      
    } catch (err) {
      console.error("Create itinerary failed:", err);
      alert("Could not create itinerary. Check console for details.");
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Itinerary';
    }
  });
  
  // Update end date min when start date changes
  const startInput = $("#itinerary-start-date");
  const endInput = $("#itinerary-end-date");
  
  startInput?.addEventListener("change", () => {
    if (endInput) {
      endInput.min = startInput.value;
      if (endInput.value && endInput.value < startInput.value) {
        endInput.value = startInput.value;
      }
    }
  });
}

export function initLocationsPage() {
  function wireAddLocationPanel() {
    const panel = $("#add-panel");
    const btn = $("#btn-add-location");
    const cancel = $("#add-cancel");
    const form = $("#add-form");

    const open = () => panel?.classList.remove("hidden");
    const close = () => panel?.classList.add("hidden");

    btn?.addEventListener("click", () => {
      if (!panel) return;
      panel.classList.toggle("hidden");
    });

    cancel?.addEventListener("click", close);

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());

      if (payload.timeToComplete !== "") payload.timeToComplete = Number(payload.timeToComplete);
      else delete payload.timeToComplete;

      try {
        const res = await fetch("http://localhost:3000/api/locations/create-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Create failed: ${res.status}`);
        }

        form.reset();
        close();
        sectionIndex.clear();
        await loadAndRender();
      } catch (err) {
        console.error("Create location failed:", err);
        alert("Could not create location. ");
      }
    });
  }
  wireModalClose();
  wireAddItineraryModal();
  loadSidebarItineraries();
  wireAddLocationPanel();
  const searchEl = $("#filter-search") || $("#search");
  searchEl?.addEventListener("input", (e) => {
    state.query = e.target.value || "";
    sectionIndex.clear();
    loadAndRender();
  });

  $("#filters-toggle")?.addEventListener("click", () => {
    $("#filters-panel")?.classList.toggle("hidden");
  });

  $("#filters-apply")?.addEventListener("click", () => {
    state.category = $("#filter-category")?.value || "";
    state.sort = $("#filter-sort")?.value || "rating";
    state.order = $("#filter-order")?.value || "desc";
    sectionIndex.clear();
    loadAndRender();
  });

  $("#filters-clear")?.addEventListener("click", () => {
    state.category = "";
    state.query = "";
    sectionIndex.clear();

    $("#filter-category") && ($("#filter-category").value = "");
    searchEl && (searchEl.value = "");

    loadAndRender();
  });

  loadAndRender();
}

initLocationsPage();
