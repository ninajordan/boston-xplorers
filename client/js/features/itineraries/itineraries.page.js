import * as api from "./itineraries.api.js";
import * as render from "./itineraries.render.js";
import { initDragAndDrop, setupRemoveButtons } from "./itineraries.dragdrop.js";

// State
let currentItinerary = null;
let allDates = [];
let currentDateIndex = 0;
let pendingSlots = [];
let existingSlots = [];
let tempIdCounter = 0;

// DOM Elements - Define but don't access yet
let locationsListEl, itineraryNameEl, currentDateEl, prevDayBtn, nextDayBtn;
let timelineEl, saveBtn, locationSearchEl, locationModal, closeModalBtn, locationDetailEl;
let copyItineraryBtn, copyModal, closeCopyModalBtn, copyNameInput, copyStartDateInput;

async function init() {
  // Get DOM elements AFTER DOM is ready
  locationsListEl = document.getElementById("locations-list");
  itineraryNameEl = document.getElementById("itinerary-name");
  currentDateEl = document.getElementById("current-date");
  prevDayBtn = document.getElementById("prev-day");
  nextDayBtn = document.getElementById("next-day");
  timelineEl = document.getElementById("itinerary-timeline");
  saveBtn = document.getElementById("save-itinerary-btn");
  locationSearchEl = document.getElementById("location-search");
  locationModal = document.getElementById("location-modal");
  closeModalBtn = document.getElementById("close-modal");
  locationDetailEl = document.getElementById("location-detail");
  copyItineraryBtn = document.getElementById("copy-itinerary-btn");
  copyModal = document.getElementById("copy-modal");
  closeCopyModalBtn = document.getElementById("close-copy-modal");
  copyNameInput = document.getElementById("copy-itinerary-name");
  copyStartDateInput = document.getElementById("copy-start-date");

  const urlParams = new URLSearchParams(window.location.search);
  const itineraryID = urlParams.get("id");

  if (!itineraryID) {
    alert("No itinerary ID provided");
    window.location.href = "itineraries.html";
    return;
  }

  try {
    await Promise.all([loadLocations(), loadItinerary(itineraryID)]);

    setupEventListeners();
    initDragAndDrop(locationsListEl, timelineEl, handleDrop);
    setupRemoveButtons(timelineEl, handleRemove);
  } catch (error) {
    console.error("Error initializing page:", error);
    alert("Failed to load itinerary. Please try again.");
  }
}

async function loadLocations() {
  try {
    render.showLoading(locationsListEl, "Loading locations...");
    const locations = await api.fetchLocations();
    render.renderLocationCards(locations, locationsListEl);
  } catch (error) {
    render.showError(locationsListEl, "Failed to load locations");
    throw error;
  }
}

async function loadItinerary(itineraryID) {
  try {
    const data = await api.fetchItinerary(itineraryID);

    currentItinerary = {
      itineraryID: data.itineraryID,
      itineraryName: data.itineraryName,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    allDates = generateDateRange(parseDate(data.startDate), parseDate(data.endDate));
    existingSlots = data.slotData || [];

    itineraryNameEl.value = data.itineraryName;
    currentDateIndex = 0;
    updateDateDisplay();
    render.renderTimeSlots(timelineEl);
    renderCurrentDaySlots();
  } catch (error) {
    console.error("Error loading itinerary:", error);
    throw error;
  }
}

function generateDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(formatDateYMD(new Date(current)));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function parseDate(dateString) {
  return new Date(dateString);
}

function formatDateYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateDateDisplay() {
  const currentDate = allDates[currentDateIndex];
  render.updateDateDisplay(currentDate, currentDateEl);

  prevDayBtn.disabled = currentDateIndex === 0;
  nextDayBtn.disabled = currentDateIndex === allDates.length - 1;
}

function renderCurrentDaySlots() {
  const currentDate = allDates[currentDateIndex];
  const existingSlotsForDay = existingSlots.filter((slot) => slot.slotDate === currentDate);
  const pendingSlotsForDay = pendingSlots.filter((slot) => slot.slotDate === currentDate);
  const allSlotsForDay = [...existingSlotsForDay, ...pendingSlotsForDay];

  render.renderItineraryCards(allSlotsForDay, timelineEl);
  updateSaveButtonState();
}

function handleDrop(location, slotTime) {
  const currentDate = allDates[currentDateIndex];

  const newSlot = {
    tempId: `temp-${tempIdCounter++}`,
    slotDate: currentDate,
    slotTime: slotTime,
    location: {
      locationID: location.locationID,
      locationName: location.locationName,
      locationDescription: location.locationDescription,
      locationImage: location.locationImage,
      timeToComplete: location.timeToComplete,
      distanceToPublicTransport: location.distanceToPublicTransport,
      category: location.category,
      starRating: location.starRating,
      address: location.address,
    },
  };

  pendingSlots.push(newSlot);
  renderCurrentDaySlots();
}

async function handleRemove(slotID, tempId) {
  if (slotID) {
    try {
      await api.deleteSlot(slotID);
      existingSlots = existingSlots.filter((slot) => slot.slotID !== slotID);
      renderCurrentDaySlots();
    } catch (error) {
      alert("Failed to remove item. Please try again.");
      console.error("Error removing slot:", error);
    }
  } else if (tempId) {
    pendingSlots = pendingSlots.filter((slot) => slot.tempId !== tempId);
    renderCurrentDaySlots();
  }
}

async function saveItinerary() {
  if (pendingSlots.length === 0) {
    alert("No new items to save");
    return;
  }

  const itemCount = pendingSlots.length;
  const slotData = pendingSlots.map((slot) => ({
    slotDate: slot.slotDate,
    slotTime: slot.slotTime,
    locationID: slot.location.locationID,
  }));

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const result = await api.saveItinerary(currentItinerary.itineraryID, slotData);

    pendingSlots = [];
    await loadItinerary(currentItinerary.itineraryID);

    alert(`Itinerary saved! ${itemCount} item(s) added.`);
  } catch (error) {
    alert("Failed to save itinerary. Please try again.");
    console.error("Error saving itinerary:", error);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Itinerary";
  }
}

function updateSaveButtonState() {
  saveBtn.disabled = pendingSlots.length === 0;
}

async function handleCopyItinerary() {
  const newItineraryName = copyNameInput.value.trim();
  const newStartDate = copyStartDateInput.value;

  if (!newItineraryName || !newStartDate) {
    alert("Please fill in all fields");
    return;
  }

  if (!currentItinerary || !currentItinerary.itineraryID) {
    alert("Error: Itinerary data not loaded. Please refresh the page.");
    return;
  }

  try {
    const submitBtn = document.getElementById("copy-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Copying...";

    const result = await api.copyItinerary(
      currentItinerary.itineraryID,
      newItineraryName,
      newStartDate,
    );

    copyModal.classList.add("hidden");
    window.location.href = `itineraries.html?id=${result.itinerary.itineraryID}`;
  } catch (error) {
    alert("Failed to copy itinerary. Please try again.");
    console.error("Error copying itinerary:", error);

    const submitBtn = document.getElementById("copy-submit-btn");
    submitBtn.disabled = false;
    submitBtn.textContent = "Copy Itinerary";
  }
}

function setupEventListeners() {
  prevDayBtn.addEventListener("click", () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      updateDateDisplay();
      renderCurrentDaySlots();
    }
  });

  nextDayBtn.addEventListener("click", () => {
    if (currentDateIndex < allDates.length - 1) {
      currentDateIndex++;
      updateDateDisplay();
      renderCurrentDaySlots();
    }
  });

  saveBtn.addEventListener("click", saveItinerary);

  locationSearchEl.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const locationCards = locationsListEl.querySelectorAll(".location-card");

    locationCards.forEach((card) => {
      const title = card.querySelector(".location-card-title").textContent.toLowerCase();
      const description =
        card.querySelector(".location-card-description")?.textContent.toLowerCase() || "";

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  });

  let searchTimeout;
  locationSearchEl.addEventListener("input", (e) => {
    const searchTerm = e.target.value.trim();

    // Clear previous timeout
    clearTimeout(searchTimeout);

    //  API call after 500ms of no typing
    searchTimeout = setTimeout(async () => {
      console.log("🔍 Searching for:", searchTerm);

      try {
        render.showLoading(locationsListEl, "Searching...");
        const locations = await api.fetchLocations(searchTerm);
        console.log(`✅ Found ${locations.length} locations`);
        render.renderLocationCards(locations, locationsListEl);

        initDragAndDrop(locationsListEl, timelineEl, handleDrop);
      } catch (error) {
        render.showError(locationsListEl, "Search failed");
        console.error("Error searching locations:", error);
      }
    }, 500);
  });

  window.addEventListener("showLocationDetail", async (e) => {
    try {
      const location = await api.fetchLocationById(e.detail.locationID);
      render.renderLocationDetail(location, locationDetailEl);
      locationModal.classList.remove("hidden");
    } catch (error) {
      alert("Failed to load location details");
      console.error("Error loading location:", error);
    }
  });

  closeModalBtn.addEventListener("click", () => {
    locationModal.classList.add("hidden");
  });

  locationModal.querySelector(".modal-overlay").addEventListener("click", () => {
    locationModal.classList.add("hidden");
  });

  copyItineraryBtn.addEventListener("click", () => {
    if (!currentItinerary) {
      alert("Itinerary not loaded yet. Please wait and try again.");
      return;
    }

    copyNameInput.value = `${currentItinerary.itineraryName} (Copy)`;

    const today = new Date().toISOString().split("T")[0];
    copyStartDateInput.min = today;
    copyStartDateInput.value = today;

    copyModal.classList.remove("hidden");
  });

  closeCopyModalBtn.addEventListener("click", () => {
    copyModal.classList.add("hidden");
  });

  copyModal.querySelector(".modal-overlay").addEventListener("click", () => {
    copyModal.classList.add("hidden");
  });

  document.getElementById("copy-submit-btn").addEventListener("click", handleCopyItinerary);
}

document.addEventListener("DOMContentLoaded", init);
