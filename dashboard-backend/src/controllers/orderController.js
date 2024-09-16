const { PrismaClient } = require('@prisma/client');
const { format } = require('morgan');
const prisma = new PrismaClient();
const redisClient = require('../config/redis');
const { query } = require('express');
const { fetchInventoryForSSE } = require('./inventoryController');

const CACHE_EXPIRATION = 3600;

//function to fetch orders for SSE
const fetchOrdersForSSE = async () => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                customer: true,
                items: {
                    include: {
                        inventoryItem: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Limit to last 10 orders for SSE updates
        });

        return {
            orders,
            currentPage: 1,
            totalPages: 1,
            totalCount: orders.length
        };
    } catch (err) {
        console.error('Error fetching orders for SSE:', err);
        return null;
    }
};

// function to emit order updates
const emitOrderUpdate = async () => {
    const updatedOrders = await fetchOrdersForSSE();
    if (updatedOrders) {
        global.orderSSEClients.forEach(client => {
            client.write(`data: ${JSON.stringify(updatedOrders)}\n\n`);
        });
    }
};

// Function to emit inventory updates
const emitInventoryUpdate = async () => {
    const updatedInventory = await fetchInventoryForSSE();
    if (updatedInventory) {
        global.inventorySSEClients.forEach(client => {
            client.write(`data: ${JSON.stringify(updatedInventory)}\n\n`);
        });
    }
};

//Retrieve list of orders
exports.getOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, searchTerm, page = 1, limit = 5 } = req.query;

        //Redis cache based on query params
        const cacheKey = `orders:${status || ''}:${startDate || ''}:${endDate || ''}:${searchTerm || ''}:${page}:${limit}`;

        //Try get from Redis cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Apply filters based on query params
        const filters = {};
        if (status) filters.status = status;
        if (startDate && endDate) {
            filters.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (searchTerm) {
            filters.OR = [
                { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { items: { some: { inventoryItem: { name: { contains: searchTerm, mode: 'insensitive' } } } } },
                { items: { some: { inventoryItem: { category: { contains: searchTerm, mode: 'insensitive' } } } } },
                ...(isValidObjectId(searchTerm) ? [{ id: searchTerm }] : [])
            ];
        }

        const skip = (page - 1) * limit;
        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where: filters,
                include: {
                    customer: true,
                    items: {
                        include: {
                            inventoryItem: true
                        }
                    }
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where: filters })
        ]);
        const result = {
            orders,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
        //store in Redis cache
        await redisClient.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(result));

        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

function isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

//Create order
exports.createOrder = async (req, res) => {
    try {
        const { customer, items } = req.body;

        // Check if the customer exists by email
        let existingCustomer = await prisma.customer.findUnique({ where: { email: customer.email } });
        
        // If the customer doesn't exist, create a new one
        if (!existingCustomer) {
            existingCustomer = await prisma.customer.create({
                data: {
                    name: customer.name,
                    email: customer.email
                }
            });
        }

        // Process the items and ensure they are in stock
        const itemsWithId = await Promise.all(
            items.map(async (item) => {
                const inventoryItem = await prisma.inventoryItem.findFirst({
                    where: { name: item.product }
                });

                if (!inventoryItem) {
                    throw new Error(`${item.product} not found`);
                }

                if (inventoryItem.quantity < item.quantity) {
                    throw new Error(`Not enough stock available for ${item.product}. Max available: ${inventoryItem.quantity}`);
                }

                return {
                    quantity: item.quantity,
                    inventoryItemId: inventoryItem.id
                };
            })
        );

        // Create the order
        const order = await prisma.order.create({
            data: {
                customerId: existingCustomer.id,
                status: 'pending',
                items: {
                    create: itemsWithId.map(item => ({
                        quantity: item.quantity,
                        inventoryItem: {
                            connect: { id: item.inventoryItemId }
                        }
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        inventoryItem: true
                    }
                },
                customer: true
            }
        });

        // Format the order data for response
        const formattedOrder = {
            orderId: order.id,
            customer: {
                name: order.customer.name,
                email: order.customer.email
            },
            items: order.items.map(item => ({
                product: item.inventoryItem.name,
                quantity: item.quantity
            })),
            status: order.status,
            createdAt: order.createdAt
        };
        //Invalidate redis cache
        const keys = await redisClient.keys('orders:*');
        
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }

        await emitOrderUpdate();
        res.status(201).json({ message: 'Order created successfully', formattedOrder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


//Cancel order    
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        //Fetch order and details
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        inventoryItem: true
                    }
                },
                customer: true
            }
        });

        if(!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if(order.status === 'cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' })
        }
        
        if(order.status === 'Refunded') {
            return res.status(400).json({ message: 'Order is already refunded' })
        }

        //Update order status
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status: 'cancelled' },
            include: {
                items: {
                    include: {
                        inventoryItem: true
                    }
                },
                customer: true
            }
        });
        
        //Adjust inventory
        if(order.status !== 'pending'){
        for (const item of updatedOrder.items) {
            await prisma.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: { 
                    quantity: { increment: item.quantity },
                    available: true
                }
            });
            //Invalidate redis cache to updae inventory
            const keys = await redisClient.keys('inventory:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    }
        const formattedOrder = {
            orderId: updatedOrder.id,
            customer: {
                name: updatedOrder.customer.name,
                email: updatedOrder.customer.email
            },
            items: updatedOrder.items.map(item => ({
                product: item.inventoryItem.name,
                quantity: item.quantity
            })),
            status: updatedOrder.status,
            createdAt: updatedOrder.createdAt
        };
        //Invalidate redis cache
        const keys = await redisClient.keys('orders:*');
        
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
        
        await emitOrderUpdate();
        await emitInventoryUpdate()
        res.status(200).json({
            message: 'Order cancelled successfully', 
            order: formattedOrder 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

exports.confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentMethod } = req.body;

        //Find order
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: { include: { inventoryItem: true }}} 
        });

        if(!order) { 
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order is not pending' });
        }

        //Update status from pending
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: 'paid'
            },
            include: { 
                items: { include: { inventoryItem: true }},
            customer: true
            }
        });

        //Update inventory
        for (const item of updatedOrder.items) {
            await prisma.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: {
                    quantity: { decrement: item.quantity },
                    available: { set: item.inventoryItem.quantity - item.quantity > 0 }
                }
            });
            //Invalidate redis cache to updae inventory
            const keys = await redisClient.keys('inventory:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            
        }

        const formattedOrder = {
            orderId: updatedOrder.id,
            customer: {
                name: updatedOrder.customer.name,
                email: updatedOrder.customer.email
            },
            items: updatedOrder.items.map(item => ({
                product: item.inventoryItem.name,
                quantity: item.quantity
            })),
            status: updatedOrder.status,
            createdAt: updatedOrder.createdAt
        };
        //Invalidate redis cache
        const keys = await redisClient.keys('orders:*');
        
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }

        await emitInventoryUpdate();
        await emitOrderUpdate();
        res.status(200).json({
            message: 'Payment confirmed and inventory updated',
            order: formattedOrder,
            paymentDetails: { amount, paymentMethod }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error processing payment', error: err.message });
    }
};

exports.refundOrder = async ( req, res ) => {
    try {
        const { id }= req.params;

         //Find order
         const order = await prisma.order.findUnique({
            where: { id },
            include: { items: { include: { inventoryItem: true }}} 
        });

        if(!order) { 
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'paid') {
            return res.status(400).json({ message: 'Order has not been paid' });
        }

        //Update status from paid
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: 'refunded'
            },
            include: { 
                items: { include: { inventoryItem: true }},
            customer: true
            }
        });

        //Update inventory
        for (const item of updatedOrder.items) {
            await prisma.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: {
                    quantity: { increment: item.quantity },
                    available: true
                }
            });
            //Invalidate redis cache to updae inventory
            const keys = await redisClient.keys('inventory:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }

        const formattedOrder = {
            orderId: updatedOrder.id,
            customer: {
                name: updatedOrder.customer.name,
                email: updatedOrder.customer.email
            },
            items: updatedOrder.items.map(item => ({
                product: item.inventoryItem.name,
                quantity: item.quantity
            })),
            status: updatedOrder.status,
            createdAt: updatedOrder.createdAt
        };

        //Invalidate redis cache
        const keys = await redisClient.keys('orders:*');
        
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }

        await emitOrderUpdate();
        await emitInventoryUpdate();
        res.status(200).json({
            message: 'Order refunded and inventory updated',
            order: formattedOrder
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error processing refund', error: err.message });
    }
};

exports.fetchOrdersForSSE = fetchOrdersForSSE;