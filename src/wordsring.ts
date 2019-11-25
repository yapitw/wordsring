import * as THREE from "three"
import addLegacyFunc from "./legacyJsonLoader"
import { ringDimensions } from "./constant"
addLegacyFunc(THREE)


class App {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  font: THREE.Font
  shadowEnabled: boolean
  rotationY: number
  rotationX: number
  rotationKeeper: number
  twoLine: boolean

  ui: {
    inputLine1: HTMLInputElement
    inputLine2: HTMLInputElement
    selRingSize: HTMLSelectElement
    app: HTMLDivElement
    linkElem: HTMLLinkElement
  }

  element: {
    wordsRing: THREE.Object3D
    line1: THREE.Mesh
    line2: THREE.Mesh
    ring: THREE.Mesh
    darkInner: THREE.Mesh
    mainLight: THREE.SpotLight
  }

  material: {
    ringMaterial: THREE.Material
  }

  constructor() {
    this.ui = {
      inputLine1: document.querySelector("#line1"),
      inputLine2: document.querySelector("#line2"),
      selRingSize: document.querySelector("#ringSize"),
      app: document.querySelector("#canvas"),
      linkElem: document.querySelector("#myLink")
    }

    this.rotationY = 0
    this.rotationX = 0
    this.rotationKeeper = -0.01
    this.twoLine = true

    this.element = {
      wordsRing: null,
      line1: null,
      line2: null,
      ring: null,
      darkInner: null,
      mainLight: null
    };

    this.material = {
      ringMaterial: null
    }

    this.initScene()
  }

  loadAssets = async () => {
    const loadFont = () => new Promise((resolve, reject) => {
      const fontLoader = new THREE.FontLoader();
      fontLoader.load("./fonts/Arial_Bold.json", (font) => {
        this.font = font
        resolve()
      });
    })

    const loadTexture = () => new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load("textures/silverenvironment.jpg", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.material.ringMaterial = new THREE.MeshPhongMaterial({
          envMap: texture,
          color: 0xffffff,
          shininess: 80,
          specular: 0x443333
        });
        resolve()
      })
    })

    await Promise.all([
      loadFont(), loadTexture()
    ])
  }

  getYourLink = () => {
    const { ui } = this
    const tempUrl =
      `//${location.host}${location.pathname}` +
      `?{"line1":"${ui.inputLine1.value}","line2":"${ui.inputLine2.value}","ringSize":"${ui.selRingSize.value}"}`
    ui.linkElem.href = tempUrl;
    ui.linkElem.innerHTML = "My Ring";
  }

  clearInput = () => {
    const { ui, element } = this
    ui.inputLine1.value = ""
    ui.inputLine2.value = ""
    element.wordsRing.remove(element.line1)
    element.wordsRing.remove(element.line2)
    ui.linkElem.href = ""
    ui.linkElem.innerHTML = ""
  }

  twoLineSwitch = () => {
    const { ui } = this
    if (ui.inputLine1.value == "" || ui.inputLine2.value == "") {
      this.twoLine = false;
    } else {
      this.twoLine = true;
    }
  }

  loadRing = (dim: string) => {
    const jsonLoader = new THREE.LegacyJSONLoader();
    const path = `jsonring/wordsring${dim}${this.twoLine ? "" : "s"}.json`
    jsonLoader.load(path, (geometry) => {
      this.element.wordsRing.remove(this.element.ring);
      this.element.ring = new THREE.Mesh(geometry, this.material.ringMaterial);
      this.fix(this.element.ring);
      this.element.wordsRing.add(this.element.ring);
    });
  }

  fix = (mesh: THREE.Mesh) => {
    // mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();
  }

  bend = (geo: THREE.Geometry, r: number) => {
    for (let i = 0; i < geo.vertices.length; i++) {
      geo.vertices[i].z += r;
    }

    for (let i = 0; i < geo.vertices.length; i++) {
      const x = geo.vertices[i].x;
      const z = geo.vertices[i].z;
      geo.vertices[i].z = z * Math.cos(x / r);
      geo.vertices[i].x = z * Math.sin(x / r);
    }
  }

  updateText = () => {
    this.twoLineSwitch();
    this.ui.linkElem.href = ""
    this.ui.linkElem.innerText = ""
    const dim = parseFloat(this.ui.selRingSize.value);
    this.element.wordsRing.remove(this.element.darkInner);
    this.element.darkInner = new THREE.Mesh(
      new THREE.CylinderGeometry(
        ringDimensions[dim] / 2 + 1.7,
        ringDimensions[dim] / 2 + 1.7,
        6,
        32,
        1,
        true
      ),
      new THREE.MeshPhongMaterial({ color: 0x474444 })
    );
    this.element.wordsRing.add(this.element.darkInner);

    if (this.ui.inputLine1.value !== "") {
      this.element.wordsRing.remove(this.element.line1);
      const textGeo = new THREE.TextGeometry(this.ui.inputLine1.value, {
        font: this.font,
        size: 2,
        height: 1,
        curveSegments: 4,
        bevelThickness: 0.1,
        bevelSize: 0.03,
        bevelEnabled: true
      });
      textGeo.center();
      this.bend(textGeo, ringDimensions[dim] / 2 + 1.85);
      this.element.line1 = new THREE.Mesh(textGeo, this.material.ringMaterial);
      if (this.twoLine) {
        this.element.line1.position.y = +1.1;
      }
      this.fix(this.element.line1);
      this.element.wordsRing.add(this.element.line1);
    } else {
      this.element.wordsRing.remove(this.element.line1);
    }

    if (this.ui.inputLine2.value !== "") {
      this.element.wordsRing.remove(this.element.line2);
      const textGeo = new THREE.TextGeometry(this.ui.inputLine2.value, {
        font: this.font,
        size: 2,
        height: 1,
        curveSegments: 4,
        bevelThickness: 0.1,
        bevelSize: 0.03,
        bevelEnabled: true
      });
      textGeo.center();
      this.bend(textGeo, ringDimensions[dim] / 2 + 1.85);
      this.element.line2 = new THREE.Mesh(textGeo, this.material.ringMaterial);

      if (this.twoLine) {
        this.element.line2.position.y = -1.3;
      }
      this.fix(this.element.line2);
      this.element.wordsRing.add(this.element.line2);
    } else {
      this.element.wordsRing.remove(this.element.line2);
    }

    this.loadRing(this.ui.selRingSize.value);
  }

  parseLink = () => {
    if (location.search !== "") {
      const urlText = JSON.parse(decodeURI(location.search.slice(1)));
      if (urlText.line1 !== "" || (urlText.line2 !== "" && urlText.ringSize)) {
        this.ui.inputLine1.value = urlText.line1;
        this.ui.inputLine2.value = urlText.line2;
        this.ui.selRingSize.value = urlText.ringSize;
      }
    }
    this.updateText();
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.element.wordsRing.rotation.y = this.rotationY += this.rotationKeeper;
    this.element.wordsRing.rotation.x = this.rotationX;
    // mesh.geometry.computeFaceNormals();
    // mesh.geometry.computeVertexNormals();

    this.renderer.render(this.scene, this.camera);
  }

  initController = () => {
    let onPointerDownX: number
    let onPointerDownY: number
    let onPointerDownLon: number
    let onPointerDownLat: number

    const mouseDownHandler = (event: MouseEvent) => {
      event.preventDefault();
      onPointerDownX = event.clientX;
      onPointerDownY = event.clientY;
      onPointerDownLon = this.rotationY;
      onPointerDownLat = this.rotationX;
      document.addEventListener("mousemove", mouseMoveHandler, false);
      document.addEventListener("mouseup", mouseUpHandler, false);
      this.rotationKeeper = 0;
    }

    const touchStartHandler = (event: TouchEvent) => {
      event.preventDefault();
      onPointerDownX = event.touches[0].clientX
      onPointerDownY = event.touches[0].clientY
      onPointerDownLon = this.rotationY
      onPointerDownLat = this.rotationX
      document.addEventListener("touchmove", touchMoveHandler, false)
      document.addEventListener("touchend", mouseUpHandler, false)
      this.rotationKeeper = 0
    }

    this.renderer.domElement.addEventListener("mousedown", mouseDownHandler, false);
    this.renderer.domElement.addEventListener("touchstart", touchStartHandler, false);

    const mouseMoveHandler = (event: MouseEvent) => {
      this.rotationY = (event.clientX - onPointerDownX) * 0.01 + onPointerDownLon;
      this.rotationX = (event.clientY - onPointerDownY) * 0.01 + onPointerDownLat;
    }

    const touchMoveHandler = (event: TouchEvent) => {
      this.rotationY =
        (event.touches[0].clientX - onPointerDownX) * 0.01 +
        onPointerDownLon;
      this.rotationX =
        (event.touches[0].clientY - onPointerDownY) * 0.01 +
        onPointerDownLat;
    }

    const mouseUpHandler = () => {
      document.removeEventListener("mousemove", mouseMoveHandler, false);
      document.removeEventListener("touchmove", touchMoveHandler, false);
      document.removeEventListener("mouseup", mouseUpHandler, false);
      document.removeEventListener("touchend", mouseUpHandler, false);
      this.rotationKeeper = -0.01;
    }

    this.ui.inputLine1.addEventListener("input", this.updateText);
    this.ui.inputLine2.addEventListener("input", this.updateText);
    this.ui.selRingSize.addEventListener("change", this.updateText);
    document.querySelector("#getYourLink").addEventListener("click", this.getYourLink)
    document.querySelector("#clearInput").addEventListener("click", this.clearInput)
  }

  initScene = async () => {
    await this.loadAssets()
    this.shadowEnabled = false
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x000000, 55, 150);
    this.camera = new THREE.PerspectiveCamera(30, 320 / 250, 0.1, 1000);
    this.camera.position.z = 60;
    this.camera.position.y = 10;
    this.camera.lookAt(new THREE.Vector3(0, -1, 0));

    this.renderer.setPixelRatio(2);
    // renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(320, 250);
    this.renderer.autoClearColor = true;
    this.ui.app.appendChild(this.renderer.domElement);

    this.element.mainLight = new THREE.SpotLight(0xffffff);
    this.element.mainLight.position.x = 10;
    this.element.mainLight.position.y = 0;
    this.element.mainLight.position.z = 50;
    this.scene.add(this.element.mainLight);

    this.element.wordsRing = new THREE.Object3D();
    this.scene.add(this.element.wordsRing);

    if (this.shadowEnabled) {
      this.renderer.shadowMap.enabled = true;
      // this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.element.mainLight.castShadow = true;
      // this.element.mainLight.shadow.bias = 0.000001;
      this.element.mainLight.shadow.mapSize.width = 2048;
      this.element.mainLight.shadow.mapSize.height = 2048;
      this.element.ring.receiveShadow = true;
      // this.element.ring.castShadow = true;
      this.element.line1.castShadow = true;
      this.element.line1.receiveShadow = true;
      this.element.line2.castShadow = true;
      this.element.line2.receiveShadow = true;
    }

    this.initController()
    this.parseLink();
    this.render();
  }
}

new App()
