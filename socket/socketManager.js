const jwt = require('jsonwebtoken');
const { User } = require('../models/Project');

/**
 * Socket Manager
 * Handles socket.io connections and authentication
 */
class SocketManager {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // Map of userId -> Set of socket IDs
    }

    /**
     * Initialize socket.io with the HTTP server
     * @param {Object} server - HTTP server
     */
    init(server) {
        const io = require('socket.io')(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Socket.io middleware for authentication
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;

                if (!token) {
                    return next(new Error('Authentication error: Token not provided'));
                }

                let decoded;
                try {
                    decoded = jwt.verify(token, process.env.JWT_SECRET);
                } catch (err) {
                    if (err.name === 'TokenExpiredError') {
                        return next(new Error('jwt expired')); // Allow client to handle refresh
                    }
                    return next(new Error('Invalid token'));
                }

                const user = await User.findById(decoded.userId);
                if (!user || user.status !== 'active') {
                    return next(new Error('Authentication error: User not found or inactive'));
                }

                socket.user = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role
                };

                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        // Connection event
        io.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id}`);

            if (socket.user && socket.user.id) {
                const userId = socket.user.id;

                // Join user-specific room
                socket.join(`user-${userId}`);

                // Track user's socket connections
                if (!this.userSockets.has(userId)) {
                    this.userSockets.set(userId, new Set());
                }
                this.userSockets.get(userId).add(socket.id);

                // Update user's last active timestamp
                this.updateUserLastActive(userId);

                // Custom user event example
                socket.on('read_notification', (data) => {
                    console.log(`User ${userId} read notification: ${data.notificationId}`);
                });
            }

            // Disconnect event
            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);

                if (socket.user && socket.user.id) {
                    const userId = socket.user.id;

                    if (this.userSockets.has(userId)) {
                        this.userSockets.get(userId).delete(socket.id);

                        if (this.userSockets.get(userId).size === 0) {
                            this.userSockets.delete(userId);
                        }
                    }
                }
            });
        });

        this.io = io;
        console.log('Socket.io initialized');
    }

    /**
     * Get the socket.io instance
     * @returns {Object} - Socket.io instance
     */
    getIO() {
        return this.io;
    }

    /**
     * Check if a user is online (has active socket connections)
     * @param {String} userId - User ID
     * @returns {Boolean} - True if user is online
     */
    isUserOnline(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
    }

    /**
     * Get count of online users
     * @returns {Number} - Number of online users
     */
    getOnlineUsersCount() {
        return this.userSockets.size;
    }

    /**
     * Update user's last active timestamp
     * @param {String} userId - User ID
     */
    async updateUserLastActive(userId) {
        try {
            await User.findByIdAndUpdate(userId, {
                lastActive: new Date()
            });
        } catch (error) {
            console.error('Error updating user last active timestamp:', error);
        }
    }
}

module.exports = new SocketManager();
