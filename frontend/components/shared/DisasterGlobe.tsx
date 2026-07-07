"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, DisasterInfo } from '@/utils/store';
import { Flame, Activity, CloudRain, AlertTriangle, ShieldAlert } from 'lucide-react';

// Procedural Atmosphere Glow Shader Material
const AtmosphereShader = {
  uniforms: {
    color: { value: new THREE.Color('#0ea5e9') },
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    uniform vec3 color;
    void main() {
      float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
      gl_FragColor = vec4(color, 1.0) * intensity;
    }
  `
};

// Earth Sphere with Grid Texture and Atmosphere
function Earth({ activePins, onSelectPin }: { activePins: DisasterInfo[]; onSelectPin: (d: DisasterInfo) => void }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const orbitalRef = useRef<THREE.Group>(null);
  
  // Slowly rotate the earth when idle
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
    if (orbitalRef.current) {
      orbitalRef.current.rotation.y += delta * 0.08;
      orbitalRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Atmosphere Glow */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[2, 32, 32]} />
        <shaderMaterial
          vertexShader={AtmosphereShader.vertexShader}
          fragmentShader={AtmosphereShader.fragmentShader}
          uniforms={AtmosphereShader.uniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
        />
      </mesh>

      {/* Earth Body */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 40, 40]} />
        <meshPhongMaterial
          color="#061224"
          emissive="#04203f"
          specular="#0ea5e9"
          shininess={50}
          wireframe={true}
        />
      </mesh>

      {/* Grid Wireframe (Outer Technical Ring) */}
      <mesh scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial
          color="#0ea5e9"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Procedural Landmass Dots (Point Cloud representation) */}
      <points>
        <sphereGeometry args={[1.99, 60, 60]} />
        <pointsMaterial
          color="#38bdf8"
          size={0.03}
          sizeAttenuation={true}
          transparent
          opacity={0.5}
        />
      </points>

      {/* Satellite Orbital Rings */}
      <group ref={orbitalRef}>
        {/* Orbital line */}
        <mesh rotation={[Math.PI / 2, 0.4, 0]}>
          <ringGeometry args={[2.5, 2.51, 64]} />
          <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
        
        {/* Active Satellite beacon */}
        <mesh position={[2.5 * Math.cos(0), 0, 2.5 * Math.sin(0)]} scale={[0.06, 0.06, 0.06]}>
          <sphereGeometry />
          <meshBasicMaterial color="#60a5fa" />
        </mesh>
      </group>

      {/* Active Disaster Pins */}
      {activePins.map((pin) => (
        <DisasterPin key={pin.id} pin={pin} onClick={() => onSelectPin(pin)} />
      ))}
    </group>
  );
}

// Convert Lat/Lng coordinates to 3D Sphere points
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

// Glowing Pin Mesh for Active Disasters
function DisasterPin({ pin, onClick }: { pin: DisasterInfo; onClick: () => void }) {
  const pinRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const position = latLngToVector3(pin.lat, pin.lng, 2.02);

  // Pulse animation for pins
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const pulseFactor = 1 + Math.sin(elapsed * 6) * 0.15;
    const ringScale = 1 + (elapsed * 2 % 1) * 1.5;
    
    if (pinRef.current) {
      pinRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }
    
    if (ringRef.current) {
      ringRef.current.scale.set(ringScale, ringScale, 1);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = 1 - (elapsed * 2 % 1);
      }
    }
  });

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const color = getSeverityColor(pin.severity);

  // Direct the pin normal outwards from the sphere
  const lookTarget = position.clone().normalize().multiplyScalar(5);

  return (
    <group position={position}>
      <object3D ref={(self) => self && self.lookAt(lookTarget)}>
        {/* Core Pulsing Sphere */}
        <mesh ref={pinRef} onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {/* Pulse Ring */}
        <mesh ref={ringRef} position={[0, 0, 0.01]}>
          <ringGeometry args={[0.1, 0.18, 16]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* Beacon light beam */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.05, 0.8, 8, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>

        {/* Dynamic HTML Label */}
        <Html distanceFactor={4} position={[0, 0.15, 0]}>
          <div className="px-2 py-0.5 glass-panel rounded border border-border/50 text-[9px] font-mono text-foreground font-semibold flex items-center gap-1 shadow-md whitespace-nowrap pointer-events-none select-none">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: color }} />
            {pin.name}
          </div>
        </Html>
      </object3D>
    </group>
  );
}

// Camera controller that handles flying/interpolating coordinates on focus
function CameraController({ targetPosition }: { targetPosition: THREE.Vector3 | null }) {
  const { camera } = useThree();

  useFrame(() => {
    if (targetPosition) {
      // Lerp camera to target position (close to target pin)
      const targetCam = targetPosition.clone().normalize().multiplyScalar(4.5);
      camera.position.lerp(targetCam, 0.05);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

export default function DisasterGlobe() {
  const { activeDisasters, setSelectedDisaster, selectedDisaster } = useStore();
  const [targetPos, setTargetPos] = useState<THREE.Vector3 | null>(null);

  // Load mock pins if the database seeder has loaded some
  const [pins, setPins] = useState<DisasterInfo[]>([
    { id: '1', name: 'Wildfire', lat: 37.7749, lng: -122.4194, type: 'fire', severity: 'critical', radius: 10 }, // San Francisco
    { id: '2', name: 'Flooding', lat: 22.5726, lng: 88.3639, type: 'flood', severity: 'high', radius: 15 }, // Kolkata
    { id: '3', name: 'Storm Alert', lat: 13.0827, lng: 80.2707, type: 'weather', severity: 'medium', radius: 25 }, // Chennai
  ]);

  useEffect(() => {
    if (activeDisasters.length > 0) {
      setPins(activeDisasters);
    }
  }, [activeDisasters]);

  const handleSelectPin = (pin: DisasterInfo) => {
    setSelectedDisaster(pin);
    const pos = latLngToVector3(pin.lat, pin.lng, 2.02);
    setTargetPos(pos);
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'fire': return <Flame className="h-4.5 w-4.5 text-severity-critical" />;
      case 'flood': return <CloudRain className="h-4.5 w-4.5 text-primary" />;
      case 'weather': return <Activity className="h-4.5 w-4.5 text-severity-medium" />;
      default: return <ShieldAlert className="h-4.5 w-4.5 text-severity-high" />;
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Earth activePins={pins} onSelectPin={handleSelectPin} />
          
          <Stars radius={100} depth={50} count={1200} factor={4} saturation={0} fade speed={1.5} />
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={3} 
            maxDistance={8}
            autoRotate={!selectedDisaster} 
            autoRotateSpeed={0.8} 
          />
          <CameraController targetPosition={targetPos} />
        </Canvas>
      </div>

      {/* Floating Info Side Panel */}
      {selectedDisaster && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 glass-panel-glow border rounded-xl p-4 z-10 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#0d2040] border border-[#1e3352] flex items-center justify-center shrink-0">
                {getSeverityIcon(selectedDisaster.type)}
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">{selectedDisaster.name} Zone</h3>
                <span className="text-[9px] font-mono text-[#64748b] tracking-wider uppercase">Active Dispatch Center</span>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedDisaster(null); setTargetPos(null); }} 
              className="text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded border border-border/30 bg-secondary/10"
            >
              CLOSE
            </button>
          </div>

          <div className="h-px bg-border/40" />

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-[#112236]/30 p-2 rounded border border-border/20">
              <span className="text-[#64748b] block uppercase">Severity</span>
              <span className={`font-bold uppercase tracking-wider ${
                selectedDisaster.severity === 'critical' ? 'text-severity-critical' :
                selectedDisaster.severity === 'high' ? 'text-severity-high' : 'text-severity-medium'
              }`}>{selectedDisaster.severity}</span>
            </div>
            <div className="bg-[#112236]/30 p-2 rounded border border-border/20">
              <span className="text-[#64748b] block uppercase">Impact Radius</span>
              <span className="font-bold text-foreground">{selectedDisaster.radius} KM</span>
            </div>
            <div className="bg-[#112236]/30 p-2 rounded border border-border/20">
              <span className="text-[#64748b] block uppercase">Latitude</span>
              <span className="font-bold text-foreground">{selectedDisaster.lat.toFixed(4)}</span>
            </div>
            <div className="bg-[#112236]/30 p-2 rounded border border-border/20">
              <span className="text-[#64748b] block uppercase">Longitude</span>
              <span className="font-bold text-foreground">{selectedDisaster.lng.toFixed(4)}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              // Open government command center dashboard for simulation
              window.location.hash = `/government?district=${selectedDisaster.name}`;
              window.location.reload();
            }}
            className="h-8 rounded bg-primary text-[11px] font-medium text-white hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-glow-info"
          >
            Open Live Command Operations
          </button>
        </div>
      )}
    </div>
  );
}
