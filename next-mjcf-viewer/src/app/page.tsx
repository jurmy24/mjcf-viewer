"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { loadMuJoCo } from "../lib/mujoco-loader";

interface MuJoCoParams {
  scene: string;
  paused: boolean;
  help: boolean;
  ctrlnoiserate: number;
  ctrlnoisestd: number;
  keyframeNumber: number;
  [key: string]: unknown;
}

// MuJoCo type definitions
interface MuJoCoModel {
  nbody: number;
  nlight: number;
  getOptions(): { timestep: number };
}

interface MuJoCoState {
  xpos: Float32Array;
  xquat: Float32Array;
  light_xpos: Float32Array;
  light_xdir: Float32Array;
  ctrl: Float32Array;
  qfrc_applied: Float32Array;
  mocap_pos: Float32Array;
}

interface MuJoCoSimulation {
  xpos: Float32Array;
  xquat: Float32Array;
  light_xpos: Float32Array;
  light_xdir: Float32Array;
  ctrl: Float32Array;
  qfrc_applied: Float32Array;
  step(): void;
  forward(): void;
}

interface MuJoCoWasm {
  Model: new (path: string) => MuJoCoModel;
  State: new (model: MuJoCoModel) => MuJoCoState;
  Simulation: new (model: MuJoCoModel, state: MuJoCoState) => MuJoCoSimulation;
  FS: {
    mkdir(path: string): void;
    mount(type: unknown, options: unknown, path: string): void;
    writeFile(path: string, data: string): void;
  };
  MEMFS: unknown;
}

// Temporary utility functions until we port mujocoUtils.js
function getPosition(
  buffer: Float32Array,
  index: number,
  target: THREE.Vector3,
  swizzle = true
) {
  if (swizzle) {
    return target.set(
      buffer[index * 3 + 0],
      buffer[index * 3 + 2],
      -buffer[index * 3 + 1]
    );
  } else {
    return target.set(
      buffer[index * 3 + 0],
      buffer[index * 3 + 1],
      buffer[index * 3 + 2]
    );
  }
}

function getQuaternion(
  buffer: Float32Array,
  index: number,
  target: THREE.Quaternion,
  swizzle = true
) {
  if (swizzle) {
    return target.set(
      -buffer[index * 4 + 1],
      -buffer[index * 4 + 3],
      buffer[index * 4 + 2],
      -buffer[index * 4 + 0]
    );
  } else {
    return target.set(
      buffer[index * 4 + 0],
      buffer[index * 4 + 1],
      buffer[index * 4 + 2],
      buffer[index * 4 + 3]
    );
  }
}

function toMujocoPos(target: THREE.Vector3) {
  return target.set(target.x, -target.z, target.y);
}

function standardNormal() {
  return (
    Math.sqrt(-2.0 * Math.log(Math.random())) *
    Math.cos(2.0 * Math.PI * Math.random())
  );
}

// Temporary placeholder functions
function setupGUI(demo: unknown) {
  console.log("GUI setup placeholder");
}

async function downloadExampleScenesFolder(mujoco: MuJoCoWasm) {
  console.log("Downloading example scenes...");
  // TODO: Implement scene downloading
}

async function loadSceneFromURL(
  mujoco: MuJoCoWasm,
  filename: string,
  parent: unknown
): Promise<
  [
    MuJoCoModel,
    MuJoCoState,
    MuJoCoSimulation,
    Record<string, unknown>,
    unknown[]
  ]
> {
  console.log("Loading scene from URL...");
  // TODO: Implement scene loading
  // For now, return dummy values that match the expected types
  const dummyModel = {} as MuJoCoModel;
  const dummyState = {} as MuJoCoState;
  const dummySimulation = {} as MuJoCoSimulation;
  return [dummyModel, dummyState, dummySimulation, {}, []];
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerReady, setContainerReady] = useState(false);

  // Effect to detect when container is ready
  useEffect(() => {
    if (containerRef.current && !containerReady) {
      setContainerReady(true);
    }
  }, [containerReady]);

  useEffect(() => {
    // Don't run until container is available
    if (!containerReady) {
      return;
    }

    let demo: unknown = null;
    let animationId: number | null = null;

    const initMuJoCo = async () => {
      try {
        console.log("Starting MuJoCo initialization...");
        setIsLoading(true);
        setError(null);

        // Load MuJoCo WASM using the loader utility
        console.log("Loading MuJoCo WASM...");
        const mujoco = (await loadMuJoCo()) as MuJoCoWasm;
        console.log("MuJoCo WASM loaded successfully");

        // Set up Emscripten's Virtual File System
        console.log("Setting up file system...");
        const initialScene = "humanoid.xml";
        mujoco.FS.mkdir("/working");
        mujoco.FS.mount(mujoco.MEMFS, { root: "." }, "/working");

        console.log("Loading scene file...");
        const sceneResponse = await fetch("/examples/" + initialScene);
        if (!sceneResponse.ok) {
          throw new Error(
            `Failed to load scene file: ${sceneResponse.statusText}`
          );
        }
        const sceneText = await sceneResponse.text();
        mujoco.FS.writeFile("/working/" + initialScene, sceneText);
        console.log("Scene file loaded successfully");

        // Ensure container is available

        if (!containerRef.current) {
          throw new Error("Container element not found");
        }

        // Create MuJoCo demo instance
        console.log("Creating MuJoCo demo instance...");
        demo = new MuJoCoDemo(mujoco, initialScene, containerRef.current);
        console.log("Initializing demo...");
        await demo.init();
        console.log("Demo initialized successfully");

        // Start render loop
        console.log("Starting render loop...");
        const renderLoop = (timeMS: number) => {
          demo.render(timeMS);
          animationId = requestAnimationFrame(renderLoop);
        };
        animationId = requestAnimationFrame(renderLoop);

        console.log("MuJoCo initialization complete!");
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize MuJoCo:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize MuJoCo"
        );
        setIsLoading(false);
      }
    };

    // MuJoCo Demo class (ported from main.js)
    class MuJoCoDemo {
      mujoco: MuJoCoWasm;
      model: MuJoCoModel;
      state: MuJoCoState;
      simulation: MuJoCoSimulation;
      bodies: Record<string, unknown>;
      lights: Record<string, unknown>;
      params: MuJoCoParams;
      mujoco_time: number;
      tmpVec: THREE.Vector3;
      tmpQuat: THREE.Quaternion;
      updateGUICallbacks: unknown[];
      container: HTMLDivElement;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      dragStateManager: unknown;
      gui!: GUI;
      mujocoRoot: unknown;
      ambientLight: THREE.AmbientLight;

      constructor(
        mujoco: MuJoCoWasm,
        initialScene: string,
        container: HTMLDivElement
      ) {
        this.mujoco = mujoco;

        // Load in the state from XML
        this.model = new mujoco.Model("/working/" + initialScene);
        this.state = new mujoco.State(this.model);
        this.simulation = new mujoco.Simulation(this.model, this.state);

        // Define Random State Variables
        this.params = {
          scene: initialScene,
          paused: true,
          help: false,
          ctrlnoiserate: 0.0,
          ctrlnoisestd: 0.0,
          keyframeNumber: 0,
        };
        this.mujoco_time = 0.0;
        this.bodies = {};
        this.lights = {};
        this.tmpVec = new THREE.Vector3();
        this.tmpQuat = new THREE.Quaternion();
        this.updateGUICallbacks = [];

        this.container = container;
        console.log("Container element found", this.container);

        this.scene = new THREE.Scene();
        this.scene.name = "scene";

        this.camera = new THREE.PerspectiveCamera(
          45,
          window.innerWidth / window.innerHeight,
          0.001,
          100
        );
        this.camera.name = "PerspectiveCamera";
        this.camera.position.set(2.0, 1.7, 1.7);
        this.scene.add(this.camera);

        this.scene.background = new THREE.Color(1.0, 0.9, 0.9);
        this.scene.fog = new THREE.Fog(this.scene.background, 15, 25.5);

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.ambientLight.name = "AmbientLight";
        this.scene.add(this.ambientLight);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setAnimationLoop(this.render.bind(this));

        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(
          this.camera,
          this.renderer.domElement
        );
        this.controls.target.set(0, 0.7, 0);
        this.controls.panSpeed = 2;
        this.controls.zoomSpeed = 1;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = true;
        this.controls.update();

        window.addEventListener("resize", this.onWindowResize.bind(this));
      }

      async init() {
        // Download the examples to MuJoCo's virtual file system
        await downloadExampleScenesFolder(this.mujoco);

        // Initialize the three.js Scene using the .xml Model in initialScene
        [this.model, this.state, this.simulation, this.bodies, this.lights] =
          await loadSceneFromURL(this.mujoco, this.params.scene, this);

        this.scene.background = new THREE.Color(0xeeeeee);

        // Change the color and material properties of the mesh floor after loading the scene
        const mujocoRoot = this.scene.getObjectByName("MuJoCo Root");
        if (mujocoRoot) {
          mujocoRoot.traverse((obj: unknown) => {
            if (
              obj &&
              typeof obj === "object" &&
              "isMesh" in obj &&
              obj.isMesh &&
              "geometry" in obj &&
              obj.geometry &&
              typeof obj.geometry === "object" &&
              "type" in obj.geometry &&
              (obj.geometry.type === "PlaneGeometry" ||
                obj.constructor.name === "Reflector")
            ) {
              if (
                "material" in obj &&
                obj.material &&
                typeof obj.material === "object" &&
                "color" in obj.material
              ) {
                const material = obj.material as {
                  color: THREE.Color;
                  map: unknown;
                  reflectivity: number;
                  metalness: number;
                  needsUpdate: boolean;
                };
                material.color.set(0xdddddd);
                material.map = null;
                material.reflectivity = 0;
                material.metalness = 0;
                material.needsUpdate = true;
              }
            }
          });
        }

        this.gui = new GUI();
        setupGUI(this);
      }

      onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }

      render(timeMS: number) {
        this.controls.update();

        if (!this.params["paused"]) {
          let timestep = this.model.getOptions().timestep;
          if (timeMS - this.mujoco_time > 35.0) {
            this.mujoco_time = timeMS;
          }
          while (this.mujoco_time < timeMS) {
            // Jitter the control state with gaussian random noise
            if (this.params["ctrlnoisestd"] > 0.0) {
              let rate = Math.exp(
                -timestep / Math.max(1e-10, this.params["ctrlnoiserate"])
              );
              let scale =
                this.params["ctrlnoisestd"] * Math.sqrt(1 - rate * rate);
              let currentCtrl = this.simulation.ctrl;
              for (let i = 0; i < currentCtrl.length; i++) {
                currentCtrl[i] =
                  rate * currentCtrl[i] + scale * standardNormal();
                this.params["Actuator " + i] = currentCtrl[i];
              }
            }

            // Clear old perturbations, apply new ones.
            for (let i = 0; i < this.simulation.qfrc_applied.length; i++) {
              this.simulation.qfrc_applied[i] = 0.0;
            }

            this.simulation.step();
            this.mujoco_time += timestep * 1000.0;
          }
        } else {
          this.simulation.forward();
        }

        // Update body transforms.
        for (let b = 0; b < this.model.nbody; b++) {
          if (this.bodies[b]) {
            getPosition(this.simulation.xpos, b, this.bodies[b].position);
            getQuaternion(this.simulation.xquat, b, this.bodies[b].quaternion);
            this.bodies[b].updateWorldMatrix();
          }
        }

        // Update light transforms.
        for (let l = 0; l < this.model.nlight; l++) {
          if (this.lights[l]) {
            getPosition(this.simulation.light_xpos, l, this.lights[l].position);
            getPosition(this.simulation.light_xdir, l, this.tmpVec);
            this.lights[l].lookAt(this.tmpVec.add(this.lights[l].position));
          }
        }

        // Render!
        this.renderer.render(this.scene, this.camera);
      }
    }

    initMuJoCo();

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (demo) {
        // Clean up Three.js resources
        if (
          demo &&
          typeof demo === "object" &&
          "renderer" in demo &&
          demo.renderer
        ) {
          (demo.renderer as THREE.WebGLRenderer).dispose();
        }
        if (demo && typeof demo === "object" && "gui" in demo && demo.gui) {
          (demo.gui as GUI).destroy();
        }
        // Clean up MuJoCo resources
        if (
          demo &&
          typeof demo === "object" &&
          "simulation" in demo &&
          demo.simulation
        ) {
          (demo.simulation as MuJoCoSimulation).free();
        }
      }
      window.removeEventListener("resize", demo?.onWindowResize.bind(demo));
    };
  }, [containerReady]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-red-50">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading MuJoCo</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-center">
          <h2 className="text-xl font-bold mb-2">Loading MuJoCo...</h2>
          <p>Initializing WASM and Three.js scene</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white" ref={containerRef}>
      {/* MuJoCo WASM Viewer will be rendered here */}
    </div>
  );
}
