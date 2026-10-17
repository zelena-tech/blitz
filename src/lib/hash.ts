import { keccak256, toBytes, stringToBytes } from "viem";

/** JSON canónico: llaves ordenadas, sin espacios */
export function canonical(obj: unknown): string {
  if (Array.isArray(obj)) return "[" + obj.map(canonical).join(",") + "]";
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
  }
  return JSON.stringify(obj);
}

export const hashBytes = (bytes: Uint8Array) => keccak256(bytes);
export const hashText = (s: string) => keccak256(stringToBytes(s));

/** Huella del paquete de evidencia: keccak256 de {causa, hito, archivos, nota} */
export function evidenceBundleHash(causa: number, hito: number, fileHashes: `0x${string}`[], nota: string): `0x${string}` {
  return keccak256(toBytes(canonical({ causa, hito, archivos: fileHashes, nota })));
}

export async function hashFile(file: File): Promise<`0x${string}`> {
  const buf = new Uint8Array(await file.arrayBuffer());
  return keccak256(buf);
}
