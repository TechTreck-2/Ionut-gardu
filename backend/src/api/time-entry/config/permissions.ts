export default {
  routes: [
    {
      method: 'GET',
      path: '/time-entries',
      handler: 'time-entry.find',
      config: {
        policies: [],
        auth: {
          scope: ['api::time-entry.time-entry.find'],
          mode: 'required'
        }
      }
    },
    {
      method: 'GET',
      path: '/time-entries/:id',
      handler: 'time-entry.findOne',
      config: {
        policies: [],
        auth: {
          scope: ['api::time-entry.time-entry.findOne'],
          mode: 'required'
        }
      }
    },
    {
      method: 'POST',
      path: '/time-entries',
      handler: 'time-entry.create',
      config: {
        policies: [],
        auth: {
          scope: ['api::time-entry.time-entry.create'],
          mode: 'required'
        }
      }
    },
    {
      method: 'PUT',
      path: '/time-entries/:id',
      handler: 'time-entry.update',
      config: {
        policies: [],
        auth: {
          scope: ['api::time-entry.time-entry.update'],
          mode: 'required'
        }
      }
    },
    {
      method: 'DELETE',
      path: '/time-entries/:id',
      handler: 'time-entry.delete',
      config: {
        policies: [],
        auth: {
          scope: ['api::time-entry.time-entry.delete'],
          mode: 'required'
        }
      }
    }
  ]
}; 