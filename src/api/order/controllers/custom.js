const { createCoreController } = require('@strapi/strapi').factories;
const https = require('https');
const PaytmChecksum = require('paytmchecksum');

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    // Method 1: Creating an entirely custom action
    async pre(ctx) {
        let { email, address, pincode, notes, promocode, products, orderId, orderCost, finalCost } = ctx.request.body;
        // console.log(ctx.request.body);
        var paytmParams = {};
        paytmParams.body = {
            "requestType": "Payment",
            "mid": process.env.PAYTM_MID,
            "websiteName": "YOUR_WEBSITE_NAME",
            "orderId": orderId,
            "callbackUrl": `http://localhost:1337/api/orders/posttransaction?orderId=${orderId}`,
            "txnAmount": {
                "value": finalCost,
                "currency": "INR",
            },
            "userInfo": {
                "custId": email,
            },
        };
        let checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MKEY)

        paytmParams.head = {
            "signature": checksum
        };

        var post_data = JSON.stringify(paytmParams);

        const getToken = async () => {
            return new Promise((resolve, reject) => {
                console.log('getToken');
                console.log(process.env.PAYTM_HOST);
                console.log(process.env.PAYTM_MID);
                var options = {

                    /* for Staging */
                    hostname: process.env.PAYTM_HOST,

                    /* for Production */
                    // hostname: 'securegw.paytm.in',

                    port: 443,
                    path: `/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length
                    }
                };

                var response = "";
                var post_req = https.request(options, function (post_res) {

                    // promice reject
                    post_res.on('error', function (err) {
                        console.log(err);
                        reject(err);
                    })

                    post_res.on('data', function (chunk) {
                        response += chunk;
                    });

                    post_res.on('end', function () {
                        console.log(response);
                        resolve(JSON.parse(response).body);
                    });
                });

                post_req.write(post_data);
                post_req.end();
            })
        }

        const token = await getToken();
        const entry = strapi.entityService.create('api::order.order', {
            data: {
                products: products,
                orderCost: orderCost,
                promocode: promocode,
                finalCost: finalCost,
                orderId: orderId,
                status: "Pending",
                email: email
            },
        });
        ctx.body = token;
    },

    async post(ctx) {
        try {
            let { orderId } = ctx.request.query;
            let paytmChecksum = ctx.request.body.CHECKSUMHASH;

            var isVerifySignature = PaytmChecksum.verifySignature(ctx.request.body, process.env.PAYTM_MKEY, paytmChecksum);
            if (isVerifySignature && ctx.request.body.STATUS == 'TXN_SUCCESS') {
                console.log("Checksum Matched");
                strapi.db.query('api::order.order').updateMany({
                    where: {
                        orderId: orderId,
                    },
                    data: {
                        status: "Paid",
                        checksum: {jsonChecksum: ctx.request.body, hash: paytmChecksum}
                    },
                });
                ctx.redirect(`http://localhost:3000/success?orderId=${orderId}`);
            } else {
                ctx.redirect(`http://localhost:3000/failure?orderId=${orderId}`);
            }
        }
        catch (err) {
            ctx.body = err;
        }
    },

    async findOrder(ctx) {
        try {
            let { orderId } = ctx.params;
            const entry = await strapi.db.query('api::order.order').findMany({ // uid syntax: 'api::api-name.content-type-name'
                where: {
                    orderId: orderId
                },
            });
            ctx.body = entry[0];
        }
        catch (err) {
            ctx.body = err;
        }
    }
}));