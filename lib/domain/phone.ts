export function normalizeIndonesianPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let national = digits;
  if (national.startsWith("62")) national = national.slice(2);
  else if (national.startsWith("0")) national = national.slice(1);
  if (!national.startsWith("8") || national.length < 9 || national.length > 13 || !/^\d+$/.test(national)) throw new Error("PHONE_INVALID");
  return `+62${national}`;
}
