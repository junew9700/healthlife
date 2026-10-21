const Storage = {
  async getItem(key) { return globalThis.localStorage?.getItem(key) ?? null; },
  async setItem(key, value) { globalThis.localStorage?.setItem(key, value); },
};

export default Storage;
