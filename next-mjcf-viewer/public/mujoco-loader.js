// MuJoCo loader script
import loadMujoco from "./mujoco_wasm.js";

// Expose the load function globally
window.__mujocoLoadFunction = loadMujoco;
