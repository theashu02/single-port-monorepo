import { randomBytes } from "crypto";

const globalNonceStore = globalThis as unknown as {
  _nonceStore: Map<string, { nonce: string; expires: number }>;
};

const store = globalNonceStore._nonceStore ?? new Map<string, { nonce: string; expires: number }>();
globalNonceStore._nonceStore = store;

export function generateNonce(address: string): string {
  const nonce = randomBytes(16).toString("hex");
  store.set(address.toLowerCase(), { nonce, expires: Date.now() + 5 * 60 * 1000 });
  return nonce;
}

export function consumeNonce(address: string, nonce: string): boolean {
  const entry = store.get(address.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expires) { store.delete(address.toLowerCase()); return false; }
  if (entry.nonce !== nonce) return false;
  store.delete(address.toLowerCase());
  return true;
}
