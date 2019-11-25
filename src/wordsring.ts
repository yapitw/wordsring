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
  generating: boolean
  timeoutId: number[]

  data: {
    line1: string
    line2: string
    ringSize: string
  }

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
    ringMeshes: { [key: string]: THREE.Geometry }
  }

  material: {
    ringMaterial: THREE.Material
  }

  constructor() {

    this.data = {
      line1: "",
      line2: "",
      ringSize: ""
    }

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
    this.timeoutId = []

    this.element = {
      wordsRing: null,
      line1: null,
      line2: null,
      ring: null,
      darkInner: null,
      mainLight: null,
      ringMeshes: {}
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
    const { ui, data } = this
    const tempUrl =
      `//${location.host}${location.pathname}` +
      `?{"line1":"${data.line1}","line2":"${data.line2}","ringSize":"${data.ringSize}"}`
    ui.linkElem.href = tempUrl;
    ui.linkElem.innerHTML = "My Ring";
  }

  clearInput = () => {
    const { ui, data, element } = this
    ui.inputLine1.value = data.line1 = ""
    ui.inputLine2.value = data.line2 = ""
    element.wordsRing.remove(element.line1)
    element.wordsRing.remove(element.line2)
    ui.linkElem.href = ""
    ui.linkElem.innerHTML = ""
  }

  twoLineSwitch = () => {
    const { data } = this
    let switched = false
    if ((data.line1 == "" || data.line2 == "") && this.twoLine === true) {
      this.twoLine = false;
      return switched = true
    }
    if ((data.line1 !== "" && data.line2 !== "") && this.twoLine === false) {
      this.twoLine = true
      return switched = true
    }
    return switched
  }

  loadRing = async (dim: string) => {
    const jsonLoader = new THREE.LegacyJSONLoader();
    const ringName = `wordsring${dim}${this.twoLine ? "" : "s"}`
    const geometry = this.element.ringMeshes[ringName] ||
      await new Promise<THREE.Geometry>((resolve, reject) => {
        jsonLoader.load(`jsonring/${ringName}.json`, (geometry: THREE.Geometry) => {
          resolve(this.element.ringMeshes[ringName] = geometry)
        });
      })

    this.element.wordsRing.remove(this.element.ring)
    this.element.ring = new THREE.Mesh(geometry, this.material.ringMaterial)
    this.fix(this.element.ring);
    this.element.wordsRing.add(this.element.ring);
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

  updateText = async () => {
    this.generating = true
    this.ui.linkElem.href = ""
    this.ui.linkElem.innerText = ""

    const ringSizeChanged = this.data.ringSize !== this.ui.selRingSize.value
    const line1changed = this.data.line1 !== this.ui.inputLine1.value
    const line2changed = this.data.line2 !== this.ui.inputLine2.value

    this.data.ringSize = this.ui.selRingSize.value
    this.data.line1 = this.ui.inputLine1.value
    this.data.line2 = this.ui.inputLine2.value

    const ringHeightChanged = this.twoLineSwitch();

    if (ringSizeChanged || ringHeightChanged) {
      window.clearTimeout(this.timeoutId[0])
      this.timeoutId[0] = window.setTimeout(this.updateRing, 100)
    }

    if ((ringSizeChanged || ringHeightChanged || line1changed) && this.data.line1 !== "") {
      window.clearTimeout(this.timeoutId[1])
      this.timeoutId[1] = window.setTimeout(() => this.updateTextElement(1), 100)
    } else if (this.data.line1 == "") {
      this.element.wordsRing.remove(this.element.line1);
    }

    if ((ringSizeChanged || ringHeightChanged || line2changed) && this.data.line2 !== "") {
      window.clearTimeout(this.timeoutId[2])
      this.timeoutId[2] = window.setTimeout(() => this.updateTextElement(2), 100)
    } else if (this.data.line2 == "") {
      this.element.wordsRing.remove(this.element.line2);
    }
  }

  updateRing = () => {
    const dim = parseFloat(this.data.ringSize)
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
    this.loadRing(this.data.ringSize);
  }

  updateTextElement = (seq: number) => {
    const dim = parseFloat(this.data.ringSize)
    const dataText = this.data["line" + seq]
    this.element.wordsRing.remove(this.element["line" + seq]);
    const textGeo = new THREE.TextGeometry(dataText, {
      font: this.font,
      size: 2,
      height: 1,
      curveSegments: 2,
      bevelThickness: 0.1,
      bevelSize: 0.03,
      bevelEnabled: true
    });
    textGeo.center();
    this.bend(textGeo, ringDimensions[dim] / 2 + 1.85);
    this.element["line" + seq] = new THREE.Mesh(textGeo, this.material.ringMaterial);

    if (this.twoLine) {
      this.element["line" + seq].position.y = 1.1 - (seq - 1) * 2.5;
    }
    this.fix(this.element["line" + seq]);
    this.element.wordsRing.add(this.element["line" + seq]);
  }

  parseLink = () => {
    let urlText
    if (location.search !== "") {
      urlText = JSON.parse(decodeURI(location.search.slice(1)));
    }

    if (urlText && (urlText.line1 !== "" || urlText.line2 !== "") && urlText.ringSize) {
      this.ui.inputLine1.value = urlText.line1;
      this.ui.inputLine2.value = urlText.line2;
      this.ui.selRingSize.value = urlText.ringSize;
    } else {
      this.ui.inputLine1.value = "As selfishness and complaint cloud the mind,"
      this.ui.inputLine2.value = "so love with its joy clears and sharpens the vision."
      this.ui.selRingSize.value = "15"
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
    setTimeout(() => {
      this.ui.app.classList.remove('canvas--loading');
    }, 100)
    setTimeout(() => {
      this.ui.app.querySelector(".loading-spin").remove();
    }, 500)


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
