import * as THREE from "three";
import { Reflector } from "./reflector";
import type { MuJoCoDemo } from "./mujoco-demo";

export async function reloadFunc(this: MuJoCoDemo) {
  this.scene.remove(this.scene.getObjectByName("MuJoCo Root"));
  [this.model, this.state, this.simulation, this.bodies, this.lights] =
    await loadSceneFromURL(this.mujoco, this.params.scene, this);
  this.simulation.forward();
  for (let i = 0; i < this.updateGUICallbacks.length; i++) {
    this.updateGUICallbacks[i](this.model, this.simulation, this.params);
  }
}

export function setupGUI(parentContext: MuJoCoDemo) {
  // Make sure we reset the camera when the scene is changed or reloaded.
  parentContext.updateGUICallbacks.length = 0;
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    parentContext.camera.position.set(2.0, 1.7, 1.7);
    parentContext.controls.target.set(0, 0.7, 0);
    parentContext.controls.update();
  });

  // Add scene selection dropdown.
  let reload = reloadFunc.bind(parentContext);
  parentContext.gui
    .add(parentContext.params, "scene", {
      Humanoid: "humanoid.xml",
      Cassie: "agility_cassie/scene.xml",
      Hammock: "hammock.xml",
      Balloons: "balloons.xml",
      Hand: "shadow_hand/scene_right.xml",
      Flag: "flag.xml",
      Mug: "mug.xml",
      Tendon: "model_with_tendon.xml",
    })
    .name("Example Scene")
    .onChange(reload);

  // Add pause simulation checkbox.
  const simulationFolder = parentContext.gui.addFolder("Simulation");
  const pauseSimulation = simulationFolder
    .add(parentContext.params, "paused")
    .name("Pause Simulation");

  pauseSimulation.onChange((value) => {
    if (value) {
      const pausedText = document.createElement("div");
      pausedText.style.position = "absolute";
      pausedText.style.top = "10px";
      pausedText.style.left = "10px";
      pausedText.style.color = "white";
      pausedText.style.font = "normal 18px Arial";
      pausedText.innerHTML = "pause";
      parentContext.container.appendChild(pausedText);
    } else {
      parentContext.container.removeChild(parentContext.container.lastChild);
    }
  });

  // Add reload model button.
  simulationFolder
    .add(
      {
        reload: () => {
          reload();
        },
      },
      "reload"
    )
    .name("Reload");

  // Add reset simulation button.
  const resetSimulation = () => {
    parentContext.simulation.resetData();
    parentContext.simulation.forward();
  };
  simulationFolder
    .add(
      {
        reset: () => {
          resetSimulation();
        },
      },
      "reset"
    )
    .name("Reset");

  // Add keyframe slider.
  let nkeys = parentContext.model.nkey;
  let keyframeGUI = simulationFolder
    .add(parentContext.params, "keyframeNumber", 0, nkeys - 1, 1)
    .name("Load Keyframe")
    .listen();
  keyframeGUI.onChange((value) => {
    if (value < parentContext.model.nkey) {
      parentContext.simulation.qpos.set(
        parentContext.model.key_qpos.slice(
          value * parentContext.model.nq,
          (value + 1) * parentContext.model.nq
        )
      );
    }
  });

  // Add sliders for ctrlnoiserate and ctrlnoisestd.
  simulationFolder
    .add(parentContext.params, "ctrlnoiserate", 0.0, 2.0, 0.01)
    .name("Noise rate");
  simulationFolder
    .add(parentContext.params, "ctrlnoisestd", 0.0, 2.0, 0.01)
    .name("Noise scale");

  parentContext.gui.open();
}

export async function loadSceneFromURL(
  mujoco: any,
  filename: string,
  parent: MuJoCoDemo
) {
  // Free the old simulation.
  if (parent.simulation != null) {
    parent.simulation.free();
    parent.model = null;
    parent.state = null;
    parent.simulation = null;
  }

  // Load in the state from XML.
  parent.model = mujoco.Model.load_from_xml("/working/" + filename);
  parent.state = new mujoco.State(parent.model);
  parent.simulation = new mujoco.Simulation(parent.model, parent.state);

  let model = parent.model;
  let state = parent.state;
  let simulation = parent.simulation;

  // Decode the null-terminated string names.
  let textDecoder = new TextDecoder("utf-8");
  let names_array = new Uint8Array(model.names);
  let fullString = textDecoder.decode(model.names);
  let names = fullString.split(textDecoder.decode(new ArrayBuffer(1)));

  // Create the root object.
  let mujocoRoot = new THREE.Group();
  mujocoRoot.name = "MuJoCo Root";
  parent.scene.add(mujocoRoot);

  let bodies: Record<number, THREE.Group> = {};
  let meshes: Record<number, THREE.BufferGeometry> = {};
  let lights: THREE.Light[] = [];

  // Default material definition.
  let material = new THREE.MeshPhysicalMaterial();
  material.color = new THREE.Color(1, 1, 1);

  // Loop through the MuJoCo geoms and recreate them in three.js.
  for (let g = 0; g < model.ngeom; g++) {
    // Only visualize geom groups up to 2 (same default behavior as simulate).
    if (!(model.geom_group[g] < 3)) {
      continue;
    }

    // Get the body ID and type of the geom.
    let b = model.geom_bodyid[g];
    let type = model.geom_type[g];
    let size = [
      model.geom_size[g * 3 + 0],
      model.geom_size[g * 3 + 1],
      model.geom_size[g * 3 + 2],
    ];

    // Create the body if it doesn't exist.
    if (!(b in bodies)) {
      bodies[b] = new THREE.Group();

      let start_idx = model.name_bodyadr[b];
      let end_idx = start_idx;
      while (end_idx < names_array.length && names_array[end_idx] !== 0) {
        end_idx++;
      }
      let name_buffer = names_array.subarray(start_idx, end_idx);
      bodies[b].name = textDecoder.decode(name_buffer);

      (bodies[b] as any).bodyID = b;
      (bodies[b] as any).has_custom_mesh = false;
    }

    // Set the default geometry. In MuJoCo, this is a sphere.
    let geometry = new THREE.SphereGeometry(size[0] * 0.5);
    if (type == mujoco.mjtGeom.mjGEOM_PLANE.value) {
      // Special handling for plane later.
    } else if (type == mujoco.mjtGeom.mjGEOM_SPHERE.value) {
      geometry = new THREE.SphereGeometry(size[0]);
    } else if (type == mujoco.mjtGeom.mjGEOM_CAPSULE.value) {
      geometry = new THREE.CapsuleGeometry(size[0], size[1] * 2.0, 20, 20);
    } else if (type == mujoco.mjtGeom.mjGEOM_ELLIPSOID.value) {
      geometry = new THREE.SphereGeometry(1); // Stretch this below
    } else if (type == mujoco.mjtGeom.mjGEOM_CYLINDER.value) {
      geometry = new THREE.CylinderGeometry(size[0], size[0], size[1] * 2.0);
    } else if (type == mujoco.mjtGeom.mjGEOM_BOX.value) {
      geometry = new THREE.BoxGeometry(
        size[0] * 2.0,
        size[2] * 2.0,
        size[1] * 2.0
      );
    }

    // Set the Material Properties
    let color = [
      model.geom_rgba[g * 4 + 0],
      model.geom_rgba[g * 4 + 1],
      model.geom_rgba[g * 4 + 2],
      model.geom_rgba[g * 4 + 3],
    ];
    if (model.geom_matid[g] != -1) {
      let matId = model.geom_matid[g];
      color = [
        model.mat_rgba[matId * 4 + 0],
        model.mat_rgba[matId * 4 + 1],
        model.mat_rgba[matId * 4 + 2],
        model.mat_rgba[matId * 4 + 3],
      ];
    }

    material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color[0], color[1], color[2]),
      transparent: color[3] < 1.0,
      opacity: color[3],
    });

    let mesh: THREE.Mesh;
    if (type == 0) {
      mesh = new Reflector(new THREE.PlaneGeometry(100, 100), {
        clipBias: 0.003,
      }) as any;
      mesh.rotateX(-Math.PI / 2);
    } else {
      mesh = new THREE.Mesh(geometry, material);
    }

    mesh.castShadow = g == 0 ? false : true;
    mesh.receiveShadow = type != 7;
    (mesh as any).bodyID = b;
    bodies[b].add(mesh);
    getPosition(model.geom_pos, g, mesh.position);
    if (type != 0) {
      getQuaternion(model.geom_quat, g, mesh.quaternion);
    }
    if (type == 4) {
      mesh.scale.set(size[0], size[2], size[1]);
    }
  }

  // Parse tendons.
  let tendonMat = new THREE.MeshPhongMaterial();
  tendonMat.color = new THREE.Color(0.8, 0.3, 0.3);
  (mujocoRoot as any).cylinders = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1),
    tendonMat,
    1023
  );
  (mujocoRoot as any).cylinders.receiveShadow = true;
  (mujocoRoot as any).cylinders.castShadow = true;
  mujocoRoot.add((mujocoRoot as any).cylinders);
  (mujocoRoot as any).spheres = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 10),
    tendonMat,
    1023
  );
  (mujocoRoot as any).spheres.receiveShadow = true;
  (mujocoRoot as any).spheres.castShadow = true;
  mujocoRoot.add((mujocoRoot as any).spheres);

  // Parse lights.
  for (let l = 0; l < model.nlight; l++) {
    let light: THREE.Light;
    if (model.light_directional[l]) {
      light = new THREE.DirectionalLight();
    } else {
      light = new THREE.SpotLight();
    }
    (light as any).decay = model.light_attenuation[l] * 100;
    (light as any).penumbra = 0.5;
    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 10;

    if (bodies[0]) {
      bodies[0].add(light);
    } else {
      mujocoRoot.add(light);
    }
    lights.push(light);
  }
  if (model.nlight == 0) {
    let light = new THREE.DirectionalLight();
    mujocoRoot.add(light);
  }

  for (let b = 0; b < model.nbody; b++) {
    if (b == 0 || !bodies[0]) {
      mujocoRoot.add(bodies[b]);
    } else if (bodies[b]) {
      bodies[0].add(bodies[b]);
    } else {
      console.log(
        "Body without Geometry detected; adding to bodies",
        b,
        bodies[b]
      );
      bodies[b] = new THREE.Group();
      bodies[b].name = names[b + 1];
      (bodies[b] as any).bodyID = b;
      (bodies[b] as any).has_custom_mesh = false;
      bodies[0].add(bodies[b]);
    }
  }

  (parent as any).mujocoRoot = mujocoRoot;

  return [model, state, simulation, bodies, lights];
}

export async function downloadExampleScenesFolder(mujoco: any) {
  let allFiles = [
    "22_humanoids.xml",
    "adhesion.xml",
    "agility_cassie/scene.xml",
    "arm26.xml",
    "balloons.xml",
    "flag.xml",
    "hammock.xml",
    "humanoid.xml",
    "humanoid_body.xml",
    "mug.xml",
    "scene.xml",
    "shadow_hand/scene_right.xml",
    "simple.xml",
    "slider_crank.xml",
    "model_with_tendon.xml",
  ];

  let requests = allFiles.map((url) => fetch("/examples/scenes/" + url));
  let responses = await Promise.all(requests);
  for (let i = 0; i < responses.length; i++) {
    let split = allFiles[i].split("/");
    let working = "/working/";
    for (let f = 0; f < split.length - 1; f++) {
      working += split[f];
      if (!mujoco.FS.analyzePath(working).exists) {
        mujoco.FS.mkdir(working);
      }
      working += "/";
    }

    if (
      allFiles[i].endsWith(".png") ||
      allFiles[i].endsWith(".stl") ||
      allFiles[i].endsWith(".skn")
    ) {
      mujoco.FS.writeFile(
        "/working/" + allFiles[i],
        new Uint8Array(await responses[i].arrayBuffer())
      );
    } else {
      mujoco.FS.writeFile("/working/" + allFiles[i], await responses[i].text());
    }
  }
}

export function getPosition(
  buffer: Float32Array | Float64Array,
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

export function getQuaternion(
  buffer: Float32Array | Float64Array,
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

export function toMujocoPos(target: THREE.Vector3) {
  return target.set(target.x, -target.z, target.y);
}

export function standardNormal() {
  return (
    Math.sqrt(-2.0 * Math.log(Math.random())) *
    Math.cos(2.0 * Math.PI * Math.random())
  );
}
