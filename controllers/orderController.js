const { Order, Cart, Product } = require('../models/Project');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validationResult } = require('express-validator');

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single order
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Direct checkout without payment (for development)
exports.directCheckout = async (req, res) => {
    try {
        const { deliveryAddress } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of cart.items) {
            totalAmount += item.product.price * item.quantity;
        }

        // Create order directly without payment processing
        const order = new Order({
            user: req.user._id,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                priceAtPurchase: item.product.price
            })),
            totalAmount,
            paymentStatus: 'pending', // Mark as pending since no payment was made
            paymentMethod: 'cash', // Use cash as default for direct checkout
            deliveryAddress: deliveryAddress || req.user.address,
            status: 'processing'
        });

        await order.save();

        // Update product stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock: -item.quantity }
            });
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        res.status(201).json({ 
            message: 'Order placed successfully', 
            order 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ error: error.message });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { paymentMethodId, deliveryAddress } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of cart.items) {
            totalAmount += item.product.price * item.quantity;
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'aud',
            payment_method: paymentMethodId,
            confirm: true,
            return_url: `${process.env.FRONTEND_URL}/order/confirmation`
        });

        // Create order if payment successful
        if (paymentIntent.status === 'succeeded') {
            const order = new Order({
                user: req.user._id,
                items: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    priceAtPurchase: item.product.price
                })),
                totalAmount,
                paymentStatus: 'paid',
                paymentMethod: 'stripe',
                deliveryAddress,
                status: 'processing'
            });

            await order.save();

            // Update product stock
            for (const item of cart.items) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: -item.quantity }
                });
            }

            // Clear cart
            cart.items = [];
            await cart.save();

            res.status(201).json({ order, paymentIntent });
        } else {
            res.status(400).json({ message: 'Payment failed' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Handle Stripe webhook
exports.handlePaymentWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Update order status if needed
            break;
        case 'payment_intent.payment_failed':
            // Handle failed payment
            break;
    }

    res.json({ received: true });
}; 