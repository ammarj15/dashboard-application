const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cors = require('cors');

//TODO import routes
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const authRoutes = require('./routes/authRoutes');
const sseRoutes = require('./routes/sseRoutes');

const app = express();

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(morgan('dev'));
app.use(cors());

//api docs
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

//Routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sse', sseRoutes) //server-side events route

//Home
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Dashboard API!'});
})

//err for middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong :(' });
});

//404
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found :(' });
});

module.exports = app;