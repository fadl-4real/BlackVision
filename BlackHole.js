import React, { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

function BlackHole({ scale = 50, position = [0, 0, 0] }) {
  const { scene, animations } = useGLTF("/blackhole/scene.gltf");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (actions) {
      // Play all animations
      Object.values(actions).forEach((action) => {
        action.reset().play();
      });
    }
  }, [actions]);

  return <primitive object={scene} scale={scale} position={position} />;
}

useGLTF.preload("/blackhole/scene.gltf");

export default BlackHole;
