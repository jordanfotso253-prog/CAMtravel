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
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    },
    setTimeout,
    clearTimeout
  };
  context.global = context;
  context.globalThis = context;

  return { context, window };
}

(async function run() {
  const { context, window } = createHarness();
  const scriptPath = path.join(__dirname, '..', 'js', 'notifications-store.js');
  const script = fs.readFileSync(scriptPath, 'utf8');
  vm.createContext(context);
  vm.runInContext(script, context);

  const notify = window.camtravelNotify;
  assert.ok(notify, 'camtravelNotify should be exposed');

  const adminEntry = await notify.add({ title: 'Alerte admin', role: 'admin', body: 'Test' });
  assert.strictEqual(adminEntry.url, 'admin-dashboard.html', 'admin notifications should open the admin dashboard by default');

  const clientEntry = await notify.add({ title: 'Alerte client', role: 'client', body: 'Test' });
  assert.strictEqual(clientEntry.url, 'notifications.html', 'client notifications should stay in the notifications center by default');

  notify.markRead(clientEntry.id);
  const updated = notify.list({ role: 'client' }).find(item => item.id === clientEntry.id);
  assert.strictEqual(updated.read, true, 'markRead should update the read state');

  console.log('notifications-store tests passed');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
