import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import gsap from "gsap";
import { animateAssembly } from "../animations/assembly";
import { createCamera, type Part } from "../models/camera";
export interface ViewerAPI {
  view: (name: string) => void;
  focus: (id: string) => void;
  screenshot: () => void;
}
interface Props {
  explosion: number;
  autoRotate: boolean;
  xray: number;
  selected: string | null;
  labels: boolean;
  connections: boolean;
  simplified: boolean;
  onSelect: (id: string) => void;
  onReady: (parts: Omit<Part, "group" | "home" | "offset">[]) => void;
  onError: (message: string) => void;
}
export const CameraViewer = forwardRef<ViewerAPI, Props>(
  function CameraViewer(props, ref) {
    const mount = useRef<HTMLDivElement>(null),
      state = useRef<{
        renderer: T.WebGLRenderer;
        camera: T.PerspectiveCamera;
        controls: OrbitControls;
        parts: Part[];
        root: T.Group;
        software: boolean;
      } | null>(null),
      latest = useRef(props),
      dirty = useRef(true);
    latest.current = props;
    dirty.current = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    function move(position: T.Vector3, target = new T.Vector3(0, 0, 0.45)) {
      const s = state.current;
      if (!s) return;
      gsap.to(s.camera.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: reduced ? 0 : 1.1,
        ease: "power2.inOut",
        overwrite: true,
      });
      gsap.to(s.controls.target, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: reduced ? 0 : 1.1,
        overwrite: true,
      });
    }
    const focus = (id: string) => {
      const s = state.current,
        p = s?.parts.find((p) => p.id === id);
      if (!s || !p) return;
      const target = p.group.getWorldPosition(new T.Vector3());
      move(target.clone().add(new T.Vector3(-1.8, 1.1, 3.3)), target);
    };
    useImperativeHandle(ref, () => ({
      view(name) {
        const positions: Record<string, number[]> = {
          "Three-quarter": [-4.7, 2.5, 6.5],
          Front: [0, 0.1, 8],
          Back: [0, 0.2, -8],
          Left: [-8, 0.3, 0.5],
          Right: [8, 0.3, 0.5],
          Top: [0, 8, 0.5],
          Bottom: [0, -8, 0.5],
          Internal: [-5, 3, 9],
        };
        const p = positions[name] ?? positions["Three-quarter"];
        const scale = 1 + latest.current.explosion * 0.0105;
        const target = new T.Vector3(
          0,
          0,
          0.45 + latest.current.explosion * 0.007,
        );
        move(
          new T.Vector3(...p)
            .sub(new T.Vector3(0, 0, 0.45))
            .multiplyScalar(scale)
            .add(target),
          target,
        );
      },
      focus,
      screenshot() {
        const s = state.current;
        if (!s) return;
        const a = document.createElement("a");
        a.download = "camera-lab.png";
        a.href = s.renderer.domElement.toDataURL("image/png");
        a.click();
      },
    }));
    useEffect(() => {
      const host = mount.current!;
      let renderer: T.WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
      } catch {
        latest.current.onError(
          "WebGL is unavailable. Enable hardware acceleration or try a WebGL-capable browser.",
        );
        return;
      }
      const gl = renderer.getContext(),
        debug = gl.getExtension("WEBGL_debug_renderer_info");
      const software = debug
        ? /swiftshader|llvmpipe|software/i.test(
            gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
          )
        : false;
      renderer.setPixelRatio(software ? 0.8 : Math.min(devicePixelRatio, 1.75));
      renderer.shadowMap.enabled = !software;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.65;
      host.appendChild(renderer.domElement);
      const scene = new T.Scene(),
        camera = new T.PerspectiveCamera(36, 1, 0.1, 80);
      camera.position.set(-4.7, 2.5, 6.5);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0.45);
      controls.enableDamping = true;
      controls.dampingFactor = 0.065;
      controls.minDistance = 2.2;
      controls.maxDistance = 19;
      controls.autoRotateSpeed = 0.55;
      controls.enablePan = true;
      const pmrem = new T.PMREMGenerator(renderer),
        room = new RoomEnvironment(),
        env = pmrem.fromScene(room, 0.04);
      scene.environment = env.texture;
      room.dispose();
      scene.add(new T.HemisphereLight(0xd8e3eb, 0x252327, 2.2));
      const key = new T.DirectionalLight(0xe8f0ff, 5);
      key.position.set(-3, 6, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -6;
      key.shadow.camera.right = 6;
      key.shadow.camera.top = 6;
      key.shadow.camera.bottom = -6;
      key.shadow.bias = -0.001;
      scene.add(key);
      const rim = new T.DirectionalLight(0xe2c4a4, 3);
      rim.position.set(4, 2, -3);
      scene.add(rim);
      const fill = new T.DirectionalLight(0xcad8f0, 2);
      fill.position.set(-3, 0, -2);
      scene.add(fill);
      const { root, parts } = createCamera();
      if (software)
        root.traverse((o) => {
          if (o instanceof T.Mesh) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (m instanceof T.MeshPhysicalMaterial) m.transmission = 0;
            });
          }
        });
      scene.add(root);
      const floor = new T.Mesh(
        new T.PlaneGeometry(100, 100),
        new T.ShadowMaterial({ opacity: 0.22 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.08;
      floor.receiveShadow = true;
      scene.add(floor);
      const grid = new T.GridHelper(20, 40, 0x363a3b, 0x25282a);
      grid.position.y = -1.09;
      const gridMat = grid.material as T.Material;
      gridMat.transparent = true;
      gridMat.opacity = 0.16;
      scene.add(grid);
      const line = new T.Line(
        new T.BufferGeometry(),
        new T.LineBasicMaterial({
          color: 0xc9ad76,
          transparent: true,
          opacity: 0.45,
        }),
      );
      scene.add(line);
      const annotated = new Set([
        "sensor",
        "shutter",
        "mirror",
        "prism",
        "board0",
        "mount",
        "battery",
        "aperture",
      ]);
      const labelNodes = parts.map((p) => {
        const element = document.createElement("button");
        element.className = "part-label";
        element.textContent = p.name;
        element.onclick = () => latest.current.onSelect(p.id);
        host.appendChild(element);
        return { p, element };
      });
      state.current = { renderer, camera, controls, parts, root, software };
      latest.current.onReady(parts.map(({ group, home, offset, ...p }) => p));
      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        dirty.current = true;
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      const ray = new T.Raycaster(),
        pointer = new T.Vector2();
      let downX = 0,
        downY = 0;
      function hit(e: PointerEvent | MouseEvent) {
        const r = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        ray.setFromCamera(pointer, camera);
        return ray
          .intersectObject(root, true)
          .find((h) => h.object.userData.part)?.object.userData.part as
          string | undefined;
      }
      const down = (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
      };
      const up = (e: PointerEvent) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) < 5) {
          const id = hit(e);
          if (id) latest.current.onSelect(id);
        }
      };
      const dbl = (e: MouseEvent) => {
        const id = hit(e);
        if (id) focus(id);
      };
      renderer.domElement.addEventListener("pointerdown", down);
      renderer.domElement.addEventListener("pointerup", up);
      renderer.domElement.addEventListener("dblclick", dbl);
      const lost = (e: Event) => {
        e.preventDefault();
        latest.current.onError(
          "The graphics context was interrupted. Reload the page to restore the experience.",
        );
      };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      let frame = 0;
      function render() {
        frame = requestAnimationFrame(render);
        if (document.hidden) return;
        controls.autoRotate = latest.current.autoRotate && !reduced;
        const changed = controls.update();
        const animating =
          gsap.isTweening(camera.position) ||
          gsap.isTweening(controls.target) ||
          parts.some((p) => gsap.isTweening(p.group.position));
        if (!changed && !animating && !dirty.current && !controls.autoRotate)
          return;
        dirty.current = false;
        const points = ["glass0", "mirror", "shutter", "sensor", "board0"].map(
          (id) => parts.find((p) => p.id === id)!.group.position.clone(),
        );
        if (latest.current.connections) {
          line.geometry.dispose();
          line.geometry = new T.BufferGeometry().setFromPoints(points);
        }
        line.visible = latest.current.connections;
        floor.position.y = -1.08 - latest.current.explosion * 0.022;
        grid.position.y = floor.position.y - 0.01;
        labelNodes.forEach(({ p, element }) => {
          const v = p.group.getWorldPosition(new T.Vector3()).project(camera);
          element.style.display =
            ((latest.current.labels &&
              latest.current.explosion > 5 &&
              annotated.has(p.id)) ||
              latest.current.selected === p.id) &&
            v.z < 1
              ? "block"
              : "none";
          element.style.left = `${(v.x * 0.5 + 0.5) * host.clientWidth}px`;
          element.style.top = `${(-v.y * 0.5 + 0.5) * host.clientHeight}px`;
        });
        renderer.render(scene, camera);
      }
      render();
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);
        parts.forEach((p) => gsap.killTweensOf(p.group.position));
        controls.dispose();
        renderer.domElement.removeEventListener("pointerdown", down);
        renderer.domElement.removeEventListener("pointerup", up);
        renderer.domElement.removeEventListener("dblclick", dbl);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        const geometries = new Set<T.BufferGeometry>(),
          materials = new Set<T.Material>(),
          textures = new Set<T.Texture>();
        scene.traverse((o) => {
          if (o instanceof T.Mesh || o instanceof T.Line) {
            geometries.add(o.geometry);
            const source = o.userData.originalMaterial;
            const mats = [
              ...(Array.isArray(o.material) ? o.material : [o.material]),
              ...(source ? (Array.isArray(source) ? source : [source]) : []),
            ];
            mats.forEach((m) => {
              materials.add(m);
              Object.values(m).forEach((v) => {
                if (v instanceof T.Texture) textures.add(v);
              });
            });
          }
        });
        geometries.forEach((g) => g.dispose());
        textures.forEach((t) => t.dispose());
        materials.forEach((m) => m.dispose());
        env.dispose();
        pmrem.dispose();
        renderer.dispose();
        labelNodes.forEach((n) => n.element.remove());
        renderer.domElement.remove();
        state.current = null;
      };
    }, []);
    useEffect(() => {
      const s = state.current;
      if (!s) return;
      animateAssembly(s.parts, props.explosion, reduced);
      const direction = s.camera.position
        .clone()
        .sub(s.controls.target)
        .normalize()
        .multiplyScalar(8.4 * (1 + props.explosion * 0.0105));
      const target = new T.Vector3(0, 0, 0.45 + props.explosion * 0.007);
      const position = target.clone().add(direction);
      gsap.to(s.camera.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: reduced ? 0 : 1.1,
        ease: "power2.out",
        overwrite: true,
      });
      gsap.to(s.controls.target, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: reduced ? 0 : 1.1,
        overwrite: true,
      });
    }, [props.explosion]);
    useEffect(() => {
      const s = state.current;
      if (!s) return;
      s.parts.forEach((p) =>
        p.group.traverse((o) => {
          if (o instanceof T.Mesh) {
            if (!o.userData.originalMaterial) {
              o.userData.originalMaterial = o.material;
              o.material = Array.isArray(o.material)
                ? o.material.map((m) => m.clone())
                : o.material.clone();
            }
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (m instanceof T.MeshStandardMaterial) {
                m.emissive.set(p.id === props.selected ? 0x9e7238 : 0x000000);
                m.emissiveIntensity = p.id === props.selected ? 0.22 : 0;
                if (p.category === "Body") {
                  m.transparent = props.xray > 0;
                  m.opacity = 1 - props.xray * 0.87;
                  m.depthWrite = props.xray === 0;
                }
              }
            });
          }
        }),
      );
    }, [props.selected, props.xray]);
    useEffect(() => {
      const s = state.current;
      if (s) {
        s.renderer.setPixelRatio(
          s.software
            ? 0.8
            : props.simplified
              ? 1
              : Math.min(devicePixelRatio, 1.75),
        );
        s.renderer.shadowMap.enabled = !props.simplified && !s.software;
      }
    }, [props.simplified]);
    return (
      <div
        ref={mount}
        className="viewport"
        aria-label="Interactive 3D DSLR. Drag to orbit, scroll to zoom, right-drag to pan; click a component to inspect it."
      />
    );
  },
);
