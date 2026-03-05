"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { EcosystemData, EcosystemNode } from "@/lib/ecosystem-types";
import {
  CATEGORY_COLORS,
  createIslandMesh,
  createBuildings,
  createCar,
  createOcean,
  createSkybox,
  createWorldLabel,
  createIslandLabel,
  createBuildingLabel,
} from "@/lib/world-builder";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface IslandData {
  group: THREE.Group;
  node: EcosystemNode;
  position: THREE.Vector3;
  radius: number;
  buildings: THREE.Mesh[];
}

interface CarData {
  mesh: THREE.Group;
  node: EcosystemNode;
  fromIsland: number;
  toIsland: number;
  progress: number;
  speed: number;
}

export default function ElizaWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const islandsRef = useRef<IslandData[]>([]);
  const carsRef = useRef<CarData[]>([]);
  const frameRef = useRef<number>(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<EcosystemNode | null>(null);

  const { data } = useSWR<EcosystemData>("/api/ecosystem", fetcher, {
    revalidateOnFocus: false,
  });

  const buildWorld = useCallback(
    (ecosystemData: EcosystemData) => {
      if (!containerRef.current) return;

      // Clean up previous
      if (rendererRef.current) {
        rendererRef.current.dispose();
        cancelAnimationFrame(frameRef.current);
      }

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Scene
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x060612, 0.0015);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
      camera.position.set(0, 120, 200);
      cameraRef.current = camera;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 30;
      controls.maxDistance = 600;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      // Skybox
      scene.add(createSkybox());

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
      sunLight.position.set(100, 200, 150);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 500;
      sunLight.shadow.camera.left = -200;
      sunLight.shadow.camera.right = 200;
      sunLight.shadow.camera.top = 200;
      sunLight.shadow.camera.bottom = -200;
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0x3366ff, 0.3);
      fillLight.position.set(-100, 50, -100);
      scene.add(fillLight);

      const rimLight = new THREE.PointLight(0x22d3ee, 0.8, 500);
      rimLight.position.set(0, 100, -200);
      scene.add(rimLight);

      // Ocean
      scene.add(createOcean());

      // Separate repos into core repos (cities/islands) and plugins (cars)
      const coreRepos = ecosystemData.nodes.filter(
        (n) => n.category !== "plugin"
      );
      const pluginRepos = ecosystemData.nodes.filter(
        (n) => n.category === "plugin"
      );

      // Position islands in a spiral layout
      const islands: IslandData[] = [];
      const islandCount = coreRepos.length;

      coreRepos.forEach((node, i) => {
        const angle = (i / islandCount) * Math.PI * 2 + (i * 0.3);
        const ringRadius =
          node.category === "core"
            ? 0
            : 60 + (i / islandCount) * 100;

        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;
        const islandRadius = Math.max(
          8,
          Math.log2(node.stars + 1) * 3
        );

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Create island terrain
        const island = createIslandMesh(islandRadius, node.category);
        group.add(island);

        // Create buildings (projects) on the island
        const buildingCount = Math.max(
          2,
          Math.min(12, Math.floor(Math.log2(node.stars + 1) * 1.5))
        );
        const buildings = createBuildings(
          islandRadius,
          buildingCount,
          node
        );
        buildings.forEach((b) => group.add(b));

        // Island label
        const label = createIslandLabel(node.name, islandRadius);
        group.add(label);

        scene.add(group);
        islands.push({
          group,
          node,
          position: new THREE.Vector3(x, 0, z),
          radius: islandRadius,
          buildings,
        });
      });

      islandsRef.current = islands;

      // Create cars (plugins) that travel between islands
      const cars: CarData[] = [];
      pluginRepos.forEach((node, i) => {
        const fromIdx = i % islands.length;
        const toIdx = (i + 1 + Math.floor(i / islands.length)) % islands.length;
        const car = createCar(node);
        scene.add(car);
        cars.push({
          mesh: car,
          node,
          fromIsland: fromIdx,
          toIsland: toIdx,
          progress: Math.random(),
          speed: 0.001 + Math.random() * 0.002,
        });
      });
      carsRef.current = cars;

      // World title
      const worldLabel = createWorldLabel("elizaOS");
      scene.add(worldLabel);

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Animate cars along paths between islands
        cars.forEach((car) => {
          car.progress += car.speed;
          if (car.progress >= 1) {
            car.progress = 0;
            car.fromIsland = car.toIsland;
            car.toIsland =
              (car.toIsland + 1 + Math.floor(Math.random() * 3)) %
              islands.length;
          }

          const from = islands[car.fromIsland].position;
          const to = islands[car.toIsland].position;
          const t = car.progress;

          // Arc path
          const midY = 2 + from.distanceTo(to) * 0.03;
          const x = from.x + (to.x - from.x) * t;
          const z = from.z + (to.z - from.z) * t;
          const y = midY * Math.sin(t * Math.PI) + 0.5;

          car.mesh.position.set(x, y, z);

          // Face direction of travel
          const nextT = Math.min(t + 0.01, 1);
          const nextX = from.x + (to.x - from.x) * nextT;
          const nextZ = from.z + (to.z - from.z) * nextT;
          car.mesh.lookAt(nextX, y, nextZ);
        });

        // Gentle bob for islands
        islands.forEach((island, i) => {
          island.group.position.y =
            Math.sin(elapsed * 0.3 + i * 0.7) * 0.3;
        });

        // Water animation (handled in shader)
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Resize handler
      const onResize = () => {
        const nw = window.innerWidth;
        const nh = window.innerHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(frameRef.current);
        renderer.dispose();
      };
    },
    []
  );

  useEffect(() => {
    if (data) {
      const cleanup = buildWorld(data);
      return () => cleanup?.();
    }
  }, [data, buildWorld]);

  // Mouse hover detection
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!cameraRef.current || !sceneRef.current) return;
      raycasterRef.current.setFromCamera(
        mouseRef.current,
        cameraRef.current
      );

      // Check islands
      const allMeshes: THREE.Object3D[] = [];
      islandsRef.current.forEach((isl) => {
        isl.group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) allMeshes.push(child);
        });
      });

      const intersects = raycasterRef.current.intersectObjects(
        allMeshes,
        false
      );
      if (intersects.length > 0) {
        // Find which island this belongs to
        const hit = intersects[0].object;
        for (const isl of islandsRef.current) {
          let found = false;
          isl.group.traverse((child) => {
            if (child === hit) found = true;
          });
          if (found) {
            setHoveredName(isl.node.name);
            document.body.style.cursor = "pointer";
            return;
          }
        }
      }

      setHoveredName(null);
      document.body.style.cursor = "default";
    };

    const onClick = (e: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return;

      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);

      const allMeshes: THREE.Object3D[] = [];
      islandsRef.current.forEach((isl) => {
        isl.group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) allMeshes.push(child);
        });
      });

      const intersects = raycasterRef.current.intersectObjects(
        allMeshes,
        false
      );
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        for (const isl of islandsRef.current) {
          let found = false;
          isl.group.traverse((child) => {
            if (child === hit) found = true;
          });
          if (found) {
            setSelectedNode(isl.node);
            // Fly camera to island
            if (controlsRef.current && cameraRef.current) {
              const target = isl.position.clone();
              controlsRef.current.target.copy(target);
              cameraRef.current.position.set(
                target.x + 20,
                30,
                target.z + 20
              );
            }
            return;
          }
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold text-accent drop-shadow-lg">
          elizaOS World
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Repos = Islands/Cities | Projects = Buildings | Plugins = Cars
        </p>
      </div>

      {/* Back to graph link */}
      <Link
        href="/"
        className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg border border-border bg-card/80 backdrop-blur text-xs text-foreground hover:border-accent/50 transition-colors"
      >
        Back to Graph
      </Link>

      {/* Hover tooltip */}
      {hoveredName && (
        <div className="absolute top-16 left-4 z-10 px-3 py-2 rounded-lg bg-card/90 border border-border backdrop-blur text-sm text-foreground pointer-events-none">
          {hoveredName}
        </div>
      )}

      {/* Selected node panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 max-w-sm p-4 rounded-xl bg-card/90 border border-border backdrop-blur animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedNode.name}
              </h2>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor:
                    CATEGORY_COLORS[selectedNode.category] + "22",
                  color: CATEGORY_COLORS[selectedNode.category],
                }}
              >
                {selectedNode.category}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
            >
              x
            </button>
          </div>
          {selectedNode.description && (
            <p className="text-xs text-muted-foreground mt-2">
              {selectedNode.description}
            </p>
          )}
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>Stars: {selectedNode.stars.toLocaleString()}</span>
            <span>Forks: {selectedNode.forks.toLocaleString()}</span>
            <span>Issues: {selectedNode.openIssues}</span>
          </div>
          {selectedNode.language && (
            <p className="text-xs text-muted-foreground mt-1">
              Language: {selectedNode.language}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 p-3 rounded-xl bg-card/80 border border-border backdrop-blur text-[10px] text-muted-foreground space-y-1">
        <p>Scroll to zoom. Drag to orbit.</p>
        <p>Click an island for details.</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: color }}
              />
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
