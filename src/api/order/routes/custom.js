module.exports = {
    routes: [
      { // Path defined with a URL parameter
        method: 'POST',
        path: '/orders/pretransaction',
        handler: 'custom.pre',
        config: {
            auth: false
        }
      },

      { // Path defined with a URL parameter
        method: 'POST',
        path: '/orders/posttransaction',
        handler: 'custom.post',
        config: {
            auth: false
        }
      },

      { // Path defined with a URL parameter
        method: 'POST',
        path: '/orders/:orderId',
        handler: 'custom.findOrder',
        config: {
            auth: false
        }
      }
    ]
  }