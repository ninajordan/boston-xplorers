let draggedElement = null;
let draggedData = null;

/**
 * Initialize drag and drop functionality
 */
export function initDragAndDrop(locationsContainer, timelineContainer, onDropCallback) {
  console.log("🔧 Initializing drag and drop");

  // Setup draggable location cards
  setupLocationCardDragging(locationsContainer);

  // Setup drop zones (time slots)
  setupDropZones(timelineContainer, onDropCallback);

  console.log("✅ Drag and drop ready");
}

/**
 * Setup dragging for location cards
 */
function setupLocationCardDragging(container) {
  container.addEventListener("dragstart", (e) => {
    // FIX: Use closest() to find the card, not e.target
    const card = e.target.closest(".location-card");

    if (card) {
      draggedElement = card;
      draggedData = JSON.parse(card.dataset.locationData);

      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", card.dataset.locationId);

      console.log("🎯 Drag started:", draggedData.locationName);
    }
  });

  container.addEventListener("dragend", (e) => {
    // FIX: Use closest() to find the card
    const card = e.target.closest(".location-card");

    if (card) {
      card.classList.remove("dragging");
      console.log("🏁 Drag ended");
      draggedElement = null;
      draggedData = null;
    }
  });
}

/**
 * Setup drop zones for time slots
 */
function setupDropZones(container, onDropCallback) {
  // Dragover - allow dropping
  container.addEventListener("dragover", (e) => {
    e.preventDefault();

    const timeSlotContent = e.target.closest(".time-slot-content");
    if (timeSlotContent) {
      e.dataTransfer.dropEffect = "copy";

      // Highlight drop zone
      const timeSlot = timeSlotContent.closest(".time-slot");
      if (timeSlot) {
        timeSlot.classList.add("drop-target");
      }
    }
  });

  // Dragleave - remove highlight
  container.addEventListener("dragleave", (e) => {
    const timeSlotContent = e.target.closest(".time-slot-content");
    if (timeSlotContent) {
      const timeSlot = timeSlotContent.closest(".time-slot");
      if (timeSlot) {
        timeSlot.classList.remove("drop-target");
      }
    }
  });

  // Drop - handle the drop
  container.addEventListener("drop", (e) => {
    e.preventDefault();

    console.log("💧 Drop event fired!");
    console.log("  Dragged data:", draggedData);

    const timeSlotContent = e.target.closest(".time-slot-content");

    if (!timeSlotContent) {
      console.log("❌ Not dropped on time slot content");
      return;
    }

    if (!draggedData) {
      console.log("❌ No dragged data available");
      return;
    }

    // Remove highlight
    const timeSlot = timeSlotContent.closest(".time-slot");
    if (timeSlot) {
      timeSlot.classList.remove("drop-target");
    }

    const slotTime = timeSlotContent.dataset.time;

    console.log("✅ Successfully dropped:", draggedData.locationName, "at", slotTime);

    // Call the callback with location and time
    onDropCallback(draggedData, slotTime);
  });
}

/**
 * Setup remove button functionality
 */
export function setupRemoveButtons(container, onRemoveCallback) {
  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-card-btn")) {
      e.stopPropagation(); // Prevent card click event

      const slotID = e.target.dataset.slotId;
      const tempId = e.target.dataset.tempId;

      console.log("🗑️ Remove clicked:", { slotID, tempId });

      // Confirm removal
      if (confirm("Remove this item from your itinerary?")) {
        onRemoveCallback(slotID, tempId);
      }
    }
  });
}
