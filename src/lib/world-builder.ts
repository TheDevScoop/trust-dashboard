import * as THREE from "three";
import type { EcosystemNode, NodeCategory } from "./ecosystem-types";

// ── Colors ──────────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  core: "#22d3ee",
  "official-tool": "#3b82f6",
  plugin: "#a78bfa",
  community: "#34d399",
  documentation: "#fbbf24",
  game: "#f472b6",
  adapter: "#fb923c",
  client: "#38bdf8",
  infrastructure: "#94a3b8",
  "community-plugin": "#6ee7b7",
};

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// ── Seeded random for deterministic layouts ─────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Island (repo) ───────────────────────────────────────────────────
export function createIslandMesh(
  radius: number,
  category: NodeCategory
): THREE.Group {
  const group = new THREE.Group();
  const color = hexToThreeColor(CATEGORY_COLORS[category]);

  // Main island body — a flattened, irregular cylinder
  const islandGeo = new THREE.CylinderGeometry(
    radius,
    radius * 1.2,
    3,
    24,
    4,
    false
  );

  // Deform vertices for organic look
  const posAttr = islandGeo.getAttribute("position");
  const rng = seededRandom(radius * 1000);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    const noise = rng() * 0.3 - 0.15;
    if (dist > radius * 0.3) {
      posAttr.setX(i, x + noise * 2);
      posAttr.setZ(i, z + noise * 2);
    }
    // Push top vertices up slightly in center
    if (y > 0) {
      const centerFactor = 1 - dist / (radius * 1.2);
      posAttr.setY(i, y + centerFactor * 1.5);
    }
  }
  islandGeo.computeVertexNormals();

  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a2a,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = -1.5;
  island.castShadow = true;
  island.receiveShadow = true;
  group.add(island);

  // Underwater base
  const baseGeo = new THREE.ConeGeometry(radius * 1.3, 8, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a15,
    roughness: 0.9,
    flatShading: true,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -6;
  base.rotation.x = Math.PI;
  group.add(base);

  // Glowing ring at shoreline
  const ringGeo = new THREE.TorusGeometry(radius * 1.05, 0.15, 8, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.2;
  group.add(ring);

  // Grass patches on top
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = radius * 0.4 * (0.3 + rng() * 0.7);
    const grassGeo = new THREE.SphereGeometry(
      0.5 + rng() * 0.8,
      6,
      4,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a3a,
      roughness: 0.9,
      flatShading: true,
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.set(
      Math.cos(angle) * dist,
      0.6,
      Math.sin(angle) * dist
    );
    grass.castShadow = true;
    group.add(grass);
  }

  return group;
}

// ── Buildings (projects within a repo/city) ─────────────────────────
export function createBuildings(
  islandRadius: number,
  count: number,
  node: EcosystemNode
): THREE.Mesh[] {
  const buildings: THREE.Mesh[] = [];
  const color = hexToThreeColor(CATEGORY_COLORS[node.category]);
  const rng = seededRandom(node.name.length * 100 + node.stars);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
    const dist = islandRadius * (0.15 + rng() * 0.55);

    const bWidth = 0.6 + rng() * 1.2;
    const bDepth = 0.6 + rng() * 1.2;
    const bHeight = 1.5 + rng() * 5;

    // Taller buildings for higher-star repos
    const starBonus = Math.log2(node.stars + 1) * 0.5;

    const geo = new THREE.BoxGeometry(
      bWidth,
      bHeight + starBonus,
      bDepth
    );

    // Darken lower part of buildings
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().lerpColors(
        new THREE.Color(0x1a1a2e),
        color,
        0.3 + rng() * 0.4
      ),
      roughness: 0.6,
      metalness: 0.3,
      emissive: color,
      emissiveIntensity: 0.05 + rng() * 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      Math.cos(angle) * dist,
      (bHeight + starBonus) / 2 + 0.5,
      Math.sin(angle) * dist
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Slight random rotation
    mesh.rotation.y = rng() * Math.PI * 0.25;

    buildings.push(mesh);

    // Window lights — small emissive boxes on building faces
    const windowRows = Math.floor((bHeight + starBonus) / 1.2);
    for (let row = 0; row < windowRows; row++) {
      for (let side = 0; side < 2; side++) {
        if (rng() > 0.5) continue; // Some windows are dark
        const winGeo = new THREE.BoxGeometry(0.15, 0.2, 0.02);
        const winMat = new THREE.MeshStandardMaterial({
          color: 0xffeebb,
          emissive: 0xffeebb,
          emissiveIntensity: 0.8,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        const winAngle = angle + (side === 0 ? 0.1 : -0.1);
        win.position.set(
          mesh.position.x + (side === 0 ? bWidth / 2 + 0.01 : -bWidth / 2 - 0.01),
          0.8 + row * 1.2,
          mesh.position.z
        );
        buildings.push(win);
      }
    }
  }

  // Central tower for core repos
  if (node.category === "core") {
    const towerHeight = 10 + Math.log2(node.stars + 1) * 2;
    const towerGeo = new THREE.CylinderGeometry(0.8, 1.2, towerHeight, 8);
    const towerMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, towerHeight / 2 + 0.5, 0);
    tower.castShadow = true;
    buildings.push(tower);

    // Beacon on top
    const beaconGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, towerHeight + 1.2, 0);
    buildings.push(beacon);
  }

  return buildings;
}

// ── Car (plugin) ────────────────────────────────────────────────────
export function createCar(node: EcosystemNode): THREE.Group {
  const group = new THREE.Group();
  const color = hexToThreeColor(
    CATEGORY_COLORS[node.category] || CATEGORY_COLORS.plugin
  );

  // Car body
  const bodyGeo = new THREE.BoxGeometry(0.8, 0.35, 0.45);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.5,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.2;
  group.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(0.4, 0.25, 0.4);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x88ccff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-0.05, 0.5, 0);
  group.add(cabin);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
  });
  const offsets = [
    [0.25, 0.08, 0.25],
    [0.25, 0.08, -0.25],
    [-0.25, 0.08, 0.25],
    [-0.25, 0.08, -0.25],
  ];
  offsets.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, y, z);
    wheel.rotation.x = Math.PI / 2;
    group.add(wheel);
  });

  // Headlights
  const lightGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: 0xffffaa,
    emissiveIntensity: 1.0,
  });
  [0.15, -0.15].forEach((z) => {
    const hl = new THREE.Mesh(lightGeo, lightMat);
    hl.position.set(0.42, 0.22, z);
    group.add(hl);
  });

  // Trail light
  const trailGeo = new THREE.PointLight(color.getHex(), 0.5, 3);
  trailGeo.position.set(-0.4, 0.2, 0);
  group.add(trailGeo);

  group.scale.setScalar(1.5);
  return group;
}

// ── Ocean ───────────────────────────────────────────────────────────
export function createOcean(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1000, 1000, 128, 128);

  // Gentle wave deformation
  const posAttr = geo.getAttribute("position");
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    posAttr.setZ(
      i,
      Math.sin(x * 0.05) * 0.3 + Math.cos(y * 0.07) * 0.2
    );
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x061428,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 0.5,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Skybox (star field) ─────────────────────────────────────────────
export function createSkybox(): THREE.Points {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 500 + Math.random() * 300;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // Keep stars above horizon
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const brightness = 0.5 + Math.random() * 0.5;
    const tint = Math.random();
    colors[i * 3] = brightness * (tint > 0.8 ? 0.8 : 1);
    colors[i * 3 + 1] = brightness * (tint > 0.9 ? 0.7 : 1);
    colors[i * 3 + 2] = brightness;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

// ── Labels (using canvas textures → sprites) ───────────────────────
function makeTextSprite(
  text: string,
  fontSize: number,
  color: string,
  bgColor?: string
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = 512;
  canvas.height = 128;

  if (bgColor) {
    ctx.fillStyle = bgColor;
    const textWidth = ctx.measureText(text).width;
    const padding = 20;
    ctx.beginPath();
    ctx.roundRect(
      256 - textWidth / 2 - padding,
      32,
      textWidth + padding * 2,
      64,
      8
    );
    ctx.fill();
  }

  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(fontSize * 0.4, fontSize * 0.1, 1);
  return sprite;
}

export function createWorldLabel(text: string): THREE.Sprite {
  const sprite = makeTextSprite(text, 72, "#22d3ee");
  sprite.position.set(0, 50, 0);
  sprite.scale.set(40, 10, 1);
  return sprite;
}

export function createIslandLabel(
  text: string,
  islandRadius: number
): THREE.Sprite {
  const sprite = makeTextSprite(text, 48, "#e2e8f0");
  sprite.position.set(0, 8 + islandRadius * 0.3, 0);
  sprite.scale.set(islandRadius * 1.5, islandRadius * 0.375, 1);
  return sprite;
}

export function createBuildingLabel(text: string): THREE.Sprite {
  const sprite = makeTextSprite(text, 36, "#fbbf24");
  sprite.position.set(0, 2, 0);
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}
