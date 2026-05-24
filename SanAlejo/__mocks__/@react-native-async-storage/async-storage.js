/**
 * Manual mock for @react-native-async-storage/async-storage.
 * Uses an in-memory Map to simulate AsyncStorage in Jest tests.
 */

let store = new Map();

const AsyncStorage = {
  getItem: jest.fn(async (key) => {
    return store.has(key) ? store.get(key) : null;
  }),
  setItem: jest.fn(async (key, value) => {
    store.set(key, value);
  }),
  removeItem: jest.fn(async (key) => {
    store.delete(key);
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  getAllKeys: jest.fn(async () => {
    return Array.from(store.keys());
  }),
  multiGet: jest.fn(async (keys) => {
    return keys.map((key) => [key, store.has(key) ? store.get(key) : null]);
  }),
  multiSet: jest.fn(async (pairs) => {
    for (const [key, value] of pairs) {
      store.set(key, value);
    }
  }),
  multiRemove: jest.fn(async (keys) => {
    for (const key of keys) {
      store.delete(key);
    }
  }),
  // Helper to reset the store between tests
  __resetStore: () => {
    store = new Map();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    AsyncStorage.removeItem.mockClear();
    AsyncStorage.clear.mockClear();
  },
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
