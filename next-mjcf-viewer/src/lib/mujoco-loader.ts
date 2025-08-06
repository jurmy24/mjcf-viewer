// import type { mujoco } from "@/types/mujoco_wasm";

// export default async function loadMuJoCo(): Promise<mujoco> {
//   // Dynamic import to avoid SSR issues
//   const module = await import("/mujoco_wasm.js");
//   return module.default();
// }

import type { mujoco } from "@/types/mujoco_wasm";

export default async function loadMuJoCo(): Promise<mujoco> {
  if (typeof window === "undefined") {
    throw new Error("MuJoCo can only be loaded on the client side");
  }

  // Check if already loaded
  if ((window as any).mujoco) {
    return (window as any).mujoco;
  }

  return new Promise((resolve, reject) => {
    // Create script element to load mujoco_wasm.js
    const script = document.createElement("script");
    script.src = "/mujoco_wasm.js";
    script.async = true;

    script.onload = () => {
      // The script loads the WASM file and sets window.mujoco
      if ((window as any).mujoco) {
        resolve((window as any).mujoco);
      } else {
        reject(new Error("MuJoCo failed to initialize"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load MuJoCo script"));
    };

    document.head.appendChild(script);
  });
}
