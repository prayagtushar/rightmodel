import { accessSync, constants, existsSync } from "node:fs";
import { delimiter, join } from "node:path";

export function findOnPath(binary: string, envPath = process.env.PATH ?? ""): string | null {
  const exts =
    process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";") : [""];
  for (const dir of envPath.split(delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = join(dir, binary + ext.toLowerCase());
      if (!existsSync(candidate)) continue;
      try {
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {}
    }
  }
  return null;
}
