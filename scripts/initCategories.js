require('dotenv').config();
const mongoose = require('mongoose');
const { Category } = require('../models/Project');


// Categories to be created
const categories = [
    {
        name: "Herbal Teas",
        description: "Natural and therapeutic herbal tea blends"
    },
    {
        name: "Essential Oils",
        description: "Pure and natural essential oils for aromatherapy and wellness"
    },
    {
        name: "Dried Herbs",
        description: "Traditional dried herbs for various therapeutic uses"
    },
    {
        name: "Herbal Supplements",
        description: "Natural supplements for health and wellness"
    },
    {
        name: "Natural Skincare",
        description: "Herbal and natural skincare products"
    },
    {
        name: "Wellness Products",
        description: "General wellness and health products"
    },
    {
        name: "Aromatherapy",
        description: "Products for aromatherapy and relaxation"
    },
    {
        name: "Medicinal Spices",
        description: "Traditional medicinal spices and herbs"
    }
];

// Function to initialize categories
const initCategories = async () => {
    try {
        // Connect to MongoDB using the URI from environment variable or default
        await mongoose.connect("mongodb+srv://nisarg2005prajapati:CgXldNZFjHoPyoHZ@cluster0.iaagu7v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to MongoDB');

        // Delete existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories');

        // Insert new categories
        const createdCategories = await Category.insertMany(categories);
        console.log('Categories created successfully:', createdCategories.map(cat => cat.name));

        // Log the category IDs for reference
        console.log('\nCategory IDs for reference:');
        createdCategories.forEach(cat => {
            console.log(`${cat.name}: ${cat._id}`);
        });

    } catch (error) {
        console.error('Error initializing categories:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the initialization
initCategories(); 