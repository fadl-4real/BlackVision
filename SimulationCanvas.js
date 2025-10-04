import React, { useState, Suspense, useEffect, useRef } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stars, shaderMaterial, useAnimations } from "@react-three/drei";
import * as THREE from "three";

// Custom shader material for dotted pattern
const DottedDualWavelengthMaterial = shaderMaterial(
  {
    colorRed: new THREE.Color("#ff0000"),
    colorBlue: new THREE.Color("#0000ff"),
    time: 0,
    dotSize: 0.02,
  },
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float time;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      pos += sin(time + position.x * 5.0) * 0.05;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  `
    uniform vec3 colorRed;
    uniform vec3 colorBlue;
    uniform float time;
    uniform float dotSize;
    varying vec2 vUv;
    varying vec3 vNormal;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float dots(vec2 uv) {
      vec2 grid = floor(uv / dotSize);
      float n = noise(grid);
      n += sin(time * 2.0 + grid.x + grid.y) * 0.1;
      n = fract(n);
      return step(0.5, n);
    }

    void main() {
      vec2 scaledUv = vUv * (1.0 / dotSize * 20.0);
      float isRed = dots(scaledUv);
      vec3 finalColor = mix(colorBlue, colorRed, isRed);
      float edge = smoothstep(0.4, 0.6, isRed);
      gl_FragColor = vec4(finalColor, edge);
    }
  `
);

extend({ DottedDualWavelengthMaterial });

function BlackHole({ scale = 50, position = [0, 0, 0] }) {
  const { scene, animations } = useGLTF("/blackhole/scene.gltf");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions).forEach((action) => {
        action.reset().play();
      });
    }
  }, [actions]);

  return <primitive object={scene} scale={scale} position={position} dispose={null} />;
}
useGLTF.preload("/blackhole/scene.gltf");

function DottedDualWavelengthShape({ position = [0, 0, 0], scale = 1, shape = "sphere" }) {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.getElapsedTime();
    }
  });

  // Ring position and rotation (unchanged)
  const ringPosition = [0, 0, 0];
  const spherePosition = [110, 0, 0]; // Further from blackhole (as previously set)

  // Ring scale unchanged, sphere scale set to 1 (with base radius 15 for exact size)
  const ringScale = 4;
  const sphereScale = 1;

  return (
    <mesh
      position={shape === "ring" ? ringPosition : spherePosition}
      scale={shape === "ring" ? ringScale : sphereScale}
      rotation={shape === "ring" ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
    >
      {shape === "sphere" ? (
        <sphereGeometry args={[15, 64, 64]} /> // Radius exactly 15 units
      ) : (
        <torusGeometry args={[10, 1, 16, 100]} />
      )}
      <dottedDualWavelengthMaterial
        ref={materialRef}
        colorRed="#ff0000"
        colorBlue="#0000ff"
        dotSize={0.02}
      />
    </mesh>
  );
}

function Scene({ blackVisionOn, isRing }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[100, 100, 100]} intensity={1.5} />
      <directionalLight position={[-50, 50, 50]} intensity={1} />

      <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />

      <BlackHole scale={50} position={[0, 0, 0]} />

      {blackVisionOn && (
        <DottedDualWavelengthShape shape={isRing ? "ring" : "sphere"} />
      )}

      <axesHelper args={[100]} />
      <gridHelper args={[500, 50]} />

      <OrbitControls />
    </>
  );
}

export default function TestCanvas() {
  const [blackVisionOn, setBlackVisionOn] = useState(false);
  const [isRing, setIsRing] = useState(true); // Ring default on

  // Common button styles
  const baseButtonStyle = {
    padding: "12px 28px",
    fontSize: "18px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    minWidth: "160px",
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    color: "white",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ flex: 1, width: "100%" }}>
        <Canvas camera={{ position: [0, 150, 0], fov: 60, far: 10000 }}>
          <Suspense fallback={null}>
            <Scene blackVisionOn={blackVisionOn} isRing={isRing} />
          </Suspense>
        </Canvas>
      </div>

      {/* Buttons container with transparent background */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "20px",
          backgroundColor: "rgba(0, 0, 0, 0)", // fully transparent
          padding: "0",
          zIndex: 10,
          userSelect: "none",
        }}
      >
        <button
          onClick={() => setBlackVisionOn(!blackVisionOn)}
          style={{
            ...baseButtonStyle,
            backgroundColor: blackVisionOn ? "#28a745" : "#6c757d",
            boxShadow: blackVisionOn
              ? "0 6px 12px rgba(40, 167, 69, 0.6)"
              : "0 6px 12px rgba(108, 117, 125, 0.6)",
          }}
        >
          Blackvision {blackVisionOn ? "On" : "Off"}
        </button>

        <button
          onClick={() => setIsRing(!isRing)}
          disabled={!blackVisionOn}
          style={{
            ...baseButtonStyle,
            backgroundColor: isRing ? "#007bff" : "#6c757d",
            cursor: blackVisionOn ? "pointer" : "not-allowed",
            boxShadow: isRing
              ? "0 6px 12px rgba(0, 123, 255, 0.6)"
              : "0 6px 12px rgba(108, 117, 125, 0.6)",
            opacity: blackVisionOn ? 1 : 0.6,
          }}
        >
          {isRing ? "Pre Analysis" : "After Analysis"}
        </button>
      </div>
    </div>
  );
}
