const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createHarness() {
  const storage = {};
  const document = {
    addEventListener() {},
    dispatchEvent() {}
  };
  const window = {
    document,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    },
    CAMTRAVEL_SUPABASE_ENABLED: false,
    camtravelPush: {
      isPushEnabled() { return false; },
      showNotification() { return Promise.resolve(); }
    },
    camtravelSupabase: null
  };

  const context = {
    window,
    document,
    localStorage: window.localStorage,
    console,
    setTimeout,
    clearTimeout,
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    }
  };

  context.global = context;
  context.globalThis = context;

  return { context, window, storage };
}

(async function run() {
  const { context, window, storage } = createHarness();
  const scriptPath = path.join(__dirname, '..', 'js', 'data-store.js');
  const script = fs.readFileSync(scriptPath, 'utf8');
  vm.createContext(context);
  vm.runInContext(script, context);

  window.localStorage.setItem('camtravel_users', JSON.stringify([{ id: 'u1', nom: 'Test' }]));
  window.localStorage.setItem('camtravel_reservations', JSON.stringify([{ id: 'r1', total: 25000 }]));
  window.localStorage.setItem('camtravel_colis', JSON.stringify([{ id: 'c1' }]));
  window.localStorage.setItem('camtravel_passengers', JSON.stringify([{ id: 'p1' }]));

  const result = window.camtravelResetLocalStats('client');
  assert.strictEqual(result, true, 'reset should succeed');
  assert.strictEqual(storage.camtravel_users, undefined, 'users data should be cleared');
  assert.strictEqual(storage.camtravel_reservations, undefined, 'reservation data should be cleared');
  assert.strictEqual(storage.camtravel_colis, undefined, 'colis data should be cleared');
  assert.strictEqual(storage.camtravel_passengers, undefined, 'passenger data should be cleared');

  const postResetTrips = context.camtravelLocalGetTrips();
  assert.strictEqual(Array.isArray(postResetTrips), true, 'catalog should resolve to an array after reset');
  assert.strictEqual(postResetTrips.length, 0, 'catalog should stay empty after reset and refresh-like access');

  console.log('data-store reset tests passed');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
