/**
 * Agente 3D no centro do loadout.
 * Usa apenas GLB: CT = ct_agent.glb, T = tr_agent.glb — veja public/models/README.md.
 * Toca animacoes embutidas do GLB (idle/walk) se existirem.
 * Adiciona idle procedural (respiracao + balanco) e rotacao lenta tipo showcase.
 * Se o GLB nao existir, mostra a silhueta SVG.
 */
import React, { useMemo, Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Center } from '@react-three/drei';
import * as THREE from 'three';
import LoadoutCharacterSilhouette from './LoadoutCharacterSilhouette';

const MODEL_CENTER_Y = 1;
const FLOOR_Y = 1;
const CAMERA_LOOK_Y = 1;

const CT_MODEL_URL = '/models/ct_agent.glb';
const TR_MODEL_URL = '/models/tr_agent.glb';

const ROTATION_SPEED = 0.15;
const BREATHE_SPEED = 1.2;
const BREATHE_AMOUNT = 0.003;
const SWAY_SPEED = 0.5;
const SWAY_AMOUNT = 0.008;

async function checkModelExists(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-11' } });
    if (res.status === 404) return false;
    const type = (res.headers.get('content-type') || '').toLowerCase();
    if (type.includes('text/html')) return false;
    if (res.status === 206) return true;
    if (res.status === 200) {
      const isModel = type.includes('gltf') || type.includes('octet-stream') || type.includes('model/');
      return !!isModel;
    }
    return false;
  } catch {
    return false;
  }
}

function AgentModel({ url }) {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  const clone = useMemo(() => {
    const s = scene.clone();
    s.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return s;
  }, [scene]);

  useEffect(() => {
    if (names.length === 0) return;

    const preferred = ['idle', 'breathing', 'stand', 'walk', 'patrol'];
    let picked = null;
    for (const pref of preferred) {
      picked = names.find((n) => n.toLowerCase().includes(pref));
      if (picked) break;
    }
    if (!picked) picked = names[0];

    const action = actions[picked];
    if (action) {
      action.reset().fadeIn(0.4).play();
      action.setLoop(THREE.LoopRepeat);
      return () => action.fadeOut(0.4);
    }
  }, [actions, names]);

  const hasAnimations = names.length > 0;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    group.current.rotation.y = t * ROTATION_SPEED;

    if (!hasAnimations) {
      group.current.position.y = MODEL_CENTER_Y + Math.sin(t * BREATHE_SPEED) * BREATHE_AMOUNT;
      group.current.rotation.z = Math.sin(t * SWAY_SPEED) * SWAY_AMOUNT;
    }
  });

  return (
    <group ref={group} position={[0, MODEL_CENTER_Y, 0]}>
      <Center>
        <primitive object={clone} scale={1.1} />
      </Center>
    </group>
  );
}

function CameraLookAt() {
  const { camera } = useThree();
  useFrame(() => {
    camera.lookAt(0, CAMERA_LOOK_Y, 0);
  });
  return null;
}

function Scene({ side, modelUrl }) {
  return (
    <>
      <CameraLookAt />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />
      <pointLight
        position={[0, 2, 2]}
        intensity={0.5}
        color={side === 'ct' ? '#5a8fc4' : '#9b6b3a'}
        distance={6}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#0a0c10" roughness={1} metalness={0} />
      </mesh>
      <Suspense fallback={null}>
        <AgentModel url={modelUrl} />
      </Suspense>
    </>
  );
}

class ModelErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LoadoutCharacter3D] Modelo GLB indisponivel, usando silhueta.', error?.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="loadout-character-3d loadout-character-3d--fallback">
          <LoadoutCharacterSilhouette side={this.props.side} />
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LoadoutCharacter3D({ side }) {
  const [modelByUrl, setModelByUrl] = useState({});
  const url = side === 'ct' ? CT_MODEL_URL : TR_MODEL_URL;
  const modelAvailable = modelByUrl[url];

  useEffect(() => {
    if (modelByUrl[url] !== undefined) return;
    let cancelled = false;
    checkModelExists(url).then((ok) => {
      if (!cancelled) setModelByUrl((prev) => ({ ...prev, [url]: ok }));
    });
    return () => { cancelled = true; };
  }, [url, modelByUrl]);

  if (!modelAvailable) {
    return (
      <div className="loadout-character-3d loadout-character-3d--fallback">
        <LoadoutCharacterSilhouette side={side} />
      </div>
    );
  }

  return (
    <ModelErrorBoundary side={side}>
      <div className="loadout-character-3d" style={{ minHeight: 380, width: '100%' }}>
        <Canvas
          camera={{ position: [0, CAMERA_LOOK_Y, 3.6], fov: 44 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          style={{ display: 'block', minHeight: 380 }}
        >
          <Scene side={side} modelUrl={url} />
        </Canvas>
      </div>
    </ModelErrorBoundary>
  );
}
