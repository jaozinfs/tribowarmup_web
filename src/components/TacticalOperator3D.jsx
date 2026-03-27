/**
 * Operador tático 3D procedural — inspirado em operador CT (tático) e T (paramilitar).
 * Sem assets proprietários; apenas geometrias Three.js + materiais PBR.
 * Inclui animação idle (respiração) e troca dinâmica CT/TR.
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Paletas PBR: CT = tático moderno (azul/cinza), T = paramilitar (marrom/oliva)
const CT_MATERIALS = {
  skin: { color: '#8b7355', roughness: 0.95, metalness: 0.02 },
  helmet: { color: '#1e3a5f', roughness: 0.6, metalness: 0.15 },
  vest: { color: '#152a45', roughness: 0.7, metalness: 0.1 },
  torso: { color: '#243d5c', roughness: 0.85, metalness: 0.05 },
  legs: { color: '#1a3050', roughness: 0.8, metalness: 0.05 },
  boots: { color: '#0a1520', roughness: 0.9, metalness: 0.2 },
  visor: { color: '#0d2137', roughness: 0.2, metalness: 0.6 },
};

const T_MATERIALS = {
  skin: { color: '#6b5344', roughness: 0.95, metalness: 0.02 },
  helmet: { color: '#4a2c14', roughness: 0.8, metalness: 0.05 },
  vest: { color: '#3d2612', roughness: 0.75, metalness: 0.08 },
  torso: { color: '#5c3a1a', roughness: 0.85, metalness: 0.04 },
  legs: { color: '#4a2c14', roughness: 0.8, metalness: 0.05 },
  boots: { color: '#2d1b0d', roughness: 0.85, metalness: 0.15 },
  visor: { color: '#1a1008', roughness: 0.9, metalness: 0.1 },
};

function PBRPart({ geometry, materialProps, position, rotation, scale }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        ...materialProps,
        envMapIntensity: 0.4,
      }),
    [materialProps]
  );
  return (
    <mesh
      geometry={geometry}
      material={mat}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
}

export default function TacticalOperator3D({ side }) {
  const groupRef = useRef(null);
  const isCT = side === 'ct';
  const mats = isCT ? CT_MATERIALS : T_MATERIALS;

  // Idle: respiração leve (personagem inteiro sobe/desce)
  useFrame((state) => {
    if (!groupRef.current) return;
    const breath = Math.sin(state.clock.elapsedTime * 1.2) * 0.022;
    groupRef.current.position.y = -0.7 + breath;
  });

  // Geometrias compartilhadas (memorizadas)
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.22, 24, 20), []);
  const helmetGeo = useMemo(
    () => new THREE.SphereGeometry(0.26, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.55),
    []
  );
  const torsoGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.72, 0.28), []);
  const vestGeo = useMemo(() => new THREE.BoxGeometry(0.54, 0.55, 0.3), []);
  const upperArmGeo = useMemo(() => new THREE.CylinderGeometry(0.08, 0.07, 0.42, 10), []);
  const forearmGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.055, 0.36, 10), []);
  const thighGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.09, 0.48, 10), []);
  const calfGeo = useMemo(() => new THREE.CylinderGeometry(0.08, 0.065, 0.42, 10), []);
  const bootGeo = useMemo(() => new THREE.BoxGeometry(0.14, 0.08, 0.28), []);
  const visorGeo = useMemo(
    () => new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.35),
    []
  );
  const visorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        ...mats.visor,
        transparent: true,
        opacity: 0.85,
      }),
    [mats.visor]
  );
  const helmetMatCT = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        ...mats.helmet,
        envMapIntensity: 0.5,
      }),
    [mats.helmet]
  );
  const helmetMatT = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        ...mats.helmet,
        envMapIntensity: 0.4,
      }),
    [mats.helmet]
  );

  return (
    <group ref={groupRef} position={[0, -0.7, 0]} scale={[1.75, 1.75, 1.75]}>
      {/* Cabeça + capacete / passamontanha */}
      <group position={[0, 1.42, 0]}>
        <PBRPart
          geometry={headGeo}
          materialProps={mats.skin}
          position={[0, 0, 0]}
          scale={[1, 1, 0.95]}
        />
        {isCT ? (
          <>
            <mesh
              geometry={helmetGeo}
              material={helmetMatCT}
              position={[0, 0.04, 0]}
              scale={[1.08, 1.08, 1.02]}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={visorGeo}
              material={visorMat}
              position={[0, 0.02, 0.12]}
              rotation={[Math.PI * 0.15, 0, 0]}
              castShadow
            />
          </>
        ) : (
          <mesh
            geometry={helmetGeo}
            material={helmetMatT}
            position={[0, 0.03, 0]}
            scale={[1.06, 1.06, 1]}
            castShadow
            receiveShadow
          />
        )}
      </group>

      {/* Torso + colete */}
      <group position={[0, 0.92, 0]}>
        <PBRPart geometry={torsoGeo} materialProps={mats.torso} position={[0, 0, 0]} />
        <PBRPart
          geometry={vestGeo}
          materialProps={mats.vest}
          position={[0, 0.02, 0.02]}
          scale={[1, 1, 1]}
        />
      </group>

      {/* Braços: postura firme (segurando arma sugerida) */}
      <group position={[0.28, 0.95, 0.08]}>
        <PBRPart
          geometry={upperArmGeo}
          materialProps={mats.torso}
          position={[0, 0, 0]}
          rotation={[0, 0, Math.PI * 0.5]}
        />
        <PBRPart
          geometry={forearmGeo}
          materialProps={mats.torso}
          position={[0.21, 0, 0]}
          rotation={[0, 0, Math.PI * 0.5]}
        />
      </group>
      <group position={[-0.26, 0.92, 0.05]}>
        <PBRPart
          geometry={upperArmGeo}
          materialProps={mats.torso}
          position={[0, 0, 0]}
          rotation={[0, 0, -Math.PI * 0.5]}
        />
        <PBRPart
          geometry={forearmGeo}
          materialProps={mats.torso}
          position={[-0.2, 0, 0]}
          rotation={[0, 0, -Math.PI * 0.5]}
        />
      </group>

      {/* Pernas + botas */}
      <group position={[0.12, 0.22, 0]}>
        <PBRPart
          geometry={thighGeo}
          materialProps={mats.legs}
          position={[0, 0.24, 0]}
          rotation={[Math.PI * 0.5, 0, 0]}
        />
        <PBRPart
          geometry={calfGeo}
          materialProps={mats.legs}
          position={[0, -0.21, 0]}
          rotation={[Math.PI * 0.5, 0, 0]}
        />
        <PBRPart
          geometry={bootGeo}
          materialProps={mats.boots}
          position={[0, -0.44, 0.02]}
          rotation={[Math.PI * 0.08, 0, 0]}
        />
      </group>
      <group position={[-0.12, 0.22, 0]}>
        <PBRPart
          geometry={thighGeo}
          materialProps={mats.legs}
          position={[0, 0.24, 0]}
          rotation={[Math.PI * 0.5, 0, 0]}
        />
        <PBRPart
          geometry={calfGeo}
          materialProps={mats.legs}
          position={[0, -0.21, 0]}
          rotation={[Math.PI * 0.5, 0, 0]}
        />
        <PBRPart
          geometry={bootGeo}
          materialProps={mats.boots}
          position={[0, -0.44, 0.02]}
          rotation={[Math.PI * 0.08, 0, 0]}
        />
      </group>
    </group>
  );
}
