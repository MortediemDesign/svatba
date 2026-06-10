"use strict";

// =========================
// Nastaveni svatby
// =========================
const COUPLE_NAMES = "Jana & Miguel";
const WEDDING_DATE = "20.Června 2026";

// =========================
// Cloudinary nastaveni
// =========================
// Vyplnte podle sveho Cloudinary uctu:
// 1. CLOUD_NAME najdete v Cloudinary Dashboardu.
// 2. UPLOAD_PRESET je unsigned preset, ktery si vytvorite v Settings > Upload.
// 3. GALLERY_TAG ponechte stejne jako v uploadu, nebo zmente pro jinou svatbu.
const CLOUD_NAME = "dfukp8thk";
const UPLOAD_PRESET = "svatba_unsigned";
const GALLERY_TAG = "wedding2026";
const UPLOAD_FOLDER = "wedding2026";
const GALLERY_REFRESH_INTERVAL_MS = 30000;
const LOCAL_CACHE_KEY = `wedding-gallery-${GALLERY_TAG}`;
const GUEST_NAME_STORAGE_KEY = `wedding-gallery-guest-name-${GALLERY_TAG}`;

// Verejny seznam fotek bez backendu. Funguje, kdyz jsou fotky oznacene tagem
// GALLERY_TAG a v Cloudinary je dostupny client-side resource list.
const CLOUDINARY_LIST_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${GALLERY_TAG}.json`;

const elements = {
  coupleNames: document.querySelector("#coupleNames"),
  weddingDate: document.querySelector("#weddingDate"),
  uploadForm: document.querySelector("#uploadForm"),
  guestName: document.querySelector("#guestName"),
  uploadButton: document.querySelector("#uploadButton"),
  uploadStatus: document.querySelector("#uploadStatus"),
  refreshButton: document.querySelector("#refreshButton"),
  galleryStatus: document.querySelector("#galleryStatus"),
  galleryGrid: document.querySelector("#galleryGrid"),
  lightbox: document.querySelector("#lightbox"),
  closeLightbox: document.querySelector("#closeLightbox"),
  lightboxImage: document.querySelector("#lightboxImage"),
  lightboxCaption: document.querySelector("#lightboxCaption")
};

let uploadWidget = null;
let isGalleryLoading = false;

document.addEventListener("DOMContentLoaded", () => {
  elements.coupleNames.textContent = COUPLE_NAMES;
  elements.weddingDate.textContent = WEDDING_DATE;
  elements.guestName.value = getSavedGuestName();

  elements.uploadForm.addEventListener("submit", handleUploadSubmit);
  elements.guestName.addEventListener("input", () => {
    saveGuestName(elements.guestName.value.trim());
  });
  elements.refreshButton.addEventListener("click", loadGallery);
  elements.closeLightbox.addEventListener("click", closeLightbox);
  elements.lightbox.addEventListener("click", (event) => {
    if (event.target === elements.lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  loadGallery();
  window.setInterval(loadGallery, GALLERY_REFRESH_INTERVAL_MS);
});

function hasCloudinaryConfig() {
  return CLOUD_NAME && UPLOAD_PRESET && !CLOUD_NAME.includes("VYPLNTE") && !UPLOAD_PRESET.includes("VYPLNTE");
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = element.className.replace(/\s?is-(success|error)/g, "");
  if (type) element.classList.add(`is-${type}`);
}

function handleUploadSubmit(event) {
  event.preventDefault();

  const guestName = elements.guestName.value.trim();
  if (!guestName) {
    setStatus(elements.uploadStatus, "Nejdrive prosim napiste sve jmeno.", "error");
    elements.guestName.focus();
    return;
  }

  if (!hasCloudinaryConfig()) {
    setStatus(elements.uploadStatus, "Doplnte prosim CLOUD_NAME a UPLOAD_PRESET v app.js.", "error");
    return;
  }

  if (!window.cloudinary) {
    setStatus(elements.uploadStatus, "Cloudinary Upload Widget se nepodarilo nacist. Zkontrolujte pripojeni k internetu.", "error");
    return;
  }

  openUploadWidget(guestName);
  saveGuestName(guestName);
}

function openUploadWidget(guestName) {
  uploadWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      folder: UPLOAD_FOLDER,
      tags: [GALLERY_TAG],
      multiple: true,
      maxFiles: 50,
      resourceType: "image",
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic", "heif"],
      context: `guest_name=${toCloudinaryContextValue(guestName)}`,
      sources: ["local", "camera", "url"],
      showAdvancedOptions: false,
      cropping: false
    },
    (error, result) => {
      if (error) {
        setStatus(elements.uploadStatus, "Nahravani se nepodarilo. Zkuste to prosim znovu.", "error");
        return;
      }

      if (result && result.event === "success") {
        setStatus(elements.uploadStatus, "Fotka byla uspesne nahrana. Dekujeme!", "success");
        loadGallery();
      }

      if (result && result.event === "queues-end") {
        setStatus(elements.uploadStatus, "Vsechny vybrane fotky jsou nahrane. Dekujeme!", "success");
        loadGallery();
      }
    }
  );

  uploadWidget.open();
}

async function loadGallery() {
  if (isGalleryLoading) return;
  isGalleryLoading = true;
  elements.refreshButton.disabled = true;
  setStatus(elements.galleryStatus, "Nacitam fotky...");

  try {
    const VERCEL_API = "https://svatba-phi-gules.vercel.app/api/photos";
    const response = await fetch(VERCEL_API, { cache: "no-store" });
    if (!response.ok) throw new Error(`API vratilo ${response.status}`);

    const photos = await response.json();
    renderGallery(photos);
    saveCachedPhotos(photos);
    
    setStatus(
      elements.galleryStatus,
      photos.length ? `Nacteno ${photos.length} fotek.` : "Zatim tu nejsou zadne fotky.",
      photos.length ? "success" : ""
    );
  } catch (error) {
    console.error(error);
    const cachedPhotos = getCachedPhotos();
    if (cachedPhotos.length) {
      renderGallery(cachedPhotos);
      setStatus(elements.galleryStatus, "Offline mód - zobrazuji poslední verzi.", "error");
    } else {
      setStatus(elements.galleryStatus, "Fotky se nepodarilo nacist. Zkuste pozdeji.", "error");
    }
  } finally {
    elements.refreshButton.disabled = false;
    isGalleryLoading = false;
  }
}

function renderGallery(photos) {
  const sortedPhotos = [...photos].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  elements.galleryGrid.innerHTML = "";

  sortedPhotos.forEach((photo) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    const button = document.createElement("button");
    button.type = "button";

    const image = document.createElement("img");
    image.loading = "lazy";
    image.alt = `Fotka od ${getGuestName(photo)}`;
    image.src = buildCloudinaryImageUrl(photo.public_id, "c_fill,w_700,h_820,q_auto,f_auto");

    const meta = document.createElement("div");
    meta.className = "photo-meta";
    meta.innerHTML = `
      <strong>${escapeHtml(getGuestName(photo))}</strong>
      <time datetime="${escapeHtml(photo.created_at || "")}">${formatDate(photo.created_at)}</time>
    `;

    button.addEventListener("click", () => openLightbox(photo));
    button.append(image, meta);
    card.append(button);
    elements.galleryGrid.append(card);
  });
}

function buildCloudinaryImageUrl(publicId, transformation) {
  const encodedPublicId = String(publicId).split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformation}/${encodedPublicId}`;
}

function getGuestName(photo) {
  const context = photo.context || {};
  const custom = context.custom || context;
  return custom.guest_name || custom.guestName || "Svatebni host";
}

function formatDate(value) {
  if (!value) return "cas neznamy";

  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function openLightbox(photo) {
  const guestName = getGuestName(photo);
  elements.lightboxImage.src = buildCloudinaryImageUrl(photo.public_id, "c_limit,w_1600,h_1600,q_auto,f_auto");
  elements.lightboxImage.alt = `Fotka od ${guestName}`;
  elements.lightboxCaption.textContent = `${guestName} - ${formatDate(photo.created_at)}`;
  elements.lightbox.classList.add("is-open");
  elements.lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  elements.lightbox.classList.remove("is-open");
  elements.lightbox.setAttribute("aria-hidden", "true");
  elements.lightboxImage.src = "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toCloudinaryContextValue(value) {
  // Cloudinary context je retezec key=value; znaky | a = maji v contextu specialni vyznam.
  return String(value).replace(/[|=]/g, " ").trim();
}

function saveCachedPhotos(photos) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(photos));
  } catch (error) {
    console.warn("Galerii se nepodarilo ulozit do lokalni cache.", error);
  }
}

function getCachedPhotos() {
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || "[]");
    return Array.isArray(cached) ? cached : [];
  } catch (error) {
    console.warn("Lokalni cache galerie nejde precist.", error);
    return [];
  }
}

function saveGuestName(guestName) {
  try {
    if (guestName) {
      localStorage.setItem(GUEST_NAME_STORAGE_KEY, guestName);
    } else {
      localStorage.removeItem(GUEST_NAME_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Jmeno hosta se nepodarilo ulozit.", error);
  }
}

function getSavedGuestName() {
  try {
    return localStorage.getItem(GUEST_NAME_STORAGE_KEY) || "";
  } catch (error) {
    console.warn("Ulozene jmeno hosta nejde nacist.", error);
    return "";
  }
}
