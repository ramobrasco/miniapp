// Stub for @react-native-async-storage/async-storage (used by wagmi/MetaMask on RN only; we're web-only)
const stub = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  getAllKeys: async () => [],
  clear: async () => {},
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};
module.exports = stub;
module.exports.default = stub;
