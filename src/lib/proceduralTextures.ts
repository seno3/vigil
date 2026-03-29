import * as THREE from 'three';

/** Aggregate asphalt: dark base, noise, faint wear — tileable */
export function createAsphaltTextures(): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n =
        Math.sin(x * 0.21) * Math.cos(y * 0.17) * 0.04 +
        Math.sin(x * 0.05 + y * 0.07) * 0.06 +
        (Math.random() - 0.5) * 0.08;
      const base = 0.22 + n;
      const r = base * 255;
      const g = base * 0.98 * 255;
      const b = base * 0.95 * 255;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(255,220,120,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1);
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;

  const rough = document.createElement('canvas');
  rough.width = rough.height = 256;
  const rctx = rough.getContext('2d')!;
  const rimg = rctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const v = 160 + Math.sin(x * 0.4) * 25 + (Math.random() - 0.5) * 40;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = Math.min(255, v);
      rimg.data[i + 3] = 255;
    }
  }
  rctx.putImageData(rimg, 0, 0);
  const roughnessMap = new THREE.CanvasTexture(rough);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 3);

  return { map, roughnessMap };
}

/** Curb / shoulder: darker rough asphalt */
export function createRoadEdgeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1a1d22';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Water color + normal-style ripples (canvas normal approx) */
export function createWaterTextures(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createLinearGradient(0, 0, size, size);
  grd.addColorStop(0, '#0c3d52');
  grd.addColorStop(0.5, '#1a5c72');
  grd.addColorStop(1, '#0e4a5c');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const w =
        Math.sin(x * 0.08 + y * 0.06) * 12 +
        Math.sin(x * 0.15 - y * 0.11) * 8;
      ctx.fillStyle = `rgba(120,200,220,${0.04 + Math.abs(w) * 0.002})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  // Normal-ish: encode ripples as RGB (Three.js expects tangent-space normals)
  const ncanvas = document.createElement('canvas');
  ncanvas.width = ncanvas.height = size;
  const nctx = ncanvas.getContext('2d')!;
  const nimg = nctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = Math.sin(x * 0.12) * Math.cos(y * 0.09) * 0.5 + 0.5;
      const ny = Math.cos(x * 0.07 + y * 0.14) * 0.5 + 0.5;
      nimg.data[i] = nx * 255;
      nimg.data[i + 1] = ny * 255;
      nimg.data[i + 2] = 200 + Math.sin(x * 0.2) * 40;
      nimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  const normalMap = new THREE.CanvasTexture(ncanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(4, 4);

  return { map, normalMap };
}

/** Murkier, greener — flowing rivers */
export function createRiverWaterTextures(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createLinearGradient(0, 0, 0, size);
  grd.addColorStop(0, '#0a3d35');
  grd.addColorStop(0.4, '#14524a');
  grd.addColorStop(1, '#0c2f2a');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = Math.sin(x * 0.14 + y * 0.11) * 0.03;
      ctx.fillStyle = `rgba(160,220,200,${0.03 + Math.abs(n)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 3);
  map.colorSpace = THREE.SRGBColorSpace;

  const ncanvas = document.createElement('canvas');
  ncanvas.width = ncanvas.height = size;
  const nctx = ncanvas.getContext('2d')!;
  const nimg = nctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = Math.sin(x * 0.18 + y * 0.22) * 0.5 + 0.5;
      const ny = Math.cos(x * 0.11 - y * 0.19) * 0.5 + 0.5;
      nimg.data[i] = nx * 255;
      nimg.data[i + 1] = ny * 255;
      nimg.data[i + 2] = 210;
      nimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  const normalMap = new THREE.CanvasTexture(ncanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(6, 6);

  return { map, normalMap };
}

/** Deep open water — coast / ocean */
export function createOceanWaterTextures(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.7);
  grd.addColorStop(0, '#062a42');
  grd.addColorStop(0.5, '#0a4a62');
  grd.addColorStop(1, '#031c2e');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const w =
        Math.sin(x * 0.04 + y * 0.035) * 18 +
        Math.sin(x * 0.09 - y * 0.07) * 10;
      ctx.fillStyle = `rgba(140,210,235,${0.05 + Math.abs(w) * 0.0015})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1.2, 1.2);
  map.colorSpace = THREE.SRGBColorSpace;

  const ncanvas = document.createElement('canvas');
  ncanvas.width = ncanvas.height = size;
  const nctx = ncanvas.getContext('2d')!;
  const nimg = nctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = Math.sin(x * 0.06 + y * 0.05) * 0.5 + 0.5;
      const ny = Math.cos(x * 0.045 - y * 0.055) * 0.5 + 0.5;
      nimg.data[i] = nx * 255;
      nimg.data[i + 1] = ny * 255;
      nimg.data[i + 2] = 185 + Math.sin(x * 0.08) * 25;
      nimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  const normalMap = new THREE.CanvasTexture(ncanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2.5, 2.5);

  return { map, normalMap };
}
