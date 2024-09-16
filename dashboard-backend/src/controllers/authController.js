const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        //Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email }});

        if(existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        //Hash pass
        const hashedPassword = await bcrypt.hash(password, 10);

        //Create new user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        //Generate JWT
        const token = jwt.sign(
            { userIdd:  newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h'}
        );

        res.status(201).json({
            message: 'User registered successfully',
            token: token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error during registration', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password} = req.body;

        //find user
        const user = await prisma.user.findUnique({ where: { email }});

        if(!user) {
            return res.status(401).json({ message: 'Invalid username' });
        }

        //Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1hr'}
        );

        res.status(201).json({
            message: 'Login successful',
            token: token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error logging in', error: err.message })
    }
}