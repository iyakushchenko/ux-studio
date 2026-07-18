/**
 * Browser API stubs for unit tests. Import side-effect modules (e.g. registry → wire)
 * may touch storage at load time in some environments.
 */
function createStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

const globalScope = globalThis as typeof globalThis & {
  localStorage?: Storage;
  sessionStorage?: Storage;
};

if (!globalScope.localStorage) {
  globalScope.localStorage = createStorage();
}
if (!globalScope.sessionStorage) {
  globalScope.sessionStorage = createStorage();
}
