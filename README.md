# CAMERA LAB

An interactive DSLR engineering explorer built with React, TypeScript, Vite, native Three.js, GSAP, Tailwind CSS and Lucide.

## Develop

Requires Node.js 22 or newer (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

Vite listens on port 5173. No API keys, external services, runtime asset downloads or model files are needed. The camera is generated locally from geometry and canvas textures.


```sh
npm run build     # TypeScript validation and production bundle
npm run preview   # Serve the production bundle
npm test          # Chromium integration and assembly tests
```

Tests use `/usr/bin/chromium`; set `CHROMIUM_PATH` to another installed Chromium executable when necessary. They run software WebGL in headless environments and save screenshots in `test-results/`.

## Explore

Drag to orbit, scroll or pinch to zoom, right-drag or use two fingers to pan. Click a component to inspect it; double-click to focus. The component browser offers searchable, keyboard-accessible selection. Use the viewpoint menu for front, rear, side, top, bottom and internal perspectives.

Explode and assemble are reversible and interruptible. The slider sets separation from 0 to 100%; every component moves from an immutable home position. Assembly closes electronics first and housing last. The scene automatically reframes as it separates.

The right toolbar includes X-ray, engineering labels, screenshot download and presentation mode. Settings add optical connection lines, exterior transparency and simplified rendering. A five-step guided tour follows the light path. Escape dismisses overlays and exits presentation.

## Model and rendering

There are 25 addressable assemblies, including exterior housing, grip, viewfinder, bayonet mount, focus/zoom rings, four curved optical groups, diaphragm, reflex mirror, prism, shutter, CMOS sensor, circuit boards, ribbon cable, battery and memory-card interface. Repeated lens ridges and fasteners use instanced meshes. The model is a procedural educational interpretation of a full-frame DSLR, **not a manufacturer blueprint, exact internal replica, or repair guide**.

Rendering includes studio environment lighting, physically based materials, microtexture, shadows and limited device pixel ratio. Software renderers use lower resolution and cheaper glass; simplified mode is available. Rendering pauses when idle or hidden. Reduced-motion preferences disable automated rotation and transition animation. A WebGL-capable browser is required; rendering failures display a recovery message.

## Structure

- `src/models/camera.ts`: independent assemblies, procedural geometry, materials and component information.
- `src/animations/assembly.ts`: reversible positioning and assembly timing.
- `src/components/CameraViewer.tsx`: renderer lifecycle, orbit controls, raycasting, labels, camera framing and exports.
- `src/App.tsx`: inspector, search, controls, presets and guided tour.
- `src/styles.css`: responsive interface and reduced-motion styles.
- `tests/camera.spec.ts`: workflow, screenshot, responsive layout, and repeated/interrupted assembly checks.

Use the existing checkout in cloud tasks; no additional Git worktree is needed. Build output and installed dependencies are ignored by Git.
