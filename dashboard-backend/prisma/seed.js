const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    //Create some dummy users
    const users = await Promise.all(
        Array(5).fill().map(async(_, index) => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            return prisma.user.create({
                data: {
                    name: `User${index + 1}`,
                    email: `user${index + 1}@example.com`,
                    password: hashedPassword,
                },
            });
        })
    );

    console.log('Created users: ', users);

    //Create inventory items
    const inventoryItems = await Promise.all(
        [
            { name: 'Laptop', category: 'Electronics', quantity: 50 },
            { name: 'Smartphone', category: 'Electronics', quantity: 100 },
            { name: 'Guitar', category: 'Instruments', quantity: 12 },
            { name: 'Bass', category: 'Instruments', quantity: 20 },
            { name: 'Baseball Bat', category: 'Sports', quantity: 5 },
            { name: 'Football', category: 'Sports', quantity: 0 },
        ].map(item =>
            prisma.inventoryItem.create({
                data: {
                    ...item,
                    available: item.quantity > 0,
                },
            })
        )
    );

    console.log('Created inventory items:', inventoryItems);

    //Create orders
    const availableItems = inventoryItems.filter(item => item.available && item.quantity > 0);
    const orders = await Promise.all(
        users.flatMap(user => 
            Array(3).fill().map(() =>
            prisma.order.create({
                data: {
                    customerId: user.id,
                    status: ['pending', 'paid', 'cancelled', 'refunded'][Math.floor(Math.random() * 4)],
                    items: {
                        create: Array(Math.floor(Math.random() * 3) + 1).fill().map(() => ({
                            inventoryItemId: availableItems[Math.floor(Math.random() * availableItems.length)].id,
                            quantity: Math.floor(Math.random() * 5) + 1,
                        })),
                    }
                },
                include: {
                    items: true,
                }
            }))
        )
    );
    
    console.log('Created orders: ', orders);
}

main()
.catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});