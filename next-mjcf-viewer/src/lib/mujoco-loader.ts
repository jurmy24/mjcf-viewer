// MuJoCo WASM loader utility for Next.js

interface MuJoCoWasm {
  Model: new (path: string) => any;
  State: new (model: any) => any;
  Simulation: new (model: any, state: any) => any;
  FS: {
    mkdir(path: string): void;
    mount(type: any, options: any, path: string): void;
    writeFile(path: string, data: string): void;
  };
  MEMFS: any;
}

let mujocoModule: MuJoCoWasm | null = null;

export async function loadMuJoCo(): Promise<MuJoCoWasm> {
  if (mujocoModule) {
    console.log("Returning cached MuJoCo module");
    return mujocoModule;
  }

  try {
    console.log("Loading MuJoCo loader script...");

    // Load the external loader script
    const script = document.createElement("script");
    script.src = "/mujoco-loader.js";
    script.type = "module";

    await new Promise<void>((resolve, reject) => {
      script.onload = () => {
        console.log("MuJoCo loader script loaded successfully");
        resolve();
      };
      script.onerror = (error) => {
        console.error("MuJoCo loader script failed to load:", error);
        reject(error);
      };
      document.head.appendChild(script);
    });

    // Give it a moment to initialize
    console.log("Waiting for module initialization...");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Access the globally exposed function
    // @ts-expect-error - Global from loader script
    const loadFunction = window.__mujocoLoadFunction;

    if (!loadFunction) {
      throw new Error("MuJoCo load function not found in global scope");
    }

    console.log("Calling MuJoCo load function...");
    // Call the load function to get the initialized module
    mujocoModule = await loadFunction();
    console.log("MuJoCo module loaded:", mujocoModule);

    // Wait for the module to be ready
    if (mujocoModule && (mujocoModule as any).ready) {
      console.log("Waiting for module ready state...");
      mujocoModule = await (mujocoModule as any).ready;
      console.log("Module ready state resolved");
    }

    // Clean up the global variable
    // @ts-expect-error - Global from loader script
    delete window.__mujocoLoadFunction;

    console.log("MuJoCo loading complete!");
    return mujocoModule;
  } catch (error) {
    console.error("Failed to load MuJoCo WASM:", error);
    throw error;
  }
}
