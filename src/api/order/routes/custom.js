module.exports = {
    routes: [
      { // Path defined with a URL parameter
        method: 'POST',
        path: '/orders/pretransaction',
        handler: 'custom.pre',
      },

      { // Path defined with a URL parameter
        method: 'POST',
        path: '/orders/posttransaction',
        handler: 'custom.post',
      },

      { // Path defined with a URL parameter
        method: 'POST',
        path: '/orders/:orderId',
        handler: 'custom.findOrder',
      }
    ]
  }