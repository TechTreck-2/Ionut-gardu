export default {
  routes: [
    {
      method: 'GET',
      path: '/vacation-entries',
      handler: 'vacation-entry.find',
      config: {
        policies: [],
        auth: {
          scope: ['api::vacation-entry.vacation-entry.find'],
          mode: 'required'
        }
      }
    },
    {
      method: 'GET',
      path: '/vacation-entries/:id',
      handler: 'vacation-entry.findOne',
      config: {
        policies: [],
        auth: {
          scope: ['api::vacation-entry.vacation-entry.findOne'],
          mode: 'required'
        }
      }
    },
    {
      method: 'POST',
      path: '/vacation-entries',
      handler: 'vacation-entry.create',
      config: {
        policies: [],
        auth: {
          scope: ['api::vacation-entry.vacation-entry.create'],
          mode: 'required'
        }
      }
    },
    {
      method: 'PUT',
      path: '/vacation-entries/:id',
      handler: 'vacation-entry.update',
      config: {
        policies: [],
        auth: {
          scope: ['api::vacation-entry.vacation-entry.update'],
          mode: 'required'
        }
      }
    },
    {
      method: 'DELETE',
      path: '/vacation-entries/:id',
      handler: 'vacation-entry.delete',
      config: {
        policies: [],
        auth: {
          scope: ['api::vacation-entry.vacation-entry.delete'],
          mode: 'required'
        }
      }
    }
  ]
};
