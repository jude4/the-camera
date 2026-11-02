import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export type Category =
  "Body" | "Optics" | "Image capture" | "Electronics" | "Mechanical" | "Power";
export interface Part {
  id: string;
  name: string;
  category: Category;
  description: string;
  detail: string;
  connection: string;
  group: T.Group;
  home: T.Vector3;
  offset: T.Vector3;
}
export function createCamera() {
  const root = new T.Group(),
    parts: Part[] = [];
  const metal = new T.MeshStandardMaterial({
    color: 0x101215,
    metalness: 0.36,
    roughness: 0.43,
  });
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const noiseCtx = noiseCanvas.getContext("2d")!;
  const image = noiseCtx.createImageData(128, 128);
  let seed = 19;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = 80 + (seed % 110);
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  noiseCtx.putImageData(image, 0, 0);
  const grain = new T.CanvasTexture(noiseCanvas);
  grain.wrapS = grain.wrapT = T.RepeatWrapping;
  grain.repeat.set(5, 5);
  const rubber = new T.MeshStandardMaterial({
    color: 0x121416,
    roughness: 0.88,
    bumpMap: grain,
    bumpScale: 0.018,
  });
  const silver = new T.MeshStandardMaterial({
    color: 0x92999f,
    metalness: 0.95,
    roughness: 0.25,
  });
  const black = new T.MeshStandardMaterial({
    color: 0x080a0d,
    metalness: 0.35,
    roughness: 0.25,
  });
  const glass = new T.MeshPhysicalMaterial({
    color: 0x080f19,
    metalness: 0.75,
    envMapIntensity: 0.35,
    roughness: 0.08,
    transmission: 0.12,
    transparent: true,
    opacity: 0.92,
    ior: 1.5,
    clearcoat: 1,
  });
  const red = new T.MeshStandardMaterial({
    color: 0xbd4231,
    metalness: 0.65,
    roughness: 0.3,
  });
  function part(
    id: string,
    name: string,
    category: Category,
    pos: number[],
    offset: number[],
    description: string,
    detail: string,
    connection: string,
  ) {
    const group = new T.Group();
    group.position.fromArray(pos);
    root.add(group);
    const p = {
      id,
      name,
      category,
      description,
      detail,
      connection,
      group,
      home: group.position.clone(),
      offset: new T.Vector3(...offset),
    };
    parts.push(p);
    return group;
  }
  function mesh(
    g: T.Group,
    geo: T.BufferGeometry,
    mat: T.Material,
    p = [0, 0, 0],
    rot = [0, 0, 0],
  ) {
    const m = new T.Mesh(geo, mat);
    m.position.fromArray(p);
    m.rotation.set(...(rot as [number, number, number]));
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  }
  const box = (
    g: T.Group,
    w: number,
    h: number,
    d: number,
    mat: T.Material,
    p = [0, 0, 0],
    r = 0.06,
  ) =>
    mesh(
      g,
      r < 0.01
        ? new T.BoxGeometry(w, h, d)
        : new RoundedBoxGeometry(w, h, d, 3, r),
      mat,
      p,
    );
  const cyl = (
    g: T.Group,
    r: number,
    d: number,
    mat: T.Material,
    p = [0, 0, 0],
  ) =>
    mesh(g, new T.CylinderGeometry(r, r, d, 64), mat, p, [Math.PI / 2, 0, 0]);
  const ring = (
    g: T.Group,
    r: number,
    t: number,
    mat: T.Material,
    p = [0, 0, 0],
  ) => mesh(g, new T.TorusGeometry(r, t, 8, 80), mat, p);
  function text(
    g: T.Group,
    label: string,
    w: number,
    h: number,
    p: number[],
    size = 48,
    color = "#d4d6d5",
  ) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 128;
    const x = c.getContext("2d")!;
    x.fillStyle = color;
    x.font = `${size}px Arial`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(label, 512, 64);
    const tex = new T.CanvasTexture(c);
    const m = mesh(
      g,
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      }),
      p,
    );
    return m;
  }
  function screws(g: T.Group, positions: number[][]) {
    const geo = new T.CylinderGeometry(0.027, 0.027, 0.016, 10);
    geo.rotateX(Math.PI / 2);
    const im = new T.InstancedMesh(geo, silver, positions.length);
    positions.forEach((p, i) =>
      im.setMatrixAt(
        i,
        new T.Matrix4().makeTranslation(...(p as [number, number, number])),
      ),
    );
    g.add(im);
  }
  const body = part(
    "chassis",
    "Magnesium chassis",
    "Body",
    [0, 0, 0],
    [-2.3, 0, 0],
    "A rigid magnesium-alloy skeleton keeps the optical system precisely aligned.",
    "The lens mount, mirror box and sensor share a structural reference, preserving alignment under load.",
    "Lens mount · Sensor carrier · Exterior shells",
  );
  metal.bumpMap = grain;
  metal.bumpScale = 0.004;
  box(body, 2.7, 1.72, 0.68, metal, [0, 0, -0.08], 0.17);
  for (let i = 0; i < 3; i++) {
    const port = box(
      body,
      0.18,
      0.12,
      0.035,
      black,
      [1.36, -0.2 + i * 0.23, -0.03],
      0.015,
    );
    port.rotation.y = Math.PI / 2;
    const lip = box(
      body,
      0.22,
      0.16,
      0.02,
      silver,
      [1.355, -0.2 + i * 0.23, -0.03],
      0.02,
    );
    lip.rotation.y = Math.PI / 2;
  }
  for (let i = 0; i < 5; i++)
    box(
      body,
      0.025,
      0.012,
      0.13,
      black,
      [1.35, 0.54 + i * 0.035, -0.06],
      0.003,
    );
  box(body, 1.35, 0.24, 0.82, metal, [0.1, -0.85, 0]);
  const front = part(
    "front",
    "Front housing",
    "Body",
    [0, 0, 0.35],
    [-1.1, 0.7, 1.1],
    "The front shell protects the mirror box and carries the lens release.",
    "Sealed joints and fasteners protect the internal optical path from dust and moisture.",
    "Chassis · Lens mount",
  );
  box(front, 2.72, 1.7, 0.18, metal, [0, 0, 0], 0.13);
  text(front, "FULL FRAME", 0.36, 0.08, [0.98, 0.35, 0.105], 42);
  text(front, "5D", 0.3, 0.14, [1.02, 0.51, 0.105], 62);
  cyl(front, 0.7, 0.08, black, [0, 0, 0.12]);
  screws(front, [
    [-1.1, 0.65, 0.11],
    [1.1, 0.65, 0.11],
    [-1.1, -0.65, 0.11],
    [1.1, -0.65, 0.11],
  ]);
  const grip = part(
    "grip",
    "Ergonomic grip",
    "Body",
    [-1.18, -0.04, 0.37],
    [-1.8, -0.2, 0.7],
    "A contoured rubberized grip steadies the camera and houses the battery.",
    "The raised front edge provides leverage for the fingers while the thumb rests against the rear shell.",
    "Battery · Shutter release · Chassis",
  );
  box(grip, 0.65, 1.7, 0.95, rubber, [0, 0, 0], 0.23);
  for (let i = 0; i < 32; i++)
    box(grip, 0.014, 1.35, 0.012, metal, [-0.26 + i * 0.016, 0, 0.48], 0.004);
  const top = part(
    "top",
    "Upper housing & controls",
    "Body",
    [0, 0.87, 0],
    [0, 1.6, -0.1],
    "The upper shell carries exposure controls, the hot shoe and status display.",
    "Dedicated dials allow tactile adjustment while looking through the optical viewfinder.",
    "Viewfinder · Control electronics",
  );
  box(top, 2.6, 0.27, 0.88, metal);
  const prismShape = new T.Shape();
  prismShape.moveTo(-0.53, 0);
  prismShape.lineTo(-0.36, 0.51);
  prismShape.quadraticCurveTo(-0.3, 0.59, -0.18, 0.59);
  prismShape.lineTo(0.3, 0.59);
  prismShape.quadraticCurveTo(0.43, 0.59, 0.48, 0.42);
  prismShape.lineTo(0.62, 0);
  prismShape.closePath();
  mesh(
    top,
    new T.ExtrudeGeometry(prismShape, {
      depth: 0.71,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 4,
      steps: 1,
    }),
    metal,
    [0, 0, -0.35],
  );
  box(top, 0.46, 0.06, 0.52, silver, [0.1, 0.57, 0.02]);
  box(top, 0.33, 0.025, 0.44, black, [0.1, 0.61, 0.02]);
  mesh(
    top,
    new T.CylinderGeometry(0.25, 0.25, 0.17, 40),
    rubber,
    [1.0, 0.22, 0],
  );
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    box(
      top,
      0.025,
      0.15,
      0.025,
      silver,
      [1 + Math.cos(a) * 0.25, 0.22, Math.sin(a) * 0.25],
      0.003,
    );
  }
  mesh(
    top,
    new T.CylinderGeometry(0.13, 0.13, 0.08, 32),
    silver,
    [-1.17, 0.2, 0.25],
  );
  box(top, 0.57, 0.025, 0.35, glass, [-0.7, 0.15, -0.12]);
  text(top, "CAMERA LAB", 0.9, 0.14, [0.12, 0.29, 0.481], 52);
  const rear = part(
    "rear",
    "Rear housing & LCD",
    "Body",
    [0, 0, -0.53],
    [0.3, 0.1, -1.8],
    "The rear interface combines image review with direct shooting controls.",
    "An LCD displays captured photographs and menus; surrounding controls remain accessible to the right hand.",
    "Image processor · Control board",
  );
  box(rear, 2.7, 1.7, 0.19, metal, [0, 0, 0], 0.13);
  box(rear, 1.7, 1.12, 0.045, black, [0.12, -0.12, -0.12]);
  const screen = box(
    rear,
    1.53,
    0.94,
    0.015,
    new T.MeshStandardMaterial({
      color: 0x183337,
      roughness: 0.18,
      metalness: 0.6,
    }),
    [0.12, -0.12, -0.15],
  );
  screen.rotation.y = Math.PI;
  for (let i = 0; i < 5; i++)
    cyl(rear, 0.045, 0.03, rubber, [1.13, 0.52 - i * 0.23, -0.12]);
  cyl(rear, 0.19, 0.04, rubber, [-1, -0.3, -0.13]);
  box(rear, 0.48, 0.27, 0.16, rubber, [0.1, 0.62, -0.12]);
  const mount = part(
    "mount",
    "Lens mount",
    "Mechanical",
    [0, 0, 0.57],
    [0, 0, 1.2],
    "A precision bayonet interface joins the interchangeable lens to the camera.",
    "Metal tabs lock rotationally into the body. Electrical contacts transmit lens identification and aperture commands.",
    "Lens barrel · Chassis · Lens electronics",
  );
  ring(mount, 0.64, 0.065, silver);
  ring(mount, 0.56, 0.025, black);
  screws(mount, [
    [0.5, 0.32, 0.02],
    [-0.5, 0.32, 0.02],
    [0, -0.6, 0.02],
  ]);
  for (let i = 0; i < 8; i++)
    cyl(
      mount,
      0.022,
      0.025,
      new T.MeshStandardMaterial({ color: 0xc4a45c, metalness: 0.8 }),
      [-0.25 + i * 0.07, -0.49, 0.03],
    );
  const barrel = part(
    "barrel",
    "Zoom lens barrel",
    "Optics",
    [0, 0, 1.27],
    [0, 0, 1.8],
    "A rigid barrel holds the optical groups along a common axis.",
    "Nested sections support focus and focal-length adjustment while maintaining optical alignment.",
    "Focus ring · Zoom ring · Lens mount",
  );
  const tube = new T.MeshStandardMaterial({
    color: 0x151719,
    metalness: 0.5,
    roughness: 0.35,
    side: T.DoubleSide,
  });
  mesh(
    barrel,
    new T.CylinderGeometry(0.62, 0.58, 1.27, 72, 1, true),
    tube,
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
  );
  ring(barrel, 0.62, 0.035, metal, [0, 0, 0.61]);
  box(barrel, 0.18, 0.32, 0.08, metal, [0.58, 0, 0.05]);
  text(barrel, "AF  /  MF", 0.3, 0.08, [0.44, 0.17, 0.62], 45);
  for (const [id, name, z, r, off] of [
    ["focus", "Focus ring", 1.77, 0.65, 2.5],
    ["zoom", "Zoom ring", 1.1, 0.61, 1.5],
  ] as const) {
    const g = part(
      id,
      name,
      "Optics",
      [0, 0, z],
      [0, 0, off],
      "A textured rubber ring gives precise tactile control of the lens. ",
      id === "focus"
        ? "Rotation shifts the focusing group to bring the subject onto the sensor plane."
        : "Rotation changes the spacing between optical groups, adjusting the angle of view.",
      "Lens barrel · Optical elements",
    );
    mesh(
      g,
      new T.CylinderGeometry(r, r, 0.28, 80, 1, true),
      rubber,
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
    );
    const ribs = new T.InstancedMesh(
      new T.BoxGeometry(0.018, 0.018, 0.28),
      metal,
      88,
    );
    for (let i = 0; i < 88; i++) {
      const a = (i / 88) * Math.PI * 2;
      const transform = new T.Matrix4().compose(
        new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), a),
        new T.Vector3(1, 1, 1),
      );
      ribs.setMatrixAt(i, transform);
    }
    g.add(ribs);
    ring(g, r, 0.018, black, [0, 0, 0.15]);
  }
  const rim = part(
    "rim",
    "Front lens bezel",
    "Optics",
    [0, 0, 1.99],
    [0, 0, 3.0],
    "The protective bezel supports the front element and threaded filters.",
    "A recessed front element and a rigid surround protect the optical surface.",
    "Front glass · Focus ring",
  );
  ring(rim, 0.65, 0.045, metal);
  ring(rim, 0.605, 0.025, red, [0, 0, -0.08]);
  ring(rim, 0.55, 0.035, black, [0, 0, 0.025]);
  text(rim, "24–105mm   1:4   L   IS USM", 0.94, 0.12, [0, 0.44, 0.06], 48);
  text(rim, "CAMERA LAB  •  Ø77", 0.8, 0.1, [0, -0.46, 0.06], 42);
  for (let i = 0; i < 4; i++) {
    const g = part(
      "glass" + i,
      [
        "Front optical element",
        "Converging optical group",
        "Corrective optical group",
        "Rear optical element",
      ][i],
      "Optics",
      [0, 0, 1.94 - i * 0.34],
      [0, (i % 2 === 0 ? 0.1 : -0.1) * i, 3.35 - i * 0.35],
      "Coated optical glass bends incoming rays to form an image on the sensor.",
      "Multiple optical groups correct aberrations and keep the image sharp across the field. Coating color is illustrative.",
      "Aperture diaphragm · Lens barrel · Image sensor",
    );
    const radius = 0.52 - i * 0.035;
    const profile: T.Vector2[] = [];
    for (let k = 0; k <= 16; k++) {
      const r = (k / 16) * radius;
      profile.push(new T.Vector2(r, 0.016 + 0.055 * (1 - (r / radius) ** 2)));
    }
    for (let k = 16; k >= 0; k--) {
      const r = (k / 16) * radius;
      profile.push(new T.Vector2(r, -0.016 - 0.035 * (1 - (r / radius) ** 2)));
    }
    mesh(
      g,
      new T.LatheGeometry(profile, 64),
      glass,
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
    );
    ring(g, 0.52 - i * 0.035, 0.015, black);
    ring(
      g,
      0.42 - i * 0.025,
      0.005,
      new T.MeshStandardMaterial({
        color: 0x43556e,
        metalness: 0.8,
        roughness: 0.1,
      }),
      [0, 0, 0.035],
    );
  }
  const aperture = part(
    "aperture",
    "Aperture diaphragm",
    "Optics",
    [0, 0, 1.33],
    [0, -1.5, 2.2],
    "Overlapping blades regulate the light passing through the lens.",
    "The aperture controls exposure and depth of field. This illustrative diaphragm has nine blades.",
    "Optical groups · Lens electronics",
  );
  ring(aperture, 0.39, 0.06, metal);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const m = box(
      aperture,
      0.26,
      0.22,
      0.012,
      black,
      [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0],
      0.03,
    );
    m.rotation.z = a + 0.5;
  }
  const mirror = part(
    "mirror",
    "Reflex mirror",
    "Image capture",
    [0, 0.02, 0.15],
    [1.5, 0.6, 0.8],
    "A hinged mirror redirects light upward into the optical viewfinder.",
    "During exposure the mirror lifts, clearing the path from lens to shutter and sensor.",
    "Lens · Focusing screen · Shutter",
  );
  const mm = box(mirror, 0.86, 0.62, 0.035, silver);
  mm.rotation.x = -Math.PI / 4;
  box(mirror, 1, 0.05, 0.06, metal, [0, 0.27, -0.2]);
  const prism = part(
    "prism",
    "Pentaprism & focusing screen",
    "Optics",
    [0.1, 0.73, 0.05],
    [0.2, 2.1, 0.1],
    "The focusing screen and prism route a correctly oriented image to the eyepiece.",
    "The prism folds the optical path through internal reflections so framing is possible without the rear display.",
    "Reflex mirror · Optical viewfinder",
  );
  box(prism, 0.64, 0.44, 0.54, glass, [0, 0.1, 0], 0.07);
  box(prism, 0.65, 0.025, 0.58, silver, [0, -0.17, 0]);
  const shutter = part(
    "shutter",
    "Focal-plane shutter",
    "Image capture",
    [0, 0, -0.16],
    [1.9, 0, -0.4],
    "Timed curtains expose the sensor for a controlled interval.",
    "Two traveling curtains define the exposure window. At fast speeds, a narrow slit moves across the sensor.",
    "Mirror mechanism · Image sensor",
  );
  box(shutter, 1.1, 0.83, 0.06, black);
  for (let i = 0; i < 7; i++)
    box(shutter, 0.96, 0.095, 0.015, metal, [0, -0.3 + i * 0.1, 0.04], 0.008);
  const sensor = part(
    "sensor",
    "CMOS image sensor",
    "Image capture",
    [0, 0, -0.26],
    [1.4, 0.2, -1.35],
    "The image sensor converts incoming photons into electrical signals.",
    "A full-frame CMOS representation sits behind the shutter on an aligned carrier. A filter stack covers the light-sensitive surface.",
    "Shutter · Image processor · Sensor carrier",
  );
  box(sensor, 1.13, 0.85, 0.065, metal);
  box(
    sensor,
    0.87,
    0.58,
    0.025,
    new T.MeshPhysicalMaterial({
      color: 0x396c72,
      metalness: 0.75,
      roughness: 0.15,
      iridescence: 1,
    }),
    [0, 0, 0.05],
  );
  screws(sensor, [
    [-0.5, 0.35, 0.05],
    [0.5, 0.35, 0.05],
    [-0.5, -0.35, 0.05],
    [0.5, -0.35, 0.05],
  ]);
  for (let b = 0; b < 2; b++) {
    const g = part(
      "board" + b,
      b ? "Power & interface board" : "Image processor board",
      "Electronics",
      [b ? -0.95 : 0, b ? 0 : 0.05, -0.38],
      [b ? -2.0 : 0.3, b ? -0.3 : 0.3, -2.5 - b * 0.2],
      "Printed circuits coordinate image readout, processing and camera operation.",
      b
        ? "Regulation and interface circuits distribute power and connect external devices."
        : "The image processor turns sensor readouts into photographs, coordinating noise reduction, color and file encoding.",
      "Sensor · Battery · Memory card interface",
    );
    const pcb = new T.MeshStandardMaterial({
      color: 0x184f3e,
      roughness: 0.6,
      metalness: 0.2,
    });
    box(g, b ? 0.45 : 1.55, b ? 1.1 : 1.18, 0.04, pcb);
    box(g, 0.35, 0.35, 0.055, black, [0, 0, 0.05]);
    for (let i = 0; i < 20; i++) {
      const x = (i % 5) * (b ? 0.07 : 0.24) - (b ? 0.14 : 0.48),
        y = Math.floor(i / 5) * 0.23 - 0.35;
      box(
        g,
        b ? 0.045 : 0.12,
        0.07,
        0.025,
        i % 3 ? black : silver,
        [x, y, 0.045],
        0.005,
      );
    }
    for (let i = 0; i < 10; i++)
      box(
        g,
        0.012,
        0.9,
        0.005,
        new T.MeshStandardMaterial({ color: 0xa88f53, metalness: 0.7 }),
        [(b ? -0.18 : -0.65) + i * (b ? 0.04 : 0.14), 0, 0.025],
        0.001,
      );
  }
  const cable = part(
    "ribbon",
    "Flexible ribbon cable",
    "Electronics",
    [0.65, -0.5, -0.22],
    [1.6, -1.4, -1.1],
    "Flexible conductors connect boards across compact mechanical spaces.",
    "Insulated copper traces bend around the chassis and carry signals without rigid connectors between every assembly.",
    "Sensor · Main board · Rear controls",
  );
  box(
    cable,
    0.18,
    0.65,
    0.015,
    new T.MeshStandardMaterial({
      color: 0xb77832,
      metalness: 0.55,
      roughness: 0.4,
    }),
  );
  const battery = part(
    "battery",
    "Lithium-ion battery",
    "Power",
    [-1.15, -0.4, 0.02],
    [-1.4, -1.7, 0],
    "A removable rechargeable battery powers the camera and lens.",
    "The pack fits inside the grip. Protected contacts feed the power-regulation circuitry.",
    "Power board · Battery contacts",
  );
  box(battery, 0.38, 0.85, 0.4, black);
  for (let i = 0; i < 3; i++)
    box(
      battery,
      0.07,
      0.02,
      0.12,
      new T.MeshStandardMaterial({ color: 0xc4a45c, metalness: 0.8 }),
      [-0.12 + i * 0.12, 0.43, 0],
    );
  const card = part(
    "card",
    "Memory card interface",
    "Electronics",
    [1.12, 0, -0.18],
    [2.4, -0.6, -0.7],
    "A removable flash-memory interface stores processed photographs.",
    "The controller transfers encoded image files from the processor to nonvolatile storage. Card contacts and a protective slot maintain the connection.",
    "Image processor · Power board",
  );
  box(card, 0.35, 0.63, 0.08, metal);
  box(card, 0.27, 0.44, 0.02, black, [0, 0, 0.06]);
  for (let i = 0; i < 8; i++)
    box(
      card,
      0.025,
      0.09,
      0.015,
      new T.MeshStandardMaterial({ color: 0xc4a45c, metalness: 0.8 }),
      [-0.105 + i * 0.03, 0.25, 0.06],
      0.003,
    );
  const base = part(
    "base",
    "Base plate & tripod socket",
    "Mechanical",
    [0, -0.93, 0],
    [0, -1.8, -0.2],
    "The base protects the chassis and transfers loads to a tripod.",
    "A central threaded socket provides a stable mechanical attachment. The battery door allows access to the grip compartment.",
    "Chassis · Battery compartment",
  );
  box(base, 2.6, 0.12, 0.85, metal);
  mesh(base, new T.CylinderGeometry(0.1, 0.1, 0.04, 24), silver, [0, -0.08, 0]);
  root.traverse((o) => {
    if (o instanceof T.Mesh)
      o.userData.part = parts.find((p) => {
        let parent: T.Object3D | null = o;
        while (parent) {
          if (parent === p.group) return true;
          parent = parent.parent;
        }
        return false;
      })?.id;
  });
  return { root, parts };
}
