/**
 * Storage API wrapper for browser extensions
 * This provides a unified interface for Chrome and Firefox storage
 */

// Check if we're in a browser extension environment
const isExtension = typeof browser !== 'undefined' || typeof chrome !== 'undefined';

// Get the appropriate storage API
const storageAPI = (() => {
  if (!isExtension) {
    // Fallback to localStorage for development
    return {
      get: async (keys) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
              try {
                result[key] = JSON.parse(item);
              } catch (e) {
                result[key] = item;
              }
            }
          });
        } else if (typeof keys === 'string') {
          const item = localStorage.getItem(keys);
          if (item) {
            try {
              result[keys] = JSON.parse(item);
            } catch (e) {
              result[keys] = item;
            }
          }
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
              try {
                result[key] = JSON.parse(item);
              } catch (e) {
                result[key] = item;
              }
            } else {
              result[key] = keys[key]; // default value
            }
          });
        }
        return result;
      },
      set: async (items) => {
        Object.keys(items).forEach(key => {
          const value = items[key];
          if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            localStorage.setItem(key, value);
          }
        });
        return true;
      },
      remove: async (keys) => {
        if (Array.isArray(keys)) {
          keys.forEach(key => localStorage.removeItem(key));
        } else {
          localStorage.removeItem(keys);
        }
        return true;
      },
      clear: async () => {
        localStorage.clear();
        return true;
      }
    };
  }
  
  // Firefox uses browser.storage
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage.local;
  }
  
  // Chrome uses chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return {
      get: (keys) => {
        return new Promise((resolve, reject) => {
          chrome.storage.local.get(keys, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      },
      set: (items) => {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set(items, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(true);
            }
          });
        });
      },
      remove: (keys) => {
        return new Promise((resolve, reject) => {
          chrome.storage.local.remove(keys, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(true);
            }
          });
        });
      },
      clear: () => {
        return new Promise((resolve, reject) => {
          chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(true);
            }
          });
        });
      }
    };
  }
  
  // Fallback to dummy storage (should never happen)
  console.warn('No storage API found, using in-memory storage (data will not persist)');
  const memoryStorage = {};
  return {
    get: async (keys) => {
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (memoryStorage[key] !== undefined) {
            result[key] = memoryStorage[key];
          }
        });
      } else if (typeof keys === 'string') {
        if (memoryStorage[keys] !== undefined) {
          result[keys] = memoryStorage[keys];
        }
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          if (memoryStorage[key] !== undefined) {
            result[key] = memoryStorage[key];
          } else {
            result[key] = keys[key]; // default value
          }
        });
      }
      return result;
    },
    set: async (items) => {
      Object.keys(items).forEach(key => {
        memoryStorage[key] = items[key];
      });
      return true;
    },
    remove: async (keys) => {
      if (Array.isArray(keys)) {
        keys.forEach(key => delete memoryStorage[key]);
      } else {
        delete memoryStorage[keys];
      }
      return true;
    },
    clear: async () => {
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
      return true;
    }
  };
})();

/**
 * Get an item from storage with improved error handling and logging
 * @param {string} key - The key to retrieve
 * @returns {Promise<any>} - A promise that resolves with the value
 */
async function storageGet(key) {
  try {
    console.log(`Storage: Getting item with key "${key}"`);
    const result = await storageAPI.get(key);
    console.log(`Storage: Retrieved result for key "${key}":`, result);
    
    if (result[key] === undefined) {
      console.log(`Storage: No value found for key "${key}"`);
      return null;
    }
    
    return result[key];
  } catch (error) {
    console.error(`Storage: Error getting item from storage:`, error);
    return null;
  }
}

/**
 * Set an item in storage with improved error handling and logging
 * @param {string} key - The key to set
 * @param {any} value - The value to set
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function storageSet(key, value) {
  try {
    console.log(`Storage: Setting key "${key}" with value:`, value);
    
    // Check if value is undefined or null
    if (value === undefined) {
      console.warn(`Storage: Attempted to store undefined value for key "${key}". Using null instead.`);
      value = null;
    }
    
    const items = {};
    items[key] = value;
    
    await storageAPI.set(items);
    console.log(`Storage: Successfully set key "${key}"`);
    return true;
  } catch (error) {
    console.error(`Storage: Error setting item in storage:`, error);
    return false;
  }
}

/**
 * Remove an item from storage
 * @param {string} key - The key to remove
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function storageRemove(key) {
  try {
    await storageAPI.remove(key);
    return true;
  } catch (error) {
    console.error('Error removing item from storage:', error);
    return false;
  }
}

/**
 * Clear all items from storage
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function storageClear() {
  try {
    await storageAPI.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}