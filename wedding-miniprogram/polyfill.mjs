global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, value) { this._data[key] = value; },
  removeItem(key) { delete this._data[key]; },
  getItemAsync(key) { return Promise.resolve(this._data[key] || null); },
  setItemAsync(key, value) { this._data[key] = value; return Promise.resolve(); },
  removeItemAsync(key) { delete this._data[key]; return Promise.resolve(); },
};
