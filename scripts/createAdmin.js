require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/Project');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://nisarg2005prajapati:CgXldNZFjHoPyoHZ@cluster0.iaagu7v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to MongoDB');

        // Admin details
        const adminData = {
            name: 'Admin User',
            email: 'admin@herbalheaven.com',
            password: 'Admin@123', // This will be hashed
            role: 'admin'
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create admin user
        const admin = new User({
            ...adminData,
            password: hashedPassword
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin(); 