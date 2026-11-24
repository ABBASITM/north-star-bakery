"use strict";

/* North Star Bakery - Touchstone Task 4
   Feature: save favorite items and use them to build a pre-order.
   Also: JavaScript form validation and localStorage (favorites + remembered contact details). */

/* ---------- Data (arrays and objects) ---------- */

// Array of objects: every item customers can save as a favorite.
const PRODUCTS = [
  { id: "signature-loaf", name: "Signature Loaf", category: "Breads", price: "$8 to $10" },
  { id: "seeded-sourdough", name: "Seeded Sourdough", category: "Breads", price: "$7 to $9" },
  { id: "country-white", name: "Country White", category: "Breads", price: "$5 to $7" },
  { id: "chocolate-chunk-cookies", name: "Chocolate Chunk Cookies", category: "Pastries", price: "$2 to $3 each" },
  { id: "cream-filled-shortbread", name: "Cream-Filled Shortbread", category: "Pastries", price: "$3 to $4 each" },
  { id: "glazed-rolls-and-twists", name: "Glazed Rolls and Twists", category: "Pastries", price: "$3 to $5 each" },
  { id: "celebration-cakes", name: "Celebration Cakes", category: "Cakes", price: "$35 to $75" },
  { id: "pastry-boxes-for-groups", name: "Pastry Boxes for Groups", category: "Cakes", price: "$20 to $60" }
];

// Object: the localStorage keys used by the site.
const STORAGE_KEYS = {
  favorites: "northStarFavorites",
  contact: "northStarContact"
};

// Object: one validation rule (function) per form field.
const VALIDATORS = {
  name: validateName,
  email: validateEmail,
  phone: validatePhone,
  "request-type": validateRequestType,
  "pickup-date": validatePickupDate,
  "item-details": validateItemDetails
};

// Array: the order the form fields are checked in.
const FIELD_IDS = ["name", "email", "phone", "request-type", "pickup-date", "item-details"];

// Array: the favorite product ids the visitor has saved (loaded from localStorage).
let favorites = [];

/* ---------- Storage helpers ---------- */

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* Storage can be blocked; the site still works without it. */
  }
}

/* ---------- Favorites feature ---------- */

function loadFavorites() {
  const saved = readStorage(STORAGE_KEYS.favorites, []);
  favorites = saved.filter(function (id) {
    return findProduct(id) !== undefined;
  });
}

function saveFavorites() {
  writeStorage(STORAGE_KEYS.favorites, favorites);
}

function findProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

function isFavorite(id) {
  return favorites.includes(id);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favorites = favorites.filter(function (savedId) {
      return savedId !== id;
    });
  } else {
    favorites.push(id);
  }
  saveFavorites();
  refreshProductsPage();
}

function clearFavorites() {
  favorites = [];
  saveFavorites();
  refreshProductsPage();
}

function favoriteNames() {
  return favorites.map(function (id) {
    return findProduct(id).name;
  });
}

function updateFavoriteButton(button, id) {
  const saved = isFavorite(id);
  const product = findProduct(id);
  button.textContent = saved ? "Saved \u2665 (click to remove)" : "Save to favorites";
  button.setAttribute("aria-pressed", saved ? "true" : "false");
  button.setAttribute("aria-label", (saved ? "Remove " : "Save ") + product.name + (saved ? " from favorites" : " to favorites"));
}

function renderFavoritesList() {
  const list = document.getElementById("favorites-list");
  const summary = document.getElementById("favorites-summary");
  const clearButton = document.getElementById("clear-favorites");
  list.innerHTML = "";

  favorites.forEach(function (id) {
    const product = findProduct(id);
    const item = document.createElement("li");
    item.textContent = product.name + " (" + product.category + ", " + product.price + ")";
    list.appendChild(item);
  });

  if (favorites.length === 0) {
    summary.textContent = "You have not saved any favorites yet. Choose \"Save to favorites\" on any item below to build your pre-order list.";
  } else {
    summary.textContent = "You have saved " + favorites.length + (favorites.length === 1 ? " favorite:" : " favorites:");
  }
  clearButton.hidden = favorites.length === 0;
}

function refreshProductsPage() {
  document.querySelectorAll("[data-product-id]").forEach(function (card) {
    updateFavoriteButton(card.querySelector(".favorite-button"), card.dataset.productId);
  });
  renderFavoritesList();
}

function initProductsPage() {
  document.querySelectorAll("[data-product-id]").forEach(function (card) {
    const id = card.dataset.productId;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "favorite-button";
    button.addEventListener("click", function () {
      toggleFavorite(id);
    });
    card.appendChild(button);
  });
  document.getElementById("clear-favorites").addEventListener("click", clearFavorites);
  refreshProductsPage();
}

/* ---------- Contact page: favorites helper ---------- */

function renderContactFavorites() {
  const helper = document.getElementById("favorites-helper");
  const text = document.getElementById("favorites-text");
  if (favorites.length === 0) {
    helper.hidden = true;
    return;
  }
  text.textContent = favoriteNames().join(", ");
  helper.hidden = false;
}

function addFavoritesToOrder() {
  const details = document.getElementById("item-details");
  const line = "I would like to order: " + favoriteNames().join(", ") + ".";
  details.value = details.value.trim() === "" ? line : details.value.trim() + "\n" + line;
  clearError("item-details");
  details.focus();
}

/* ---------- Contact page: remembered details ---------- */

function loadContactDetails() {
  const saved = readStorage(STORAGE_KEYS.contact, {});
  ["name", "email", "phone"].forEach(function (id) {
    if (saved[id]) {
      document.getElementById(id).value = saved[id];
    }
  });
}

function saveContactDetails() {
  const details = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim()
  };
  writeStorage(STORAGE_KEYS.contact, details);
}

/* ---------- Validation rules (each returns an error message or "") ---------- */

function validateName(value) {
  if (value.trim() === "") return "Please enter your name so we know who the order is for.";
  if (value.trim().length < 2) return "Your name must be at least 2 characters long.";
  return "";
}

function validateEmail(value) {
  if (value.trim() === "") return "Please enter your email address so we can confirm your request.";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailPattern.test(value.trim())) return "Enter a valid email address, like name@example.com.";
  return "";
}

function validatePhone(value) {
  if (value.trim() === "") return "";
  if (!/^\d{3}-\d{3}-\d{4}$/.test(value.trim())) return "Use the format 204-555-0123, or leave this blank.";
  return "";
}

function validateRequestType(value) {
  return value === "" ? "Please choose a request type." : "";
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function validatePickupDate(value) {
  if (value === "") return "Please choose a pickup date.";
  if (value < todayString()) return "Pickup date cannot be in the past. Please choose today or a later date.";
  return "";
}

function validateItemDetails(value) {
  const length = value.trim().length;
  if (length === 0) return "Please tell us which items you would like or what your question is.";
  if (length < 5) return "Please add a little more detail (at least 5 characters).";
  if (length > 500) return "Item details must be 500 characters or fewer (currently " + length + ").";
  return "";
}

/* ---------- Showing and clearing feedback ---------- */

function showError(id, message) {
  const field = document.getElementById(id);
  document.getElementById(id + "-error").textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", id + "-error");
}

function clearError(id) {
  const field = document.getElementById(id);
  document.getElementById(id + "-error").textContent = "";
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
}

function validateField(id) {
  const message = VALIDATORS[id](document.getElementById(id).value);
  if (message) {
    showError(id, message);
    return false;
  }
  clearError(id);
  return true;
}

function validateForm() {
  let firstInvalid = null;
  FIELD_IDS.forEach(function (id) {
    if (!validateField(id) && firstInvalid === null) {
      firstInvalid = id;
    }
  });
  return firstInvalid;
}

function showStatus(message) {
  const status = document.getElementById("form-status");
  status.textContent = message;
  status.className = message ? "form-status" : "";
}

function handleSubmit(event) {
  event.preventDefault();
  const firstInvalid = validateForm();

  if (firstInvalid !== null) {
    showStatus("Please fix the highlighted fields below. Your answers have been kept.");
    document.getElementById(firstInvalid).focus();
    return;
  }

  saveContactDetails();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  event.target.reset();
  loadContactDetails();
  showStatus("Thank you, " + name + "! Your request is complete. We will email " + email + " to confirm your order.");
  document.getElementById("form-status").focus();
}

function initContactPage() {
  const form = document.getElementById("request-form");
  document.getElementById("pickup-date").min = todayString();
  loadContactDetails();
  renderContactFavorites();

  form.addEventListener("submit", handleSubmit);
  document.getElementById("add-favorites").addEventListener("click", addFavoritesToOrder);

  FIELD_IDS.forEach(function (id) {
    const field = document.getElementById(id);
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(id);
      }
      if (id === "name" || id === "email" || id === "phone") {
        saveContactDetails();
      }
    });
  });
  form.addEventListener("reset", function () {
    showStatus("");
    FIELD_IDS.forEach(clearError);
  });
}

/* ---------- Start-up ---------- */

function init() {
  loadFavorites();
  if (document.getElementById("favorites-list")) {
    initProductsPage();
  }
  if (document.getElementById("request-form")) {
    initContactPage();
  }
}

document.addEventListener("DOMContentLoaded", init);
