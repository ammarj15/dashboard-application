require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

global.orderSSEClients = [];
global.inventorySSEClients = [];

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MonogoDB'))
    .catch(err => console.error('Could not conneect to MongoDB', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
