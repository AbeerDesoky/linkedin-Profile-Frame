document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  const dropZone = document.getElementById('drop-zone');
  const photoInput = document.getElementById('photo-input');
  const zoomSlider = document.getElementById('zoom-slider');
  const rotateSlider = document.getElementById('rotate-slider');
  const resetBtn = document.getElementById('reset-btn');
  const downloadBtn = document.getElementById('download-btn');

  // State Variables
  let userImage = null;
  let assetFrameImage = new Image();
  let isFrameLoaded = false;

  // Preload the single frame image asset from the asset folder
  assetFrameImage.src = 'assets/frame.png';
  assetFrameImage.onload = () => {
    isFrameLoaded = true;
    drawCanvas();
  };

  // Photo Transformation State
  let scale = 1;
  let rotationDeg = 0;
  let offsetX = 0;
  let offsetY = 0;

  // Dragging State
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  drawCanvas();

  // --- Event Listeners ---

  dropZone.addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadUserImage(e.target.files[0]);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadUserImage(e.dataTransfer.files[0]);
    }
  });

  zoomSlider.addEventListener('input', (e) => {
    scale = parseFloat(e.target.value);
    drawCanvas();
  });

  rotateSlider.addEventListener('input', (e) => {
    rotationDeg = parseInt(e.target.value, 10);
    drawCanvas();
  });

  resetBtn.addEventListener('click', resetTransformations);

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', startDrag, { passive: false });
  canvas.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', endDrag);

  downloadBtn.addEventListener('click', downloadProfilePhoto);

  // --- Core Functions ---

  function loadUserImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        userImage = img;
        resetTransformations();
        enableControls();
        drawCanvas();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetTransformations() {
    scale = 1;
    rotationDeg = 0;
    offsetX = 0;
    offsetY = 0;
    zoomSlider.value = 1;
    rotateSlider.value = 0;
    drawCanvas();
  }

  function enableControls() {
    zoomSlider.disabled = false;
    rotateSlider.disabled = false;
    resetBtn.disabled = false;
    downloadBtn.disabled = false;
  }

  function startDrag(e) {
    if (!userImage) return;
    isDragging = true;
    const pos = getEventPos(e);
    startX = pos.x - offsetX;
    startY = pos.y - offsetY;
  }

  function drag(e) {
    if (!isDragging || !userImage) return;
    e.preventDefault();
    const pos = getEventPos(e);
    offsetX = pos.x - startX;
    offsetY = pos.y - startY;
    drawCanvas();
  }

  function endDrag() {
    isDragging = false;
  }

  function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Canvas Drawing Pipeline
  function drawCanvas() {
    const size = canvas.width; // 800px
    const center = size / 2;
    const photoRadius = size * 0.42; // Keeps user photo strictly rounded inside the frame boundary

    // Clear Canvas
    ctx.clearRect(0, 0, size, size);

    // 1. Draw User Photo inside a circular clipping mask
    if (userImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, photoRadius, 0, Math.PI * 2, true);
      ctx.clip();

      ctx.translate(center + offsetX, center + offsetY);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.scale(scale, scale);

      const aspect = userImage.width / userImage.height;
      let drawW = size;
      let drawH = size;

      if (aspect > 1) {
        drawW = size * aspect;
      } else {
        drawH = size / aspect;
      }

      ctx.drawImage(userImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, photoRadius, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#64748b';
      ctx.font = '28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a photo to preview', center, center);
      ctx.restore();
    }

    // 2. Draw the single frame asset overlay on top
    if (isFrameLoaded) {
      ctx.drawImage(assetFrameImage, 0, 0, size, size);
    }
  }

  function downloadProfilePhoto() {
    if (!userImage) return;

    const link = document.createElement('a');
    link.download = 'linkedin-profile-photo.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  }
});