import * as SecureStore from 'expo-secure-store';

const options: SecureStore.SecureStoreOptions = {
  keychainService: 'com.learntime.mobile.secure-storage',
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// Preserve the order of writes/removals during refresh, logout and timer updates.
let pending: Promise<void> = Promise.resolve();
function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.then(() => undefined, () => undefined);
  return result;
}

export const secureStorage = {
  get: (key: string) => serialized(() => SecureStore.getItemAsync(key, options)),
  set: (key: string, value: string) => serialized(() => SecureStore.setItemAsync(key, value, options)),
  remove: (key: string) => serialized(() => SecureStore.deleteItemAsync(key, options)),
};
