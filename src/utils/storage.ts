import localforage from 'localforage';

export const storage = {
  getItem: localforage.getItem,
  setItem: localforage.setItem,
  removeItem: localforage.removeItem
};
