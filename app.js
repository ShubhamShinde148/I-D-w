/**
 * MAHARASHTRA GOVERNMENT ID CARD GENERATOR
 * Application Logic & Canvas Engine
 */

// ============================================================================
// APPLICATION STATE
// ============================================================================
const state = {
  // Front details
  name: "Shri. Sachin R. Shinde",
  dob: "12/04/1986",
  designation: "Sr. Assistant / वरिष्ठ सहाय्यक",
  office: "Panchayat Samiti Ambegaon",

  // Back details
  addressLine1: "Bharadi (Niragudsar),",
  addressLine2: "Tal.Ambegaon, Pune.",
  shalarthId: "02DEDRSKF8002",
  mobileNo: "9561772332",
  email: "rupalibangar2332@gmail.com",

  // Typography & Appearance
  fontFamily: "'Noto Sans Devanagari', Arial, sans-serif",
  fontWeight: "bold",
  fontSize: 35,
  textColor: "#051433",

  // Stamp settings
  showStamp: true,
  stampOpacity: 0.95,

  // Employee signature setting (disabled per user requirement)
  showEmployeeSign: false,

  // Photo adjustments
  photoScale: 1.0,
  photoOffsetX: 0,
  photoOffsetY: 0,

  // Fine-tuned Coordinates (Base 1024x1535 coordinates on HD template)
  offsets: {
    name_x: 305,
    name_y: 928,
    dob_x: 435,
    dob_y: 1001,
    desig_x: 440,
    desig_y: 1079,
    office_x: 298,
    office_y: 1147,
    addr1_x: 395,
    addr1_y: 617,
    addr2_x: 415,
    addr2_y: 668,
    shalarth_x: 395,
    shalarth_y: 754,
    mobile_x: 305,
    mobile_y: 870,
    email_x: 222,
    email_y: 958
  }
};

// ============================================================================
// ASSET IMAGES CACHE
// ============================================================================
const assets = {
  frontTemplate: new Image(),
  backTemplate: new Image(),
  stampOverlay: new Image(),
  employeePhoto: new Image(),
  employeeSig: new Image(),
  loaded: {
    frontTemplate: false,
    backTemplate: false,
    stampOverlay: false,
    employeePhoto: false,
    employeeSig: false
  }
};

// Canvas references
let frontCanvas, frontCtx;
let backCanvas, backCtx;
let flipFrontCanvas, flipFrontCtx;
let flipBackCanvas, flipBackCtx;
let sigCanvas, sigCtx;

// Signature drawing state
let isDrawing = false;
let sigColor = "#00186b";
let webcamStream = null;

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initCanvases();
  loadAssets();
  initFormInputs();
  initPhotoControls();
  initSignaturePad();
  initViewSwitchers();
  initExportHandlers();
  initWebcamModal();
  restoreSavedData();
});

// Setup Canvas Contexts
function initCanvases() {
  frontCanvas = document.getElementById("frontCanvas");
  frontCanvas.width = 1024;
  frontCanvas.height = 1535;
  frontCtx = frontCanvas.getContext("2d");

  backCanvas = document.getElementById("backCanvas");
  backCanvas.width = 1024;
  backCanvas.height = 1535;
  backCtx = backCanvas.getContext("2d");

  flipFrontCanvas = document.getElementById("flipFrontCanvas");
  flipFrontCanvas.width = 1024;
  flipFrontCanvas.height = 1535;
  flipFrontCtx = flipFrontCanvas.getContext("2d");

  flipBackCanvas = document.getElementById("flipBackCanvas");
  flipBackCanvas.width = 1024;
  flipBackCanvas.height = 1535;
  flipBackCtx = flipBackCanvas.getContext("2d");

  sigCanvas = document.getElementById("sigCanvas");
  sigCtx = sigCanvas.getContext("2d");
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = "round";
  sigCtx.lineJoin = "round";
  sigCtx.strokeStyle = sigColor;
}

// Load Image Assets
function loadAssets() {
  assets.frontTemplate.crossOrigin = "anonymous";
  assets.frontTemplate.onload = () => {
    assets.loaded.frontTemplate = true;
    renderAll();
  };
  assets.frontTemplate.src = "assets/front_template.png";

  assets.backTemplate.crossOrigin = "anonymous";
  assets.backTemplate.onload = () => {
    assets.loaded.backTemplate = true;
    renderAll();
  };
  assets.backTemplate.src = "assets/back_template.jpg";

  assets.stampOverlay.crossOrigin = "anonymous";
  assets.stampOverlay.onload = () => {
    assets.loaded.stampOverlay = true;
    renderAll();
  };
  assets.stampOverlay.src = "assets/front_stamp_overlay.png?t=" + Date.now();

  assets.employeePhoto.crossOrigin = "anonymous";
  assets.employeePhoto.onload = () => {
    assets.loaded.employeePhoto = true;
    renderAll();
  };
  assets.employeePhoto.src = "assets/sample_photo.jpg";

  assets.employeeSig.crossOrigin = "anonymous";
  assets.employeeSig.onload = () => {
    assets.loaded.employeeSig = true;
    renderAll();
  };
  // Do not load sample_sign.png (Employee signature removed per user requirement)
  assets.employeeSig.src = "";
}

// ============================================================================
// RENDER ENGINES (FRONT & BACK CARDS - 1024x1535 BASE RESOLUTION)
// ============================================================================

/**
 * Render Front Card to any target canvas & context at arbitrary scale
 */
function renderFrontToContext(ctx, width, height, scale = 1.0) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const sx = (width / 1024) * scale;
  const sy = (height / 1535) * scale;

  // 1. Draw base template background
  if (assets.loaded.frontTemplate) {
    ctx.drawImage(assets.frontTemplate, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Employee Photo (Box: x=378, y=457, w=324, h=402 at base 1024x1535)
  if (assets.loaded.employeePhoto && assets.employeePhoto.naturalWidth > 0) {
    const boxX = 378 * sx;
    const boxY = 457 * sy;
    const boxW = 324 * sx;
    const boxH = 402 * sy;

    ctx.save();
    // Clip strictly inside the photo frame
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.clip();

    const img = assets.employeePhoto;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const boxRatio = boxW / boxH;
    const imgRatio = natW / natH;

    let drawW, drawH;
    if (imgRatio > boxRatio) {
      drawH = boxH * state.photoScale;
      drawW = drawH * imgRatio;
    } else {
      drawW = boxW * state.photoScale;
      drawH = drawW / imgRatio;
    }

    // Centered + User Offsets
    const drawX = boxX + (boxW - drawW) / 2 + (state.photoOffsetX * sx);
    const drawY = boxY + (boxH - drawH) / 2 + (state.photoOffsetY * sy);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // 3. Draw Official Stamp Overlay over photo if enabled (x=615, y=610, w=305, h=305)
  if (state.showStamp && assets.loaded.stampOverlay) {
    ctx.save();
    ctx.globalAlpha = parseFloat(state.stampOpacity);
    ctx.drawImage(
      assets.stampOverlay,
      615 * sx,
      610 * sy,
      305 * sx,
      305 * sy
    );
    ctx.restore();
  }

  // 4. Draw Employee Signature (disabled per user requirement)
  if (state.showEmployeeSign && assets.loaded.employeeSig && assets.employeeSig.naturalWidth > 0) {
    ctx.save();
    const sigX = 130 * sx;
    const sigY = 1230 * sy;
    const sigW = 270 * sx;
    const sigH = 110 * sy;
    ctx.drawImage(assets.employeeSig, sigX, sigY, sigW, sigH);
    ctx.restore();
  }

  // 5. Draw Dynamic Text Fields
  ctx.save();
  const fontPt = Math.round(state.fontSize * sx);
  ctx.font = `${state.fontWeight} ${fontPt}px ${state.fontFamily}`;
  ctx.fillStyle = state.textColor;
  ctx.textBaseline = "middle";

  // Name
  if (state.name) {
    ctx.fillText(state.name, state.offsets.name_x * sx, state.offsets.name_y * sy);
  }

  // Date of Birth
  if (state.dob) {
    ctx.fillText(state.dob, state.offsets.dob_x * sx, state.offsets.dob_y * sy);
  }

  // Designation
  if (state.designation) {
    ctx.fillText(state.designation, state.offsets.desig_x * sx, state.offsets.desig_y * sy);
  }

  // Office
  if (state.office) {
    ctx.fillText(state.office, state.offsets.office_x * sx, state.offsets.office_y * sy);
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Render Back Card to any target canvas & context at arbitrary scale
 */
function renderBackToContext(ctx, width, height, scale = 1.0) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const sx = (width / 1024) * scale;
  const sy = (height / 1535) * scale;

  // 1. Draw base template background
  if (assets.loaded.backTemplate) {
    ctx.drawImage(assets.backTemplate, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Dynamic Text Fields
  ctx.save();
  const fontPt = Math.round(state.fontSize * sx);
  ctx.font = `${state.fontWeight} ${fontPt}px ${state.fontFamily}`;
  ctx.fillStyle = state.textColor;
  ctx.textBaseline = "middle";

  // Address Line 1
  if (state.addressLine1) {
    ctx.fillText(state.addressLine1, state.offsets.addr1_x * sx, state.offsets.addr1_y * sy);
  }

  // Address Line 2
  if (state.addressLine2) {
    ctx.fillText(state.addressLine2, state.offsets.addr2_x * sx, state.offsets.addr2_y * sy);
  }

  // Shalarth ID
  if (state.shalarthId) {
    ctx.save();
    ctx.font = `bold ${fontPt}px ${state.fontFamily}`;
    ctx.fillText(state.shalarthId.toUpperCase(), state.offsets.shalarth_x * sx, state.offsets.shalarth_y * sy);
    ctx.restore();
  }

  // Mobile Number
  if (state.mobileNo) {
    ctx.fillText(state.mobileNo, state.offsets.mobile_x * sx, state.offsets.mobile_y * sy);
  }

  // Email ID
  if (state.email) {
    ctx.fillText(state.email, state.offsets.email_x * sx, state.offsets.email_y * sy);
  }

  ctx.restore();
  ctx.restore();
}

// Master Render Function
function renderAll() {
  const W = 1024;
  const H = 1535;

  // Render Front Canvas
  if (frontCanvas && frontCtx) {
    renderFrontToContext(frontCtx, W, H);
  }
  // Render Back Canvas
  if (backCanvas && backCtx) {
    renderBackToContext(backCtx, W, H);
  }
  // Render 3D Flip Canvases
  if (flipFrontCanvas && flipFrontCtx) {
    renderFrontToContext(flipFrontCtx, W, H);
  }
  if (flipBackCanvas && flipBackCtx) {
    renderBackToContext(flipBackCtx, W, H);
  }

  // Update print sheet images if ready
  updatePrintSheet();
}

// Update the hidden print sheet images with fresh Ultra-HD canvas data
function updatePrintSheet() {
  const printFrontImg = document.getElementById("printFrontImg");
  const printBackImg = document.getElementById("printBackImg");
  if (!printFrontImg || !printBackImg) return;

  const W = 1024;
  const H = 1535;

  // Front HD
  const fC = document.createElement("canvas");
  fC.width = W;
  fC.height = H;
  const fCtx = fC.getContext("2d");
  renderFrontToContext(fCtx, W, H);
  printFrontImg.src = fC.toDataURL("image/png");

  // Back HD
  const bC = document.createElement("canvas");
  bC.width = W;
  bC.height = H;
  const bCtx = bC.getContext("2d");
  renderBackToContext(bCtx, W, H);
  printBackImg.src = bC.toDataURL("image/png");
}

// ============================================================================
// FORM INPUT BINDINGS
// ============================================================================
function initFormInputs() {
  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  // Front fields
  bindInput("employeeName", "name");
  bindInput("dob", "dob");
  bindInput("designation", "designation");
  bindInput("office", "office");

  // Back fields
  bindInput("addressLine1", "addressLine1");
  bindInput("addressLine2", "addressLine2");
  bindInput("shalarthId", "shalarthId");
  bindInput("mobileNo", "mobileNo");
  bindInput("email", "email");

  // Typography controls
  const fontFamilySelect = document.getElementById("fontFamilySelect");
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", (e) => {
      state.fontFamily = e.target.value;
      renderAll();
      saveState();
    });
  }

  const fontWeightSelect = document.getElementById("fontWeightSelect");
  if (fontWeightSelect) {
    fontWeightSelect.addEventListener("change", (e) => {
      state.fontWeight = e.target.value;
      renderAll();
      saveState();
    });
  }

  const textColorInput = document.getElementById("textColor");
  if (textColorInput) {
    textColorInput.addEventListener("input", (e) => {
      state.textColor = e.target.value;
      renderAll();
      saveState();
    });
  }

  // Quick color presets
  document.querySelectorAll(".btn-color-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      state.textColor = color;
      if (textColorInput) textColorInput.value = color;
      renderAll();
      saveState();
    });
  });

  // Font size slider
  const globalFontSize = document.getElementById("globalFontSize");
  const fontSizeDisplay = document.getElementById("fontSizeDisplay");
  if (globalFontSize) {
    globalFontSize.addEventListener("input", (e) => {
      state.fontSize = parseFloat(e.target.value);
      if (fontSizeDisplay) fontSizeDisplay.textContent = `${state.fontSize}px`;
      renderAll();
      saveState();
    });
  }

  // Stamp toggle & opacity
  const toggleStamp = document.getElementById("toggleStamp");
  const stampOpacity = document.getElementById("stampOpacity");
  const stampOpacityRow = document.getElementById("stampOpacityRow");

  if (toggleStamp) {
    toggleStamp.addEventListener("change", (e) => {
      state.showStamp = e.target.checked;
      if (stampOpacityRow) stampOpacityRow.style.display = state.showStamp ? "flex" : "none";
      renderAll();
      saveState();
    });
  }

  if (stampOpacity) {
    stampOpacity.addEventListener("input", (e) => {
      state.stampOpacity = parseFloat(e.target.value);
      renderAll();
      saveState();
    });
  }

  // Fine-tune offset sliders (Front)
  bindOffsetSlider("offset_name_x", "name_x");
  bindOffsetSlider("offset_name_y", "name_y");
  bindOffsetSlider("offset_dob_x", "dob_x");
  bindOffsetSlider("offset_dob_y", "dob_y");
  bindOffsetSlider("offset_desig_x", "desig_x");
  bindOffsetSlider("offset_desig_y", "desig_y");
  bindOffsetSlider("offset_office_x", "office_x");
  bindOffsetSlider("offset_office_y", "office_y");

  // Fine-tune offset sliders (Back)
  bindOffsetSlider("offset_addr1_x", "addr1_x");
  bindOffsetSlider("offset_addr1_y", "addr1_y");
  bindOffsetSlider("offset_addr2_x", "addr2_x");
  bindOffsetSlider("offset_addr2_y", "addr2_y");
  bindOffsetSlider("offset_shalarth_x", "shalarth_x");
  bindOffsetSlider("offset_shalarth_y", "shalarth_y");
  bindOffsetSlider("offset_mobile_x", "mobile_x");
  bindOffsetSlider("offset_mobile_y", "mobile_y");
  bindOffsetSlider("offset_email_x", "email_x");
  bindOffsetSlider("offset_email_y", "email_y");

  // Reset offsets button
  const btnResetOffsets = document.getElementById("btnResetOffsets");
  if (btnResetOffsets) {
    btnResetOffsets.addEventListener("click", () => {
      state.offsets.name_x = 305;
      state.offsets.name_y = 928;
      state.offsets.dob_x = 435;
      state.offsets.dob_y = 1001;
      state.offsets.desig_x = 440;
      state.offsets.desig_y = 1079;
      state.offsets.office_x = 298;
      state.offsets.office_y = 1147;

      state.offsets.addr1_x = 395;
      state.offsets.addr1_y = 617;
      state.offsets.addr2_x = 415;
      state.offsets.addr2_y = 668;
      state.offsets.shalarth_x = 395;
      state.offsets.shalarth_y = 754;
      state.offsets.mobile_x = 305;
      state.offsets.mobile_y = 870;
      state.offsets.email_x = 222;
      state.offsets.email_y = 958;

      // Update all slider inputs in UI
      for (const [k, v] of Object.entries(state.offsets)) {
        const input = document.getElementById(`offset_${k}`);
        if (input) input.value = v;
      }

      renderAll();
      saveState();
      showToast("Offsets reset to defaults");
    });
  }

  // Header quick buttons
  document.getElementById("btnFillSample")?.addEventListener("click", () => {
    fillSampleData();
  });

  document.getElementById("btnClearForm")?.addEventListener("click", () => {
    clearFormData();
  });
}

function bindInput(elementId, stateKey) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.value = state[stateKey] || "";
  el.addEventListener("input", (e) => {
    state[stateKey] = e.target.value;
    renderAll();
    saveState();
  });
}

function bindOffsetSlider(elementId, offsetKey) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.value = state.offsets[offsetKey];
  el.addEventListener("input", (e) => {
    state.offsets[offsetKey] = parseFloat(e.target.value);
    renderAll();
    saveState();
  });
}

// ============================================================================
// PHOTO CONTROLS (UPLOAD, CROP, WEBCAM)
// ============================================================================
function initPhotoControls() {
  const photoInput = document.getElementById("photoInput");
  const btnUploadPhoto = document.getElementById("btnUploadPhoto");
  const photoDropArea = document.getElementById("photoDropArea");
  const btnRemovePhoto = document.getElementById("btnRemovePhoto");

  // Trigger file selection
  btnUploadPhoto?.addEventListener("click", () => photoInput?.click());
  photoDropArea?.addEventListener("click", () => photoInput?.click());

  // Handle file select
  photoInput?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      loadPhotoFile(e.target.files[0]);
    }
  });

  // Drag and drop photo
  if (photoDropArea) {
    photoDropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      photoDropArea.style.borderColor = "var(--primary-blue)";
    });
    photoDropArea.addEventListener("dragleave", () => {
      photoDropArea.style.borderColor = "";
    });
    photoDropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      photoDropArea.style.borderColor = "";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadPhotoFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Remove photo
  btnRemovePhoto?.addEventListener("click", () => {
    assets.employeePhoto = new Image();
    assets.loaded.employeePhoto = false;
    document.getElementById("photoPreviewImg").src = "";
    renderAll();
    showToast("Photo removed");
  });

  // Photo pan & zoom sliders
  const photoScale = document.getElementById("photoScale");
  const photoOffsetX = document.getElementById("photoOffsetX");
  const photoOffsetY = document.getElementById("photoOffsetY");

  photoScale?.addEventListener("input", (e) => {
    state.photoScale = parseFloat(e.target.value);
    renderAll();
  });

  photoOffsetX?.addEventListener("input", (e) => {
    state.photoOffsetX = parseFloat(e.target.value);
    renderAll();
  });

  photoOffsetY?.addEventListener("input", (e) => {
    state.photoOffsetY = parseFloat(e.target.value);
    renderAll();
  });
}

function loadPhotoFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.getElementById("photoPreviewImg").src = dataUrl;
    assets.employeePhoto = new Image();
    assets.employeePhoto.onload = () => {
      assets.loaded.employeePhoto = true;
      renderAll();
      showToast("Photo updated successfully!");
    };
    assets.employeePhoto.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// SIGNATURE PAD (DRAWING & FILE UPLOAD)
// ============================================================================
function initSignaturePad() {
  const canvas = sigCanvas;
  if (!canvas) return;

  // Toggle Draw vs Upload
  const sigModeBtns = document.querySelectorAll(".sig-mode-btn");
  const sigDrawContainer = document.getElementById("sigDrawContainer");
  const sigUploadContainer = document.getElementById("sigUploadContainer");

  sigModeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sigModeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-sig-mode");
      if (mode === "draw") {
        sigDrawContainer.style.display = "block";
        sigUploadContainer.style.display = "none";
      } else {
        sigDrawContainer.style.display = "none";
        sigUploadContainer.style.display = "block";
      }
    });
  });

  // Mouse / Touch drawing listeners
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
    if (e.cancelable) e.preventDefault();
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    if (e.cancelable) e.preventDefault();
  }

  function stopDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    sigCtx.closePath();
    commitSignatureFromCanvas();
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDraw);

  // Clear signature canvas
  document.getElementById("btnClearSig")?.addEventListener("click", () => {
    sigCtx.clearRect(0, 0, canvas.width, canvas.height);
    commitSignatureFromCanvas();
  });

  // Signature ink color dots
  document.querySelectorAll(".color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      sigColor = dot.getAttribute("data-color");
      sigCtx.strokeStyle = sigColor;
    });
  });

  // Signature file upload
  const sigInput = document.getElementById("sigInput");
  const btnUploadSigFile = document.getElementById("btnUploadSigFile");
  const sigDropArea = document.getElementById("sigDropArea");

  btnUploadSigFile?.addEventListener("click", () => sigInput?.click());
  sigDropArea?.addEventListener("click", () => sigInput?.click());

  sigInput?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      loadSignatureFile(e.target.files[0]);
    }
  });
}

function commitSignatureFromCanvas() {
  const dataUrl = sigCanvas.toDataURL("image/png");
  assets.employeeSig = new Image();
  assets.employeeSig.onload = () => {
    assets.loaded.employeeSig = true;
    renderAll();
  };
  assets.employeeSig.src = dataUrl;
}

function loadSignatureFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;
    const tempImg = new Image();
    tempImg.onload = () => {
      const removeBg = document.getElementById("removeSigBg")?.checked;
      let finalDataUrl = rawDataUrl;

      if (removeBg) {
        const c = document.createElement("canvas");
        c.width = tempImg.naturalWidth;
        c.height = tempImg.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(tempImg, 0, 0);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 215) {
            d[i + 3] = 0; // completely transparent paper background
          } else if (brightness > 155) {
            d[i + 3] = Math.round((215 - brightness) * (255 / 60)); // smooth edge fade
          }
        }
        ctx.putImageData(imgData, 0, 0);
        finalDataUrl = c.toDataURL("image/png");
      }

      document.getElementById("sigPreviewImg").src = finalDataUrl;
      assets.employeeSig = new Image();
      assets.employeeSig.onload = () => {
        assets.loaded.employeeSig = true;
        renderAll();
        showToast("Signature updated!");
      };
      assets.employeeSig.src = finalDataUrl;
    };
    tempImg.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// VIEW SWITCHERS (BOTH, FRONT, BACK, 3D FLIP)
// ============================================================================
function initViewSwitchers() {
  const viewBtns = document.querySelectorAll(".view-tab-btn");
  const viewBoth = document.getElementById("viewBoth");
  const flipContainer = document.getElementById("flipContainer");
  const flipCardInner = document.getElementById("flipCardInner");

  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.getAttribute("data-view");

      if (view === "flip") {
        viewBoth.style.display = "none";
        flipContainer.style.display = "flex";
      } else {
        flipContainer.style.display = "none";
        viewBoth.style.display = "flex";

        viewBoth.classList.remove("front-only", "back-only");
        if (view === "front") {
          viewBoth.classList.add("front-only");
        } else if (view === "back") {
          viewBoth.classList.add("back-only");
        }
      }
    });
  });

  // Flip card toggle on click
  flipCardInner?.addEventListener("click", () => {
    flipCardInner.classList.toggle("flipped");
  });
}

// ============================================================================
// WEBCAM CAMERA MODAL
// ============================================================================
function initWebcamModal() {
  const modal = document.getElementById("webcamModal");
  const video = document.getElementById("webcamVideo");
  const btnWebcam = document.getElementById("btnWebcam");
  const btnCloseCamera = document.getElementById("btnCloseCamera");
  const btnCancelCamera = document.getElementById("btnCancelCamera");
  const btnCaptureSnap = document.getElementById("btnCaptureSnap");

  btnWebcam?.addEventListener("click", async () => {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      video.srcObject = webcamStream;
      modal.classList.add("active");
    } catch (err) {
      alert("Unable to access camera. Please allow webcam permissions.");
    }
  });

  function closeCamera() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamStream = null;
    }
    modal.classList.remove("active");
  }

  btnCloseCamera?.addEventListener("click", closeCamera);
  btnCancelCamera?.addEventListener("click", closeCamera);

  btnCaptureSnap?.addEventListener("click", () => {
    if (!video.videoWidth) return;
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = 480;
    snapCanvas.height = 600;
    const sCtx = snapCanvas.getContext("2d");

    // Center crop from webcam feed
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropW = vh * (480 / 600);
    const startX = (vw - cropW) / 2;

    sCtx.drawImage(video, startX, 0, cropW, vh, 0, 0, 480, 600);
    const snapDataUrl = snapCanvas.toDataURL("image/jpeg", 0.95);

    document.getElementById("photoPreviewImg").src = snapDataUrl;
    assets.employeePhoto = new Image();
    assets.employeePhoto.onload = () => {
      assets.loaded.employeePhoto = true;
      renderAll();
      showToast("Photo captured from camera!");
    };
    assets.employeePhoto.src = snapDataUrl;

    closeCamera();
  });
}

// ============================================================================
// EXPORT & DOWNLOAD HANDLERS (ULTRA HD 3X SCALE)
// ============================================================================
function initExportHandlers() {
  // Download Front (3X Ultra HD)
  document.getElementById("btnDownloadFront")?.addEventListener("click", () => {
    downloadCardSide("front");
  });

  // Download Back (3X Ultra HD)
  document.getElementById("btnDownloadBack")?.addEventListener("click", () => {
    downloadCardSide("back");
  });

  // Download Both Combined Side-by-Side
  document.getElementById("btnDownloadCombined")?.addEventListener("click", () => {
    downloadCombinedCards();
  });

  // Print Card
  document.getElementById("btnPrintCard")?.addEventListener("click", () => {
    updatePrintSheet();
    window.print();
  });
}

/**
 * High-Resolution scale exporter for single card side (1024x1535 Native HD)
 */
function downloadCardSide(side) {
  const W = 1024;
  const H = 1535;
  const hdCanvas = document.createElement("canvas");
  hdCanvas.width = W;
  hdCanvas.height = H;
  const hdCtx = hdCanvas.getContext("2d");

  let fileName = "";
  if (side === "front") {
    renderFrontToContext(hdCtx, W, H);
    fileName = `Maharashtra_Gov_ID_Front_${getSafeName()}.png`;
  } else {
    renderBackToContext(hdCtx, W, H);
    fileName = `Maharashtra_Gov_ID_Back_${getSafeName()}.png`;
  }

  triggerDownload(hdCanvas.toDataURL("image/png"), fileName);
  showToast(`${side.toUpperCase()} card downloaded in Ultra HD!`);
}

/**
 * High-Resolution Combined Front + Back side-by-side export
 */
function downloadCombinedCards() {
  const cardW = 1024;
  const cardH = 1535;
  const gap = 60;
  const padding = 60;

  const totalW = padding * 2 + cardW * 2 + gap;
  const totalH = padding * 2 + cardH;

  const combCanvas = document.createElement("canvas");
  combCanvas.width = totalW;
  combCanvas.height = totalH;
  const combCtx = combCanvas.getContext("2d");

  // Clean white canvas with subtle border
  combCtx.fillStyle = "#ffffff";
  combCtx.fillRect(0, 0, totalW, totalH);

  // Render Front Card
  combCtx.save();
  combCtx.translate(padding, padding);
  renderFrontToContext(combCtx, cardW, cardH);
  combCtx.restore();

  // Render Back Card
  combCtx.save();
  combCtx.translate(padding + cardW + gap, padding);
  renderBackToContext(combCtx, cardW, cardH);
  combCtx.restore();

  const fileName = `Maharashtra_Gov_ID_Combined_${getSafeName()}.png`;
  triggerDownload(combCanvas.toDataURL("image/png"), fileName);
  showToast("Combined Front & Back ID Card downloaded in Ultra HD!");
}

function triggerDownload(dataUrl, fileName) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getSafeName() {
  return (state.name || "Employee").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
}

// ============================================================================
// SAMPLE DATA & RESET
// ============================================================================
function fillSampleData() {
  state.name = "Shri. Sachin R. Shinde";
  state.dob = "12/04/1986";
  state.designation = "Sr. Assistant / वरिष्ठ सहाय्यक";
  state.office = "Panchayat Samiti Ambegaon";

  state.addressLine1 = "Bharadi (Niragudsar),";
  state.addressLine2 = "Tal.Ambegaon, Pune.";
  state.shalarthId = "02DEDRSKF8002";
  state.mobileNo = "9561772332";
  state.email = "rupalibangar2332@gmail.com";

  syncInputsFromState();

  // Reload default sample photo
  assets.employeePhoto.src = "assets/sample_photo.jpg";
  document.getElementById("photoPreviewImg").src = "assets/sample_photo.jpg";
  assets.employeeSig.src = "";
  if (sigCanvas && sigCtx) {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }

  renderAll();
  saveState();
  showToast("Sample data filled successfully!");
}

function clearFormData() {
  state.name = "";
  state.dob = "";
  state.designation = "";
  state.office = "";
  state.addressLine1 = "";
  state.addressLine2 = "";
  state.shalarthId = "";
  state.mobileNo = "";
  state.email = "";

  syncInputsFromState();

  // Clear signature canvas
  if (sigCanvas && sigCtx) {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }

  renderAll();
  saveState();
  showToast("Form cleared!");
}

function syncInputsFromState() {
  document.getElementById("employeeName").value = state.name;
  document.getElementById("dob").value = state.dob;
  document.getElementById("designation").value = state.designation;
  document.getElementById("office").value = state.office;
  document.getElementById("addressLine1").value = state.addressLine1;
  document.getElementById("addressLine2").value = state.addressLine2;
  document.getElementById("shalarthId").value = state.shalarthId;
  document.getElementById("mobileNo").value = state.mobileNo;
  document.getElementById("email").value = state.email;
}

// ============================================================================
// STORAGE & TOAST ALERTS
// ============================================================================
function saveState() {
  try {
    const dataToSave = {
      name: state.name,
      dob: state.dob,
      designation: state.designation,
      office: state.office,
      addressLine1: state.addressLine1,
      addressLine2: state.addressLine2,
      shalarthId: state.shalarthId,
      mobileNo: state.mobileNo,
      email: state.email,
      fontFamily: state.fontFamily,
      fontWeight: state.fontWeight,
      fontSize: state.fontSize,
      textColor: state.textColor,
      showStamp: state.showStamp,
      stampOpacity: state.stampOpacity,
      offsets: state.offsets
    };
    localStorage.setItem("maha_gov_id_card_data", JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

function restoreSavedData() {
  try {
    const raw = localStorage.getItem("maha_gov_id_card_data");
    if (raw) {
      const data = JSON.parse(raw);
      // If cached data is from old low-resolution version or old address offset or sample, purge it completely!
      if (!data.offsets || data.offsets.name_x < 200 || (data.fontSize && data.fontSize < 20) || data.offsets.addr1_y < 610 || data.offsets.addr2_x < 350 || (data.addressLine1 && data.addressLine1.includes("Ghodegaon"))) {
        localStorage.removeItem("maha_gov_id_card_data");
        syncInputsFromState();
        renderAll();
        return;
      }
      Object.assign(state, data);
      state.showEmployeeSign = false;
      syncInputsFromState();

      if (state.textColor) {
        document.getElementById("textColor").value = state.textColor;
      }
      if (state.fontSize) {
        document.getElementById("globalFontSize").value = state.fontSize;
        document.getElementById("fontSizeDisplay").textContent = `${state.fontSize}px`;
      }
      if (data.fontFamily) {
        document.getElementById("fontFamilySelect").value = data.fontFamily;
      }
      if (data.fontWeight) {
        document.getElementById("fontWeightSelect").value = data.fontWeight;
      }
      if (typeof data.showStamp === "boolean") {
        document.getElementById("toggleStamp").checked = data.showStamp;
      }
      if (data.stampOpacity) {
        document.getElementById("stampOpacity").value = data.stampOpacity;
      }

      // Restore offset sliders
      if (data.offsets) {
        for (const [k, v] of Object.entries(data.offsets)) {
          const input = document.getElementById(`offset_${k}`);
          if (input) input.value = v;
        }
      }

      renderAll();
    }
  } catch (e) {
    console.error("Failed to load saved state:", e);
  }
}

function showToast(message, type = "normal") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
