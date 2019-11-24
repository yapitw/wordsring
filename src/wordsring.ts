import * as THREE from "three"
import addon from "./legacyJsonLoader"
import { ringDimensions } from "./constant"
addon(THREE)


class App {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  mainLight: THREE.SpotLight
  fontLoader: THREE.FontLoader
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
  }

  element: {
    wordsRing: THREE.Object3D
    line1: THREE.Mesh
    line2: THREE.Mesh
    ring: THREE.Mesh
    darkInner: THREE.Mesh
  }

  material: {
    ringMaterial: THREE.Material
  }

  constructor() {
    this.ui = {
      inputLine1: document.querySelector("#line1"),
      inputLine2: document.querySelector("#line2"),
      selRingSize: document.querySelector("#ringSize"),
      app: document.querySelector("#canvas")
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
    };

    this.material = {
      ringMaterial: null
    }

    this.init()
  }

  getYourLink = () => {
    const linkElem: HTMLLinkElement = document.querySelector("#myLink")
    const tempUrl =
      `//${location.host}${location.pathname}` +
      `?{"line1":"${this.ui.inputLine1.value}","line2":"${this.ui.inputLine2.value}","ringSize":"${this.ui.selRingSize.value}"}`
    linkElem.href = tempUrl;
    linkElem.innerHTML = tempUrl;
  }

  clearInput = () => {
    const linkElem: HTMLLinkElement = document.querySelector("#myLink")
    this.ui.inputLine1.value = "";
    this.ui.inputLine2.value = "";
    this.element.wordsRing.remove(this.element.line1);
    this.element.wordsRing.remove(this.element.line2);
    linkElem.href = "";
    linkElem.innerHTML = "";
  }

  twoLineSwitch = () => {
    if (this.ui.inputLine1.value == "" || this.ui.inputLine2.value == "") {
      this.twoLine = false;
    } else {
      this.twoLine = true;
    }
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.element.wordsRing.rotation.y = this.rotationY += this.rotationKeeper;
    this.element.wordsRing.rotation.x = this.rotationX;
    // mesh.geometry.computeFaceNormals();
    // mesh.geometry.computeVertexNormals();

    this.renderer.render(this.scene, this.camera);
  }

  init = () => {
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

    this.mainLight = new THREE.SpotLight(0xffffff);
    this.mainLight.position.x = 10;
    this.mainLight.position.y = 0;
    this.mainLight.position.z = 50;
    this.scene.add(this.mainLight);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("textures/silverenvironment.jpg", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.material.ringMaterial = new THREE.MeshPhongMaterial({
        envMap: texture,
        color: 0xffffff,
        shininess: 80,
        specular: 0x443333
      });
      parseLink();
      this.render();
    });


    this.element.wordsRing = new THREE.Object3D();
    this.scene.add(this.element.wordsRing);

    this.fontLoader = new THREE.FontLoader();

    const loadText = () => {
      this.twoLineSwitch();
      var dim = parseFloat(this.ui.selRingSize.value);
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
        this.fontLoader.load("./fonts/Arial_Bold.json", (font) => {
          this.element.wordsRing.remove(this.element.line1);
          var textGeo = new THREE.TextGeometry(this.ui.inputLine1.value, {
            font: font,

            size: 2,
            height: 1,
            curveSegments: 4,

            bevelThickness: 0.1,
            bevelSize: 0.03,
            bevelEnabled: true
          });
          textGeo.center();
          bend(textGeo, ringDimensions[dim] / 2 + 1.85);
          this.element.line1 = new THREE.Mesh(textGeo, this.material.ringMaterial);
          if (this.twoLine) {
            this.element.line1.position.y = +1.1;
          }
          fix(this.element.line1);
          this.element.wordsRing.add(this.element.line1);
        });
      } else {
        this.element.wordsRing.remove(this.element.line1);
      }

      if (this.ui.inputLine2.value !== "") {
        this.fontLoader.load("./fonts/Arial_Bold.json", (font) => {
          this.element.wordsRing.remove(this.element.line2);
          var textGeo = new THREE.TextGeometry(this.ui.inputLine2.value, {
            font: font,

            size: 2,
            height: 1,
            curveSegments: 4,

            bevelThickness: 0.1,
            bevelSize: 0.03,
            bevelEnabled: true
          });
          textGeo.center();
          bend(textGeo, ringDimensions[dim] / 2 + 1.85);
          this.element.line2 = new THREE.Mesh(textGeo, this.material.ringMaterial);

          if (this.twoLine) {
            this.element.line2.position.y = -1.3;
          }
          fix(this.element.line2);
          this.element.wordsRing.add(this.element.line2);
        });
      } else {
        this.element.wordsRing.remove(this.element.line2);
      }

      loadRing(this.ui.selRingSize.value);
    }

    const loadRing = (dim: string) => {
      const jsonLoader = new THREE.LegacyJSONLoader();
      const path = this.twoLine
        ? "jsonring/wordsring" + dim + ".json"
        : "jsonring/wordsring" + dim + "s.json";
      jsonLoader.load(path, (geometry) => {
        this.element.wordsRing.remove(this.element.ring);
        this.element.ring = new THREE.Mesh(geometry, this.material.ringMaterial);
        fix(this.element.ring);
        this.element.wordsRing.add(this.element.ring);
      });
    }

    const bend = (geo, r) => {
      for (let i = 0; i < geo.vertices.length; i++) {
        geo.vertices[i].z += r;
      }

      for (let i = 0; i < geo.vertices.length; i++) {
        var x = geo.vertices[i].x;
        var z = geo.vertices[i].z;
        geo.vertices[i].z = z * Math.cos(x / r);
        geo.vertices[i].x = z * Math.sin(x / r);
      }
    }



    if (this.shadowEnabled) {
      this.renderer.shadowMap.enabled = true;
      // this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.mainLight.castShadow = true;
      // this.mainLight.shadow.bias = 0.000001;
      this.mainLight.shadow.mapSize.width = 2048;
      this.mainLight.shadow.mapSize.height = 2048;
      this.element.ring.receiveShadow = true;
      // this.element.ring.castShadow = true;
      this.element.line1.castShadow = true;
      this.element.line1.receiveShadow = true;
      this.element.line2.castShadow = true;
      this.element.line2.receiveShadow = true;
    }

    const fix = (mesh) => {
      mesh.geometry.computeFaceNormals();
      mesh.geometry.computeVertexNormals();
    }

    const parseLink = () => {
      if (location.search !== "") {
        const urlText = JSON.parse(decodeURI(location.search.slice(1)));
        if (urlText.line1 !== "" || (urlText.line2 !== "" && urlText.ringSize)) {
          this.ui.inputLine1.value = urlText.line1;
          this.ui.inputLine2.value = urlText.line2;
          this.ui.selRingSize.value = urlText.ringSize;
        }
      }
      loadText();
    }

    document.querySelector("#getYourLink").addEventListener("click", this.getYourLink)
    document.querySelector("#clearInput").addEventListener("click", this.clearInput)


    let onPointerDownPointerX: number
    let onPointerDownPointerY: number
    let onPointerDownLon: number
    let onPointerDownLat: number


    const MouseDown = (event) => {
      event.preventDefault();
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = this.rotationY;
      onPointerDownLat = this.rotationX;
      document.addEventListener("mousemove", MouseMove, false);
      document.addEventListener("mouseup", MouseUp, false);
      this.rotationKeeper = 0;
    }

    const TouchStart = (event) => {
      event.preventDefault();
      onPointerDownPointerX = event.touches[0].clientX
      onPointerDownPointerY = event.touches[0].clientY
      onPointerDownLon = this.rotationY
      onPointerDownLat = this.rotationX
      document.addEventListener("touchmove", TouchMove, false)
      document.addEventListener("touchend", MouseUp, false)
      this.rotationKeeper = 0
    }

    this.renderer.domElement.addEventListener("mousedown", MouseDown, false);
    this.renderer.domElement.addEventListener("touchstart", TouchStart, false);

    const MouseMove = (event) => {
      this.rotationY = (event.clientX - onPointerDownPointerX) * 0.01 + onPointerDownLon;
      this.rotationX = (event.clientY - onPointerDownPointerY) * 0.01 + onPointerDownLat;
    }

    const TouchMove = (event) => {
      this.rotationY =
        (event.touches[0].clientX - onPointerDownPointerX) * 0.01 +
        onPointerDownLon;
      this.rotationX =
        (event.touches[0].clientY - onPointerDownPointerY) * 0.01 +
        onPointerDownLat;
    }

    const MouseUp = () => {
      document.removeEventListener("mousemove", MouseMove, false);
      document.removeEventListener("touchmove", TouchMove, false);
      document.removeEventListener("mouseup", MouseUp, false);
      document.removeEventListener("touchend", MouseUp, false);
      this.rotationKeeper = -0.01;
    }

    this.ui.inputLine1.addEventListener("input", loadText);
    this.ui.inputLine2.addEventListener("input", loadText);
    this.ui.selRingSize.addEventListener("change", loadText);
  }
}

new App()