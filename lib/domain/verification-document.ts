const allowedTypes = new Map([
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ["application/pdf", [0x25, 0x50, 0x44, 0x46]],
]);

export const MAX_VERIFICATION_FILE_BYTES = 5 * 1024 * 1024;

export async function validateVerificationFile(file: File): Promise<void> {
  if (!allowedTypes.has(file.type)) throw new Error("UNSUPPORTED_FILE_TYPE");
  if (file.size < 4 || file.size > MAX_VERIFICATION_FILE_BYTES) throw new Error("INVALID_FILE_SIZE");
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const expected = allowedTypes.get(file.type)!;
  if (!expected.every((byte, index) => signature[index] === byte)) throw new Error("INVALID_FILE_SIGNATURE");
}

export function safeDocumentName(value: string): string {
  const cleaned = value.normalize("NFKC").replace(/[^a-zA-Z0-9._ -]/g, "").replace(/\s+/g, " ").trim().replace(/^\.+/, "");
  return (cleaned || "dokumen").slice(0, 100);
}
