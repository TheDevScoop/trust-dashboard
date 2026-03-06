"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import type { EcosystemNode, EcosystemData } from "@/lib/ecosystem-types";

const CATEGORY_COLORS: Record<string, string> = {
  core: "#fbbf24",
  "official-tool": "#06b6d4",
  plugin: "#a855f7",
  community: "#22c55e",
  documentation: "#f97316",
};

interface GalaxyViewProps {
  data: EcosystemData;
  onNodeClick: (node: EcosystemNode) => void;
  searchQuery: string;
  activeCategories: Set<string>;
}

// Star/Planet node component
function CelestialBody({
  node,
  position,
  onClick,
  isHighlighted,
  isFiltered,
}: {
  node: EcosystemNode;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
  isFiltered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const color = CATEGORY_COLORS[node.category] || "#ffffff";
  const isCore = node.category === "core";
  
  // Size based on stars (log scale)
  const baseSize = isCore ? 2 : 0.3 + Math.log10(Math.max(node.stars, 1) + 1) * 0.4;
  const size = Math.min(baseSize, isCore ? 2 : 1.2);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing for core
      if (isCore) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(size * pulse);
      }
      
      // Hover effect
      if (hovered && !isCore) {
        meshRef.current.scale.lerp(new THREE.Vector3(size * 1.3, size * 1.3, size * 1.3), 0.1);
      } else if (!isCore) {
        meshRef.current.scale.lerp(new THREE.Vector3(size, size, size), 0.1);
      }
    }
    
    // Glow animation
    if (glowRef.current && isCore) {
      const glowPulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      glowRef.current.scale.setScalar(size * 2.5 * glowPulse);
    }
  });

  const opacity = isFiltered ? 0.15 : isHighlighted ? 1 : 0.7;

  return (
    <group position={position}>
      {/* Glow effect for core */}
      {isCore && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* Main body */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, isCore ? 64 : 32, isCore ? 64 : 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCore ? 0.8 : hovered ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={opacity}
        />
      </mesh>
      
      {/* Rings for high-star repos */}
      {node.stars > 100 && !isCore && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.3, size * 1.6, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Label on hover */}
      {hovered && (
        <Html
          position={[0, size + 0.5, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="px-3 py-2 rounded-lg bg-black/90 border border-white/20 backdrop-blur-sm whitespace-nowrap">
            <p className="text-xs font-mono font-bold text-white">{node.name}</p>
            <p className="text-[10px] font-mono text-white/60">
              {node.stars.toLocaleString()} stars
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// Connection lines between nodes
function ConnectionLines({
  nodes,
  edges,
  nodePositions,
}: {
  nodes: EcosystemNode[];
  edges: { source: string; target: string; strength: number }[];
  nodePositions: Map<string, [number, number, number]>;
}) {
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    
    edges.forEach((edge) => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      
      if (sourcePos && targetPos) {
        positions.push(...sourcePos, ...targetPos);
        
        // Color based on strength
        const alpha = edge.strength * 0.5;
        colors.push(0.2, 0.8, 1, alpha, 0.2, 0.8, 1, alpha);
      }
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    
    return geometry;
  }, [edges, nodePositions]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#06b6d4" transparent opacity={0.15} />
    </lineSegments>
  );
}

// Animated star field with depth
function DeepStarField() {
  const starsRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.005) * 0.1;
    }
  });

  return (
    <>
      <Stars
        ref={starsRef}
        radius={300}
        depth={100}
        count={8000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      <Stars
        radius={200}
        depth={50}
        count={3000}
        factor={6}
        saturation={0.5}
        fade
        speed={0.3}
      />
    </>
  );
}

// Nebula clouds
function NebulaClouds() {
  const cloudsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  const clouds = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      position: [
        Math.sin(i * 1.2) * 100,
        (Math.random() - 0.5) * 50,
        Math.cos(i * 1.2) * 100,
      ] as [number, number, number],
      scale: 30 + Math.random() * 40,
      color: ["#a855f7", "#06b6d4", "#f97316", "#ec4899", "#3b82f6"][i],
    }));
  }, []);

  return (
    <group ref={cloudsRef}>
      {clouds.map((cloud, i) => (
        <mesh key={i} position={cloud.position}>
          <sphereGeometry args={[cloud.scale, 16, 16]} />
          <meshBasicMaterial
            color={cloud.color}
            transparent
            opacity={0.03}
            side={THREE.BackSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Camera controller for smooth navigation
function CameraController() {
  const { camera } = useThree();
  
  useFrame(() => {
    // Add subtle camera drift
    camera.position.x += Math.sin(Date.now() * 0.0001) * 0.01;
    camera.position.y += Math.cos(Date.now() * 0.00015) * 0.005;
  });

  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={200}
      autoRotate
      autoRotateSpeed={0.2}
      dampingFactor={0.05}
      rotateSpeed={0.5}
    />
  );
}

// Main scene
function GalaxyScene({
  data,
  onNodeClick,
  searchQuery,
  activeCategories,
}: GalaxyViewProps) {
  // Calculate 3D positions based on coupling score
  const { nodePositions, filteredNodes } = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    
    // Sort by coupling score (highest first = closest to center)
    const sorted = [...data.nodes].sort((a, b) => b.couplingScore - a.couplingScore);
    
    // Place core at center
    const coreNode = sorted.find((n) => n.category === "core");
    if (coreNode) {
      positions.set(coreNode.id, [0, 0, 0]);
    }
    
    // Spiral placement for other nodes
    const nonCore = sorted.filter((n) => n.category !== "core");
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    nonCore.forEach((node, i) => {
      // Distance from center based on coupling (inverse - higher coupling = closer)
      const distance = 8 + (100 - node.couplingScore) * 0.6;
      
      // Spiral pattern
      const angle = i * goldenAngle;
      const heightVariation = (Math.random() - 0.5) * distance * 0.3;
      
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = heightVariation;
      
      positions.set(node.id, [x, y, z]);
    });
    
    // Filter nodes
    const filtered = data.nodes.filter((n) => activeCategories.has(n.category));
    
    return { nodePositions: positions, filteredNodes: filtered };
  }, [data.nodes, activeCategories]);

  const highlightedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(
      data.nodes
        .filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.description?.toLowerCase().includes(q) ||
            n.topics.some((t) => t.toLowerCase().includes(q))
        )
        .map((n) => n.id)
    );
  }, [data.nodes, searchQuery]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#fbbf24" distance={100} />
      <pointLight position={[50, 30, 50]} intensity={0.5} color="#06b6d4" />
      <pointLight position={[-50, -20, -50]} intensity={0.3} color="#a855f7" />
      
      {/* Background */}
      <color attach="background" args={["#030014"]} />
      <DeepStarField />
      <NebulaClouds />
      
      {/* Connection lines */}
      <ConnectionLines
        nodes={filteredNodes}
        edges={data.edges}
        nodePositions={nodePositions}
      />
      
      {/* Nodes */}
      {data.nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;
        
        const isFiltered = !activeCategories.has(node.category);
        const isHighlighted =
          highlightedIds.size === 0 || highlightedIds.has(node.id);
        
        return (
          <CelestialBody
            key={node.id}
            node={node}
            position={pos}
            onClick={() => onNodeClick(node)}
            isHighlighted={isHighlighted}
            isFiltered={isFiltered}
          />
        );
      })}
      
      {/* Camera */}
      <CameraController />
    </>
  );
}

export default function GalaxyView(props: GalaxyViewProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 30, 60], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <GalaxyScene {...props} />
      </Canvas>
    </div>
  );
}
