import gsap from "gsap";
import type { Part } from "../models/camera";
const closingOrder = {
  Electronics: 0,
  Power: 0.05,
  "Image capture": 0.1,
  Optics: 0.18,
  Mechanical: 0.25,
  Body: 0.32,
};
/** Every transition is computed from immutable assembled coordinates, never accumulated. */
export function animateAssembly(
  parts: Part[],
  percentage: number,
  reducedMotion = false,
) {
  return parts.map((p, i) => {
    const target = p.home
      .clone()
      .addScaledVector(p.offset, Math.max(0, Math.min(100, percentage)) / 100);
    return gsap.to(p.group.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: reducedMotion ? 0 : 0.9,
      delay: reducedMotion
        ? 0
        : percentage === 0
          ? closingOrder[p.category]
          : Math.min(i * 0.009, 0.15),
      ease: "power3.out",
      overwrite: true,
    });
  });
}
