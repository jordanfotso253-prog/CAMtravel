// Stub local pour garder la plateforme statique et autonome.
// Aucune dépendance réseau n'est nécessaire pour charger les pages.
(function () {
  window.supabase = window.supabase || {
    createClient: function () {
      return {
        auth: {
          signInWithPassword: async function () {
            return { error: { code: 'offline_mode', message: 'Mode statique actif.' } };
          },
          signUp: async function () {
            return { error: { code: 'offline_mode', message: 'Mode statique actif.' } };
          },
          signOut: async function () {
            return { error: null };
          },
          getUser: async function () {
            return { data: { user: null }, error: null };
          },
          onAuthStateChange: function () {
            return function () {};
          }
        },
        from: function () {
          return {
            insert: async function () { return { error: null }; },
            upsert: async function () { return { error: null }; },
            select: async function () { return { data: [], error: null }; },
            update: async function () { return { error: null }; },
            delete: async function () { return { error: null }; },
            eq: function () { return this; },
            order: function () { return this; },
            limit: function () { return this; }
          };
        },
        rpc: async function () {
          return { data: null, error: null };
        }
      };
    }
  };
})();
