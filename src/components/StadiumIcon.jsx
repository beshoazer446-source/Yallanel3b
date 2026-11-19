import { createLucideIcon } from "lucide-react";

const Pitch = createLucideIcon("Pitch", [
  ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "a" }],
  ["path", { d: "M12 5v14", key: "b" }],
  ["circle", { cx: "12", cy: "12", r: "2.5", key: "c" }],
  ["path", { d: "M2 9.5h3v5H2", key: "d" }],
  ["path", { d: "M22 9.5h-3v5h3", key: "e" }],
]);

export default Pitch;