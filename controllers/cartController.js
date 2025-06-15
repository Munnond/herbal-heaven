const { Cart, Product } = require('../models/Project');
const { validationResult } = require('express-validator');

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
            await cart.save();
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productId, quantity } = req.body;

        // Validate product exists and has sufficient stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => 
            item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        await cart.populate('items.product');
        
        res.json(cart);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { quantity } = req.body;
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const cartItem = cart.items.id(itemId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Validate stock availability
        const product = await Product.findById(cartItem.product);
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        cartItem.quantity = quantity;
        await cart.save();
        await cart.populate('items.product');

        res.json(cart);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => 
            item._id.toString() !== itemId
        );

        await cart.save();
        await cart.populate('items.product');

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 