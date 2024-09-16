const { PrismaClient } = require('@prisma/client');
const { format } = require('morgan');
const { search } = require('../app');
const { errorMonitor } = require('supertest/lib/test');
const prisma = new PrismaClient();
const redisClient = require('../config/redis');

const CACHE_EXPIRATION = 3600; //in seconds
const fetchInventoryForSSE = async () => {
    try {
        const inventoryItems = await prisma.inventoryItem.findMany({
            orderBy: { name: 'asc' }
        });

        return inventoryItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            availability: item.available
        }));
    } catch (err) {
        console.error('Error fetching inventory for SSE:', err);
        return null;
    }
};

const emitInventoryUpdate = async () => {
    const updatedInventory = await fetchInventoryForSSE();
    if (updatedInventory) {
        global.inventorySSEClients.forEach(client => {
            client.write(`data: ${JSON.stringify(updatedInventory)}\n\n`);
        });
    }
};

//Retrieve the current inventory list
exports.getInventory = async (req, res) => {
    try {
        const { category, available, name } = req.query;

        //create cache key based on query params
        const cacheKey = `inventory:${category || ''}:${available || ''}:${name || ''}`;

        //Try get from Redis cache
        const cachedData = await redisClient.get(cacheKey);

        if(cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        //Apply filters based on query params
        const filter = {}
        if (category) {
            filter.category = { contains: category, mode: 'insensitive' };
        }
        if (available !== undefined) {
            filter.available = available === 'true';
        }
        if (name) {
            filter.name = { contains: name, mode: 'insensitive' };
        }

        //Fetch items
        const inventoryItems = await prisma.inventoryItem.findMany({
            where: filter,
            orderBy: { name: 'asc' } 
        });

        const formattedInventory = inventoryItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            availability: item.available
        }));

        // Store result in Redis cache
        await redisClient.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(formattedInventory));

        res.status(200).json(formattedInventory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Was not able to retrieve inventory', error: err.message });
    }
};

//Update inventory manually
exports.updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if(isNaN(quantity) || quantity < 0) {
            return res.status(400).json({ message: 'Please provide a valid quantity '});
        }

        const inventoryItem = await prisma.inventoryItem.findUnique({
            where: { id }
        });

        if(!inventoryItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Update quantity
        const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data: { 
                quantity: parseInt(quantity, 10),
                available: quantity > 0
            }
        });

        // Invalidate cache: find all keys matching the pattern and delete them
        const keys = await redisClient.keys('inventory:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        await emitInventoryUpdate();

        res.status(200).json({
            message: 'Inventory updated successfully',
            item: {
                id: updatedItem.id,
                name: updatedItem.name,
                quantity: updatedItem.quantity,
                available: updatedItem.available
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating inventory', error: err.message });
    }
};

exports.fetchInventoryForSSE = fetchInventoryForSSE;