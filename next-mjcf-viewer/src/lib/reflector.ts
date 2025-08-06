import * as THREE from "three";

export class Reflector extends THREE.Mesh {
  constructor(geometry: THREE.BufferGeometry, options: any) {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.5,
    });

    super(geometry, material);
  }
}
