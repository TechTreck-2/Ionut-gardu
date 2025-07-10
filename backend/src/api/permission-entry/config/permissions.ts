export default {
  routes: [
    {
      method: 'GET',
      path: '/permission-entries',
      handler: 'permission-entry.find',
      config: {
        policies: [],
        auth: {
          scope: ['api::permission-entry.permission-entry.find'],
          mode: 'required'
        }
      }
    },
    {
      method: 'GET',
      path: '/permission-entries/:id',
      handler: 'permission-entry.findOne',
      config: {
        policies: [],
        auth: {
          scope: ['api::permission-entry.permission-entry.findOne'],
          mode: 'required'
        }
      }
    },
    {
      method: 'POST',
      path: '/permission-entries',
      handler: 'permission-entry.create',
      config: {
        policies: [],
        auth: {
          scope: ['api::permission-entry.permission-entry.create'],
          mode: 'required'
        }
      }
    },
    {
      method: 'PUT',
      path: '/permission-entries/:id',
      handler: 'permission-entry.update',
      config: {
        policies: [],
        auth: {
          scope: ['api::permission-entry.permission-entry.update'],
          mode: 'required'
        }
      }
    },
    {
      method: 'DELETE',
      path: '/permission-entries/:id',
      handler: 'permission-entry.delete',
      config: {
        policies: [],
        auth: {
          scope: ['api::permission-entry.permission-entry.delete'],
          mode: 'required'
        }
      }
    }
  ]
};
