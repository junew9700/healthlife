import * as SecureStore from 'expo-secure-store';

const KEY = 'xinqing-lock';
export const getPassword = () => SecureStore.getItemAsync(KEY);
export const setPassword = (value) => SecureStore.setItemAsync(KEY, value);
export const deletePassword = () => SecureStore.deleteItemAsync(KEY);
export const verifyPassword = async (value) => (await getPassword()) === value;
