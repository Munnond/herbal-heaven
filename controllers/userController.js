const { User } = require('../models/Project');

// Get all users with filtering
exports.getUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        let query = {};

        // Apply filters
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, status } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing the last admin's role
        if (user.role === 'admin' && role === 'user') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ 
                    message: 'Cannot change role: At least one admin must exist' 
                });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, role, status },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting an admin
        if (user.role === 'admin') {
            return res.status(400).json({ 
                message: 'Cannot delete admin users' 
            });
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
}; 