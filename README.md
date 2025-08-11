# Farm Management Platform

A comprehensive web-based platform for managing farm operations including suppliers, inventory, pricing, invoicing, ordering, and stock management.

## Features

- **User Management**: Role-based access control (Admin/User)
- **Supplier Management**: Full CRUD operations for suppliers
- **Inventory Management**: Track farm inventory items
- **Pricing Management**: Dynamic pricing per supplier
- **Invoice Management**: Generate and manage invoices with PDF export
- **Order Management**: Create and track orders
- **Stock Management**: Real-time stock monitoring and alerts
- **Email Notifications**: Automated email system for various events
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database (with Mongoose ODM)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **Nodemailer** - Email functionality

### Frontend
- **Vanilla JavaScript** - No frameworks
- **CSS3** - Modern styling with CSS variables
- **FontAwesome** - Icon library
- **Responsive Design** - Mobile-first approach

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farm_management
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp config.env .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   sudo systemctl start mongod
   # or
   mongod
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/farm_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@farmmanagement.com
```

## Usage

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Access the application**
   - Frontend: http://localhost:3001
   - API: http://localhost:3001/api
   - Health check: http://localhost:3001/health

### Production

1. **Build and start production server**
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/profile` - Get user profile

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Inventory
- `GET /api/inventory` - List all inventory items
- `POST /api/inventory` - Create new inventory item
- `GET /api/inventory/:id` - Get item details
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Pricing
- `GET /api/pricing` - List all pricing records
- `POST /api/pricing` - Create new pricing record
- `GET /api/pricing/supplier/:supplierId` - Get prices for specific supplier
- `PUT /api/pricing/:id` - Update pricing
- `DELETE /api/pricing/:id` - Delete pricing record

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/pdf` - Download invoice as PDF
- `POST /api/invoices/:id/send-email` - Send invoice via email

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Stock Management
- `GET /api/stock` - Get current stock levels
- `POST /api/stock/movement` - Record stock movement
- `GET /api/stock/history` - Get stock movement history
- `GET /api/stock/alerts` - Get low stock alerts

### Email and Notifications
- `POST /api/notifications/send` - Send custom email notification
- `GET /api/notifications/templates` - Get available email templates
- `POST /api/notifications/preferences` - Update user notification preferences
- `GET /api/notifications/history` - Get notification history

## Project Structure

```
farm_management/
├── backend/                 # Backend API server
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── config.env         # Environment configuration
├── frontend/              # Frontend application
│   ├── css/              # Stylesheets
│   │   ├── main.css      # Base styles and variables
│   │   ├── components.css # Component styles
│   │   └── layout.css    # Layout and responsive styles
│   ├── js/               # JavaScript modules
│   │   ├── auth.js       # Authentication module
│   │   ├── dashboard.js  # Dashboard functionality
│   │   └── main.js       # Main application entry
│   └── index.html        # Main HTML file
├── docs/                 # Documentation
│   └── 250811_farming_platform.md  # Project planning document
└── README.md             # This file
```

## Development

### Backend Development

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Run in development mode**
   ```bash
   npm run dev
   ```

3. **Run tests**
   ```bash
   npm test
   ```

### Frontend Development

The frontend is built with vanilla JavaScript and CSS. No build process is required.

1. **Edit HTML files** in the `frontend/` directory
2. **Modify CSS** in the `frontend/css/` directory
3. **Update JavaScript** in the `frontend/js/` directory

## Database

The application uses MongoDB with Mongoose ODM. The database will be created automatically when you first run the application.

### Collections
- `users` - User accounts and authentication
- `suppliers` - Supplier information
- `inventory` - Inventory items
- `pricing` - Price relationships between suppliers and items
- `invoices` - Invoice records
- `orders` - Order management
- `stock` - Stock levels and movements

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Role-based Access Control** - Admin and user permissions
- **Input Validation** - Express-validator for request validation
- **CORS Protection** - Cross-origin resource sharing configuration
- **Helmet Security** - Security headers middleware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.

## Roadmap

- [ ] Complete CRUD operations for all modules
- [ ] Advanced reporting and analytics
- [ ] Mobile app development
- [ ] Integration with external systems
- [ ] Advanced user permissions
- [ ] Real-time notifications
- [ ] Data import/export functionality
- [ ] Multi-language support