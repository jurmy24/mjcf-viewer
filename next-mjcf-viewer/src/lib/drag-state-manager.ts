import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class DragStateManager {
  public physicsObject: any = null;
  public worldHit: THREE.Vector3;
  public currentWorld: THREE.Vector3;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private container: HTMLElement;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    container: HTMLElement,
    controls: OrbitControls
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.container = container;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.worldHit = new THREE.Vector3();
    this.currentWorld = new THREE.Vector3();

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.container.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.container.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.container.addEventListener("mouseup", this.onMouseUp.bind(this));
  }

  private onMouseDown(event: MouseEvent) {
    this.updateMousePosition(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );
    if (intersects.length > 0) {
      const intersect = intersects[0];
      this.physicsObject = intersect.object;
      this.worldHit.copy(intersect.point);
      this.currentWorld.copy(intersect.point);
      this.controls.enabled = false;
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (this.physicsObject) {
      this.updateMousePosition(event);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      );
      if (intersects.length > 0) {
        this.currentWorld.copy(intersects[0].point);
      }
    }
  }

  private onMouseUp() {
    this.physicsObject = null;
    this.controls.enabled = true;
  }

  private updateMousePosition(event: MouseEvent) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  update() {
    // Update logic for dragging
  }
}
