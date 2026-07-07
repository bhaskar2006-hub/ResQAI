"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { Shield, Building2, Home, Truck, BellRing } from 'lucide-react';

interface MapNode {
  id: string;
  lat: number;
  lng: number;
  type: 'sos' | 'hospital' | 'shelter' | 'resource';
  name: string;
  details: string;
  status?: string;
  capacity?: number;
  val?: number; // active beds / occupancy
}

// Custom Extruded Marker component
function TacticalMarker({ 
  node, 
  position, 
  onHover, 
  onLeave 
}: { 
  node: MapNode; 
  position: [number, number, number]; 
  onHover: (node: MapNode) => void; 
  onLeave: () => void; 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Slowly rotate markers to look high-tech
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  const getMarkerConfig = (type: string) => {
    switch (type) {
      case 'hospital':
        return { color: '#ef4444', geometry: <boxGeometry args={[0.2, 0.4, 0.2]} /> }; // red-cross tower
      case 'shelter':
        return { color: '#22c55e', geometry: <coneGeometry args={[0.15, 0.4, 4]} /> }; // pyramid roof
      case 'resource':
        return { color: '#f59e0b', geometry: <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} /> }; // active responder
      case 'sos':
      default:
        return { color: '#ea580c', geometry: <sphereGeometry args={[0.12, 16, 16]} /> }; // SOS beacon
    }
  };

  const config = getMarkerConfig(node.type);
  const scale = node.type === 'sos' ? 1.2 : 1.0;

  return (
    <group position={position}>
      {/* Base platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.3} />
      </mesh>

      {/* Main Extruded Geometry */}
      <mesh 
        ref={meshRef}
        scale={[scale, scale, scale]}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
        onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
      >
        {config.geometry}
        <meshStandardMaterial 
          color={config.color} 
          emissive={config.color} 
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Pulsing ring for SOS report */}
      {node.type === 'sos' && (
        <SosPulseRing color={config.color} />
      )}
    </group>
  );
}

// Pulse ring overlay for active emergency beacons
function SosPulseRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      const elapsed = state.clock.getElapsedTime();
      const scale = 1 + (elapsed * 2.5 % 1) * 2;
      ringRef.current.scale.set(scale, scale, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 1 - (elapsed * 2.5 % 1);
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
      <ringGeometry args={[0.15, 0.3, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Curved Animated Route Line for active dispatch visualization
function DispatchRoute({ start, end, color = '#f59e0b' }: { start: [number, number, number]; end: [number, number, number]; color?: string }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const pointRef = useRef<THREE.Mesh>(null);

  // Compute curved bezier path (arched upward in Y)
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
  midPoint.y += 0.8; // arch height

  const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
  const points = curve.getPoints(30);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    if (pointRef.current) {
      const elapsed = state.clock.getElapsedTime();
      const t = (elapsed * 0.4) % 1; // Travel speed along the line
      const pos = curve.getPointAt(t);
      pointRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      {/* Arched Dotted Line */}
      <line ref={lineRef}>
        <bufferGeometry attach="geometry" {...geometry} />
        <lineBasicMaterial attach="material" color={color} transparent opacity={0.4} linewidth={1} />
      </line>

      {/* Traveling light beacon */}
      <mesh ref={pointRef} scale={[0.05, 0.05, 0.05]}>
        <sphereGeometry />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function ResourceMap3D() {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; start: [number, number, number]; end: [number, number, number] }>>([]);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);

  // Center coordinate for scaling: Hyderabad
  const centerLat = 17.385;
  const centerLng = 78.4867;
  const scale = 250; // map scaling factor for lat/lng to grid points

  const fetchMapData = useCallback(async () => {
    try {
      const [hospitalsRes, sheltersRes, resourcesRes, sosRes] = await Promise.all([
        api.get('/hospitals').catch(() => ({ success: false })),
        api.get('/shelters').catch(() => ({ success: false })),
        api.get('/resources').catch(() => ({ success: false })),
        api.get('/sos').catch(() => ({ success: false })),
      ]) as Record<string, unknown>[];

      const mapped: MapNode[] = [];

      // Hospitals
      const hData = hospitalsRes as { success?: boolean; data?: { hospitals?: Array<{ id: string; name: string; latitude: number; longitude: number; availableBeds: number; capacity: number }> } };
      if (hData.success && hData.data?.hospitals) {
        hData.data.hospitals.forEach((h) => {
          mapped.push({ 
            id: h.id, lat: h.latitude, lng: h.longitude, type: 'hospital', 
            name: h.name, details: `Beds Available: ${h.availableBeds}/${h.capacity}`,
            capacity: h.capacity, val: h.availableBeds 
          });
        });
      }

      // Shelters
      const sData = sheltersRes as { success?: boolean; data?: { shelters?: Array<{ id: string; name: string; latitude: number; longitude: number; occupancy: number; capacity: number }> } };
      if (sData.success && sData.data?.shelters) {
        sData.data.shelters.forEach((s) => {
          mapped.push({ 
            id: s.id, lat: s.latitude, lng: s.longitude, type: 'shelter', 
            name: s.name, details: `Occupancy capacity: ${s.occupancy}/${s.capacity}`,
            capacity: s.capacity, val: s.occupancy 
          });
        });
      }

      // Resources
      const rData = resourcesRes as { success?: boolean; data?: { resources?: Array<{ id: string; identifier: string; type: string; latitude: number; longitude: number; status: string }> } };
      const resourceCoords: Record<string, [number, number, number]> = {};
      if (rData.success && rData.data?.resources) {
        rData.data.resources.forEach((r) => {
          const x = (r.longitude - centerLng) * scale;
          const z = (r.latitude - centerLat) * scale;
          mapped.push({ 
            id: r.id, lat: r.latitude, lng: r.longitude, type: 'resource', 
            name: `${r.type} ${r.identifier}`, details: `Resource active. Status: ${r.status}`, status: r.status 
          });
          resourceCoords[r.id] = [x, 0.1, z];
        });
      }

      // SOS Reports
      const activeSosList: MapNode[] = [];
      const sosData = sosRes as { success?: boolean; data?: { sosReports?: Array<{ id: string; description: string; latitude: number; longitude: number; status: string; resources?: Array<{ id: string }> }> } };
      if (sosData.success && sosData.data?.sosReports) {
        sosData.data.sosReports.forEach((sos) => {
          if (sos.status !== 'RESOLVED') {
            const x = (sos.longitude - centerLng) * scale;
            const z = (sos.latitude - centerLat) * scale;
            
            const sosNode: MapNode = { 
              id: sos.id, lat: sos.latitude, lng: sos.longitude, type: 'sos', 
              name: 'Emergency Alert', details: sos.description.substring(0, 100), status: sos.status 
            };
            mapped.push(sosNode);
            activeSosList.push(sosNode);

            // If there's an assigned resource, generate a route
            if (sos.resources && sos.resources.length > 0) {
              sos.resources.forEach(res => {
                const startPos = resourceCoords[res.id];
                if (startPos) {
                  setRoutes(prev => [
                    ...prev.filter(r => r.id !== `${res.id}-${sos.id}`),
                    { id: `${res.id}-${sos.id}`, start: startPos, end: [x, 0.1, z] }
                  ]);
                }
              });
            }
          }
        });
      }

      setNodes(mapped);
    } catch (err) {
      console.error('Failed to load 3D map data:', err);
    }
  }, []);

  useEffect(() => {
    fetchMapData();

    const socket = getSocket();
    const handleUpdate = () => fetchMapData();
    socket.on('newSOS', handleUpdate);
    socket.on('sosUpdated', handleUpdate);
    socket.on('actionApproved', handleUpdate);
    return () => {
      socket.off('newSOS', handleUpdate);
      socket.off('sosUpdated', handleUpdate);
      socket.off('actionApproved', handleUpdate);
    };
  }, [fetchMapData]);

  const get2DPos = (lat: number, lng: number): [number, number, number] => {
    const x = (lng - centerLng) * scale;
    const z = (lat - centerLat) * scale;
    return [x, 0.2, z];
  };

  const getFloatingCardIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Building2 className="h-4.5 w-4.5 text-severity-critical" />;
      case 'shelter': return <Home className="h-4.5 w-4.5 text-severity-low" />;
      case 'resource': return <Truck className="h-4.5 w-4.5 text-severity-medium" />;
      default: return <BellRing className="h-4.5 w-4.5 text-primary animate-pulse" />;
    }
  };

  return (
    <div className="w-full h-full relative border border-border bg-[#050c16] rounded-xl overflow-hidden shadow-2xl">
      {/* 3D Canvas rendering tilted district map */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 4, 5], fov: 40 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <directionalLight position={[0, 5, 0]} intensity={0.8} />

          {/* Grid tactical tactical plate */}
          <gridHelper args={[20, 20, '#0ea5e9', '#112236']} position={[0, -0.2, 0]} />
          
          {/* Tactical ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0]} receiveShadow>
            <planeGeometry args={[25, 25]} />
            <meshStandardMaterial color="#07101f" roughness={0.9} />
          </mesh>

          {/* Extruded markers */}
          {nodes.map((node) => (
            <TacticalMarker 
              key={`${node.type}-${node.id}`} 
              node={node} 
              position={get2DPos(node.lat, node.lng)} 
              onHover={setHoveredNode} 
              onLeave={() => setHoveredNode(null)} 
            />
          ))}

          {/* Active Dispatch Routes */}
          {routes.map((route) => (
            <DispatchRoute key={route.id} start={route.start} end={route.end} />
          ))}

          <OrbitControls 
            enableZoom={true} 
            maxPolarAngle={Math.PI / 2.1} // constraint camera from going below grid
            minDistance={2} 
            maxDistance={8} 
          />
        </Canvas>
      </div>

      {/* Floating Tactical Legends */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 text-[10px] font-mono glass-panel p-2.5 rounded border border-border/50 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-severity-critical" />
          <span>Hospitals (Crosses)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-severity-low" />
          <span>Shelter Centers (Pyramids)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-severity-medium" />
          <span>Active Units (Cylinders)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-primary animate-pulse" />
          <span>Active SOS Alerts</span>
        </div>
      </div>

      {/* Hover Floating Glass Card */}
      {hoveredNode && (
        <div className="absolute bottom-4 right-4 w-72 glass-panel-glow border rounded-lg p-3 z-10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="h-9 w-9 rounded-lg bg-[#0d2040] border border-[#1e3352] flex items-center justify-center shrink-0">
            {getFloatingCardIcon(hoveredNode.type)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-bold text-foreground truncate uppercase">{hoveredNode.name}</h4>
            <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{hoveredNode.details}</p>
            
            {/* Live capacity rendering */}
            {(hoveredNode.type === 'hospital' || hoveredNode.type === 'shelter') && hoveredNode.capacity && (
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center justify-between text-[8px] font-mono text-[#64748b]">
                  <span>CAPACITY STATUS</span>
                  <span>{Math.round(((hoveredNode.val || 0) / hoveredNode.capacity) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.round(((hoveredNode.val || 0) / hoveredNode.capacity) * 100)}%`,
                      backgroundColor: hoveredNode.type === 'hospital' ? '#ef4444' : '#22c55e'
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
