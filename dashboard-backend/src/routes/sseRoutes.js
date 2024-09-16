const express = require('express');
const router = express.Router();
const { fetchOrdersForSSE } = require('../controllers/orderController');
const { fetchInventoryForSSE } = require('../controllers/inventoryController');

router.get('/orders', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const sendOrdersData = async () => {
        try{
            const ordersData = await fetchOrdersForSSE();
            res.write(`data: ${JSON.stringify(ordersData)}\n\n`);
        } catch (error) {
            console.error('Error fetching orders data:', error);
        }
    };

    //Send initial data
    sendOrdersData();
    global.orderSSEClients.push(res);
    //intervals to send updates
    const intervalId = setInterval(sendOrdersData, 5000);

    //Clean up
    req.on('close', () => {
        clearInterval(intervalId);
        global.orderSSEClients = global.orderSSEClients.filter(client => client !== res);
    });
});

router.get('/inventory', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const sendInventoryData = async () => {
        try {
            const inventoryData = await fetchInventoryForSSE();
            res.write(`data: ${JSON.stringify(inventoryData)}\n\n`);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
        }
    };

    //send initial
    sendInventoryData();

    //intervals
    const intervalId = setInterval(sendInventoryData, 5000);
    
    //clean up
    req.on('close', () => { 
        clearInterval(intervalId);
        global.inventorySSEClients = global.inventorySSEClients.filter(client => client !== res);
    });
});

module.exports = router;