const KEY = 'xinqing-lock-sha256';
const digest = async (value) => {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const getPassword = async () => globalThis.localStorage?.getItem(KEY) ?? null;
export const setPassword = async (value) => globalThis.localStorage?.setItem(KEY, await digest(value));
export const deletePassword = async () => globalThis.localStorage?.removeItem(KEY);
export const verifyPassword = async (value) => (await getPassword()) === await digest(value);
