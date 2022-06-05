const db = {
  save(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key: string, defaultValue = {}) {
    const item = localStorage.getItem(key);
    if (item !== null) return JSON.parse(item) || defaultValue;
  },
  remove(key: string) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

export { db };
