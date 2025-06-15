# Herbal Heaven - E-commerce Platform

Herbal Heaven is a full-stack e-commerce platform for selling herbal products, built with Node.js, Express, MongoDB, and Materialize CSS.

## Features

- **User Authentication**
  - User registration and login
  - JWT-based authentication
  - Role-based authorization (admin/customer)
  - Password reset functionality

- **Product Management**
  - Browse products with filtering and search
  - Product categories and tags
  - Product reviews and ratings
  - Stock management
  - Image gallery for products

- **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Apply promo codes
  - Cart persistence

- **Checkout Process**
  - Secure payment processing with Stripe
  - Multiple payment methods
  - Order confirmation
  - Email notifications

- **Order Management**
  - Order history
  - Order status tracking
  - Order details and invoices
  - Shipping updates

- **Blog System**
  - Educational articles
  - Category filtering
  - Comments and likes
  - Social sharing

- **Admin Dashboard**
  - Sales analytics
  - Inventory management
  - Order processing
  - User management
  - Content management

## Tech Stack

- **Frontend**
  - HTML5
  - CSS3 (Materialize CSS)
  - JavaScript (Vanilla JS)
  - Responsive Design

- **Backend**
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose ODM

- **Authentication**
  - JSON Web Tokens (JWT)
  - bcrypt.js

- **Payment Processing**
  - Stripe API
  - Webhook handling

- **Email Service**
  - Nodemailer
  - Email templates

- **Image Storage**
  - Cloudinary
  - Multer

## Project Structure

```
herbal-heaven/
├── controllers/
│   ├── authController.js
│   ├── blogController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── notificationController.js
│   ├── orderController.js
│   ├── productController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   └── adminAuth.js 
├── models/
│   └── Project.js
├── public/
│   ├── admin/
│   │   ├──dashboard.html
│   │   ├──orders.html
│   │   ├──products.html
│   │   ├──send-notification.html
│   │   └──users.html
│   ├── css/
│   │   ├── style.css
│   │   └── admin.css
│   ├── js/
│   │   ├── app.js
│   │   ├── admin.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── blog.js
│   │   └── nav.js
│   ├── about.html
│   ├── blog-article.html
│   ├── blog.html
│   ├── cart.html
│   ├── checkout.html
│   ├── contact.html
│   ├── index.html
│   ├── login.html
│   ├── notifications.html
│   ├── order-confirmation.html
│   ├── orders.html
│   ├── privacy.html
│   ├── product-detail.html
│   ├── products.html
│   ├── register.html
│   └── terms.html
├── routes/
│   ├── authRoutes.js
│   ├── blogRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── notificationRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   └── userRoutes.js 
├── scripts/
│   ├── initCategories.js
│   └── createAdmin.js  
├── services/
│   └── notificationService.js  
├── socket/
│   └── socketManager.js  
├── .env
├── .gitignore
├── app.js
├── package.json
└── server.js
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com//herbal-heaven.git
   cd herbal-heaven
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## API Documentation

The API documentation is available at `/api-docs` when running the server in development mode.

### Main API Endpoints

- **Authentication**
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - POST `/api/auth/logout`
  - POST `/api/auth/reset-password`

- **Products**
  - GET `/api/products`
  - GET `/api/products/:id`
  - POST `/api/products` (admin)
  - PUT `/api/products/:id` (admin)
  - DELETE `/api/products/:id` (admin)

- **Cart**
  - GET `/api/cart`
  - POST `/api/cart/items`
  - PUT `/api/cart/items/:id`
  - DELETE `/api/cart/items/:id`

- **Orders**
  - GET `/api/orders`
  - GET `/api/orders/:id`
  - POST `/api/orders`
  - PUT `/api/orders/:id` (admin)

- **Blog**
  - GET `/api/blog/articles`
  - GET `/api/blog/articles/:id`
  - POST `/api/blog/articles` (admin)
  - PUT `/api/blog/articles/:id` (admin)
  - DELETE `/api/blog/articles/:id` (admin)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Materialize CSS](https://materializecss.com/)
- [Stripe](https://stripe.com/)
- [MongoDB](https://www.mongodb.com/)
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)

Admin routes require Bearer token:
Authorization: Bearer <JWT_TOKEN>

1. Get All Products-
GET /api/products
Access: Public
Description: Retrieves all products

2. Get Product by ID-
GET /api/products/:id
Access: Public
Description: Retrieve a specific product by its ID

3. Add New Product-
POST /api/products
Access: Admin
Description: Creates a new product

4. Update Product-
PUT /api/products/:id
Access: Admin
Description: Updates an existing product

5. Delete Product-
DELETE /api/products/:id
Access: Admin
Description: Deletes a product by ID
