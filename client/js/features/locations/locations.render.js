export function renderLocations(locations) {
  const container =
    document.querySelector("#locations-sections") ||
    document.querySelector("#locations-container");

  if (!container) {
    console.error("No render container found .");
    return;
  }

  container.innerHTML = "";

  locations.forEach((loc) => {
    const card = document.createElement("div");
    card.className = "location-card";

    card.innerHTML = `
      ${loc.locationImage ? `<img src="${loc.locationImage}" alt="${loc.locationName}" />` : ""}
      <h3>${loc.locationName ?? ""}</h3>
      <p>${loc.address ?? ""}</p>
      <p>${loc.category ?? ""} • ⭐ ${loc.starRating ?? "N/A"}</p>
      <p>${loc.timeToComplete ? `${loc.timeToComplete} min` : ""}</p>
    `;

    container.appendChild(card);
  });
}

  import { viewLocation } from "./locations.api.js";

function dollars(priceLevel) {
  if (!priceLevel) return ""; 
  return "$".repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function renderSections(container, sections, onPrev, onNext, onCardClick, pageSize
) {
  container.innerHTML = "";

  sections.forEach(({ title, categoryKey, items, start, total }) => {
    const section = document.createElement("section");
    section.className = "location-section";
    section.innerHTML = `
    <div class="section-header">
      <h3>${title}</h3>
  
      <div class="section-controls">
  <button class="row-prev" data-cat="${categoryKey}" ${start <= 0 ? "disabled" : ""}>Prev</button>
  <button class="row-next" data-cat="${categoryKey}" ${start + pageSize >= total ? "disabled" : ""}>Next</button>
</div>
  
    </div>
  
    <div class="card-row" data-row="${categoryKey}"></div>
  `;

    const row = section.querySelector(".card-row");
    items.forEach((loc) => row.appendChild(renderCard(loc, onCardClick)));

    section.querySelector(".row-prev").addEventListener("click", () => onPrev(categoryKey));
    section.querySelector(".row-next").addEventListener("click", () => onNext(categoryKey));

    container.appendChild(section);
  });
}

export function renderCard(loc, onCardClick) {
  const card = document.createElement("div");
  card.className = "location-card";
  card.dataset.id = loc.locationID;

  const img = loc.locationImage || "";
  const desc = (loc.locationDescription || "").slice(0, 90); 
  const rating = loc.starRating ?? "—";
  const duration = loc.timeToComplete ? `${loc.timeToComplete} min` : "";
  const price = dollars(loc.priceLevel); 

  card.innerHTML = `
    <div class="card-top">
      <div class="card-title">${loc.locationName}</div>
    </div>

    <div class="card-image">
      ${img ? `<img src="${img}" alt="${loc.locationName}" />` : `<div class="img-placeholder"></div>`}
    </div>

    <div class="card-body">
      <div class="card-desc">${desc}</div>
      <div class="card-meta">
        <span>${price}</span>
        <span>${duration}</span>
        <span>⭐ ${rating}</span>
      </div>
      <div class="card-address">${loc.address || ""}</div>
    </div>
  `;

  card.addEventListener("click", () => onCardClick(loc));
  return card;
}

export function openModal(modalEl) {
  modalEl.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

export function closeModal(modalEl) {
  modalEl.classList.add("hidden");
  document.body.classList.remove("modal-open");
}


export async function showLocationModal(modalBodyEl, location) {
  const full = await viewLocation(location.locationID);

  modalBodyEl.innerHTML = `
    <h2 class="modal-title">${full.locationName}</h2>

    <div class="modal-main">
      <div class="modal-image">
        ${
          full.locationImage
            ? `<img src="${full.locationImage}" alt="${full.locationName}" />`
            : `<div class="img-placeholder"></div>`
        }
      </div>

      <div class="modal-details">
        <p class="modal-desc">${full.locationDescription || ""}</p>

        <p><strong>Address:</strong> ${full.address || ""}</p>
        <p><strong>Category:</strong> ${full.category || ""}</p>
        <p><strong>Neighborhood:</strong> ${full.neighborhood || ""}</p>
        <p><strong>Duration:</strong> ${
          full.timeToComplete ? `${full.timeToComplete} min` : "—"
        }</p>
        <p><strong>Rating:</strong> ⭐ ${full.starRating ?? "—"}</p>

        <button
          id="btn-save-to-itinerary"
          type="button"
          class="sidebar-btn primary btn-save"
          disabled
        
        >
         
        </button>
      </div>
    </div>
  `;
}

