/**
 * Calculate end time from start time and duration
 */
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

/**
 * Calculate height in pixels based on duration
 */
function calculateCardHeight(durationMinutes) {
  // 1 hour = 80px (one time slot height)
  return (durationMinutes / 60) * 80;
}

/**
 * Format date as "February 12th 2026"
 */
export function formatDateLong(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);

  // Add ordinal suffix (st, nd, rd, th)
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);

  return formatted.replace(day, `${day}${suffix}`);
}

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Render location cards in sidebar (WITH IMAGES)
 */
export function renderLocationCards(locations, container) {
  container.innerHTML = "";

  if (locations.length === 0) {
    container.innerHTML = '<div class="error">No locations found</div>';
    return;
  }

  locations.forEach((location) => {
    const card = createLocationCard(location);
    container.appendChild(card);
  });
}

function createLocationCard(location) {
  const card = document.createElement("div");
  card.className = "location-card";
  card.draggable = true;
  card.dataset.locationId = location.locationID;
  card.dataset.locationData = JSON.stringify(location);

  const timeInHours = Math.ceil(location.timeToComplete / 60);

  card.innerHTML = `
        ${
          location.locationImage
            ? `
            <div class="location-card-image-wrapper">
                <img src="${location.locationImage}" alt="${location.locationName}" class="location-card-image">
            </div>
        `
            : ""
        }
        <div class="location-card-content">
            <div class="location-card-header">
                <h4 class="location-card-title">${location.locationName}</h4>
                <span class="location-card-time">⏱️ ${timeInHours}h</span>
            </div>
            <p class="location-card-description">${location.locationDescription || ""}</p>
            <div class="location-card-footer">
                <span class="location-card-rating">⭐ ${location.starRating || 0}</span>
                <span class="location-card-neighborhood">📍 ${location.neighborhood || ""}</span>
            </div>
        </div>
    `;

  return card;
}

/**
 * Render hourly time slots
 */
export function renderTimeSlots(container) {
  container.innerHTML = "";

  for (let hour = 0; hour < 24; hour++) {
    const timeSlot = createTimeSlot(hour);
    container.appendChild(timeSlot);
  }
}

function createTimeSlot(hour) {
  const slot = document.createElement("div");
  slot.className = "time-slot";
  slot.dataset.hour = hour;

  const time = `${String(hour).padStart(2, "0")}:00`;

  slot.innerHTML = `
        <div class="time-label">${time}</div>
        <div class="time-slot-content" data-time="${time}"></div>
    `;

  return slot;
}

/**
 * Render itinerary cards (dropped items) - SIMPLIFIED
 */
export function renderItineraryCards(slots, container) {
  // Clear existing cards but keep time slots
  const existingCards = container.querySelectorAll(".itinerary-card");
  existingCards.forEach((card) => card.remove());

  slots.forEach((slot) => {
    const card = createItineraryCard(slot);

    // Find the correct time slot to append to
    const hour = parseInt(slot.slotTime.split(":")[0]);
    const timeSlot = container.querySelector(`[data-hour="${hour}"] .time-slot-content`);

    if (timeSlot) {
      timeSlot.appendChild(card);
    }
  });
}

function createItineraryCard(slot) {
  const card = document.createElement("div");
  card.className = slot.slotID ? "itinerary-card" : "itinerary-card new-item";
  card.dataset.slotId = slot.slotID || "";
  card.dataset.slotData = JSON.stringify(slot);

  const location = slot.location;
  const endTime = calculateEndTime(slot.slotTime, location.timeToComplete);
  const height = calculateCardHeight(location.timeToComplete);

  card.style.height = `${height}px`;

  // SIMPLIFIED: Only show name, rating, address, time
  card.innerHTML = `
        <div class="itinerary-card-header">
            <h4 class="itinerary-card-title">${location.locationName}</h4>
            <button class="remove-card-btn" data-slot-id="${slot.slotID || ""}" data-temp-id="${slot.tempId || ""}">×</button>
        </div>
        <div class="itinerary-card-time-range">
            ${slot.slotTime} - ${endTime}
        </div>
        <div class="itinerary-card-rating">
            ⭐ ${location.starRating || 0}
        </div>
        <div class="itinerary-card-address">
            📍 ${location.address || "Address not available"}
        </div>
    `;

  // Make card clickable to view details
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove-card-btn")) {
      window.dispatchEvent(
        new CustomEvent("showLocationDetail", {
          detail: { locationID: location.locationID },
        }),
      );
    }
  });

  return card;
}

/**
 * Render location detail in modal
 */
export function renderLocationDetail(location, container) {
  const timeInHours = Math.ceil(location.timeToComplete / 60);

  container.innerHTML = `
        <div class="location-detail">
            ${location.locationImage ? `<img src="${location.locationImage}" alt="${location.locationName}" class="location-detail-image">` : ""}
            <h2 class="location-detail-title">${location.locationName}</h2>
            <div class="location-detail-meta">
                <div class="location-detail-meta-item">
                    ⏱️ ${timeInHours} hour${timeInHours > 1 ? "s" : ""}
                </div>
                <div class="location-detail-meta-item">
                    📍 ${location.distanceToPublicTransport ? `${location.distanceToPublicTransport} to transit` : "Transit info unavailable"}
                </div>
                <div class="location-detail-rating">
                    ⭐ ${location.starRating || 0} (${location.numberOfReviews || 0} reviews)
                </div>
            </div>
            <p class="location-detail-description">${location.locationDescription || ""}</p>
            <div class="location-detail-address">
                📍 ${location.address || "Address not available"}
            </div>
        </div>
    `;
}

/**
 * Update date display
 */
export function updateDateDisplay(dateString, element) {
  element.textContent = formatDateLong(dateString);
}

/**
 * Show loading state
 */
export function showLoading(container, message = "Loading...") {
  container.innerHTML = `<div class="loading">${message}</div>`;
}

/**
 * Show error state
 */
export function showError(container, message = "An error occurred") {
  container.innerHTML = `<div class="error">${message}</div>`;
}
