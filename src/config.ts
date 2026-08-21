import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-taboo-clues",
  description: "A peer-to-peer clue game with shared turns, timer, and taboo flags.",
  accentHex: "#e879f9",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
