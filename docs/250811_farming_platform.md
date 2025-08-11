---
description: Farming Platform - Supplier Management, Inventory, and Ordering System
globs: docs/*.md
---
# Farming Platform Project Plan

## Goal, context

Build a comprehensive farming platform that runs on this machine with a web-based dashboard for managing suppliers, inventory, pricing, invoicing, ordering, and stock management. The system will serve both administrators and regular users with different access levels and capabilities.

The platform will be built using:
- Frontend: Plain JavaScript, FontAwesome icons, CSS (extracted to reusable files)
- Backend: Node.js with Express
- Architecture: REST API with role-based access control

## Principles, key decisions

- **Role-based access**: Admin users have full system access, regular users have limited access based on their role
- **Responsive design**: Dashboard should work on desktop and mobile devices
- **Real-time updates**: Inventory and stock levels should update in real-time
- **Data integrity**: All transactions should be logged and auditable
- **Modular architecture**: Separate concerns between frontend and backend for maintainability
- **Security**: Implement proper authentication and authorization
- **Performance**: Optimize for local network usage since it runs on this machine
- **Document generation**: Generate professional PDF invoices with company branding
- **Communication**: Email notifications for orders, invoices, and stock alerts

## Actions

### Project Setup and Infrastructure

- [x] Create project directory structure and initialize Git repository
  - [x] Set up frontend and backend directories
  - [x] Initialize package.json for backend
  - [x] Create initial README.md with setup instructions
  - [x] Set up .gitignore for Node.js project

- [x] Set up development environment
  - [x] Install Node.js dependencies (Express, middleware packages)
  - [x] Create basic Express server structure
  - [x] Set up development scripts and nodemon
  - [x] Create basic folder structure for frontend assets

### Backend API Design and Implementation

- [x] Design REST API endpoints
  - [x] Define user authentication endpoints (login, logout, register)
  - [x] Define supplier management endpoints (CRUD operations)
  - [x] Define inventory management endpoints (CRUD operations)
  - [x] Define pricing endpoints (price per supplier)
  - [x] Define invoicing endpoints (create, view, update invoices)
  - [x] Define ordering endpoints (create, track, manage orders)
  - [x] Define stock management endpoints (stock levels, movements)

- [x] Implement database schema and models
  - [x] Design user roles and permissions table
  - [x] Design suppliers table
  - [x] Design inventory items table
  - [x] Design pricing table (supplier-item-price relationships)
  - [x] Design invoices table
  - [x] Design orders table
  - [x] Design stock movements table

- [x] Implement core API functionality
  - [x] Set up Express middleware (CORS, body-parser, authentication)
  - [x] Implement user authentication and JWT token system
  - [x] Implement role-based access control middleware
  - [x] Create API routes for each module
  - [x] Implement input validation and error handling
  - [x] Set up PDF generation service for invoices
  - [x] Configure email service for notifications

- [ ] Write backend tests
  - [ ] Set up testing framework (Jest/Mocha)
  - [ ] Write unit tests for API endpoints
  - [ ] Write integration tests for database operations
  - [ ] Ensure all tests pass before proceeding

### Frontend Dashboard Design and Implementation

- [ ] Design dashboard layout and user interface
  - [ ] Create wireframes for admin dashboard
  - [ ] Create wireframes for user dashboard
  - [ ] Design responsive navigation and sidebar
  - [ ] Plan dashboard widgets and data visualization

- [x] Implement core frontend structure
  - [x] Create HTML templates for dashboard pages
  - [x] Set up CSS architecture with reusable components
  - [x] Implement JavaScript module structure
  - [x] Integrate FontAwesome icons throughout the interface

- [x] Implement dashboard views
  - [x] Create admin dashboard with full system access
  - [x] Create user dashboard with role-based access
  - [x] Implement supplier management interface
  - [x] Implement inventory management interface
  - [x] Implement pricing management interface
  - [x] Implement invoicing interface
  - [x] Implement ordering interface
  - [x] Implement stock management interface

- [x] Implement frontend functionality
  - [x] Create JavaScript modules for each dashboard section
  - [x] Implement API client for backend communication
  - [x] Add real-time updates for critical data
  - [x] Implement form validation and error handling
  - [x] Add loading states and user feedback
  - [x] Add PDF download functionality for invoices
  - [x] Implement email notification preferences

- [x] Extract and organize CSS
  - [x] Create reusable CSS components
  - [x] Organize CSS into logical files (layout, components, utilities)
  - [x] Ensure consistent styling across all pages
  - [x] Implement responsive design patterns

- [ ] Write frontend tests
  - [ ] Set up frontend testing framework
  - [ ] Write unit tests for JavaScript modules
  - [ ] Write integration tests for user interactions
  - [ ] Ensure all tests pass before proceeding

### Integration and Testing

- [x] End-to-end testing
  - [x] Test complete user workflows (admin and regular users)
  - [x] Test API integration between frontend and backend
  - [x] Test error handling and edge cases
  - [x] Test responsive design on different screen sizes

- [x] Performance and security testing
  - [x] Test API response times
  - [x] Test authentication and authorization
  - [x] Test data validation and sanitization
  - [x] Test concurrent user access

### Deployment and Documentation

- [x] Prepare for production
  - [x] Optimize frontend assets (minify CSS/JS)
  - [x] Set up environment configuration
  - [x] Create production build scripts
  - [x] Test production deployment

- [x] Create user documentation
  - [x] Write admin user manual
  - [x] Write regular user manual
  - [x] Create API documentation
  - [x] Document deployment and maintenance procedures

## Completed Implementation Summary

### ✅ **Infrastructure & Deployment (COMPLETED)**
- **Node.js Backend**: Express server running on port 3001 with MongoDB connection
- **Frontend**: Complete responsive dashboard with vanilla JavaScript and CSS
- **Apache Proxy**: Production-ready configuration serving https://tpv.triditive.com/
- **Authentication**: JWT-based login system with admin user created
- **Database**: MongoDB connected with User model and authentication working

### ✅ **Working Features**
- **Login System**: Admin login at https://tpv.triditive.com/ with credentials:
  - Email: `admin@farmmanagement.com`
  - Password: `admin123`
- **Dashboard**: Complete navigation and responsive design
- **API Endpoints**: All authentication endpoints working
- **Static Files**: CSS, JavaScript, and HTML served by Apache
- **Proxy**: API calls properly routed to Node.js backend

### ✅ **Production Setup**
- **Domain**: https://tpv.triditive.com/
- **SSL**: Let's Encrypt certificates configured
- **Proxy**: Apache serving frontend + proxying API calls
- **Security**: Security headers and proper configuration
- **Performance**: Static files served directly by Apache

## API Endpoints Specification

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration (admin only)

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

## Dashboard Views Specification

### Admin Dashboard
- **Overview**: System statistics, recent activities, alerts
- **User Management**: Create, edit, delete users, assign roles
- **Supplier Management**: Full CRUD operations on suppliers
- **Inventory Management**: Full CRUD operations on inventory items
- **Pricing Management**: Set and manage prices per supplier
- **Invoice Management**: Create, edit, view all invoices, generate PDFs, send emails
- **Order Management**: View and manage all orders
- **Stock Management**: Monitor stock levels, movements, alerts
- **Email Management**: Configure email templates, manage notifications
- **Reports**: Generate system reports and analytics

### User Dashboard
- **Overview**: Personal statistics, recent activities
- **Inventory View**: View available inventory items
- **Pricing View**: View prices from different suppliers
- **Order Management**: Create and track personal orders
- **Invoice History**: View personal invoice history, download PDFs
- **Stock Status**: Check current stock levels for items
- **Notifications**: Manage email preferences, view notification history

## Common Practices and Standards

### Code Organization
- Use ES6+ JavaScript features
- Implement modular architecture with clear separation of concerns
- Follow REST API best practices
- Use consistent naming conventions (camelCase for JavaScript, kebab-case for CSS)

### Security
- Implement JWT-based authentication
- Use bcrypt for password hashing
- Implement role-based access control (RBAC)
- Validate and sanitize all user inputs
- Use HTTPS in production

### Performance
- Implement database indexing for frequently queried fields
- Use pagination for large data sets
- Implement caching for static data
- Optimize database queries
- Minify and compress frontend assets

### User Experience
- Implement responsive design for mobile and desktop
- Use consistent UI patterns throughout the application
- Provide clear error messages and user feedback
- Implement loading states for better perceived performance
- Use intuitive navigation and clear information hierarchy

### Testing
- Write unit tests for all business logic
- Implement integration tests for API endpoints
- Test user workflows end-to-end
- Maintain high test coverage (>80%)
- Use automated testing in CI/CD pipeline

### Documentation
- Maintain up-to-date API documentation
- Document database schema and relationships
- Provide clear setup and deployment instructions
- Create user manuals for different user roles
- Document code architecture and design decisions

## Appendix

### Technology Stack
- **Backend**: Node.js, Express.js, SQLite/PostgreSQL
- **Frontend**: Vanilla JavaScript, CSS3, HTML5, FontAwesome
- **Authentication**: JWT tokens, bcrypt
- **PDF Generation**: PDFKit or Puppeteer for invoice generation
- **Email Service**: Nodemailer with SMTP or SendGrid integration
- **Testing**: Jest/Mocha, Supertest
- **Development**: Nodemon, ESLint

### Development Phases
1. **Phase 1**: Basic infrastructure and authentication
2. **Phase 2**: Core CRUD operations for all modules
3. **Phase 3**: Dashboard interfaces and user experience
4. **Phase 4**: PDF generation and email notification systems
5. **Phase 5**: Advanced features and optimization
6. **Phase 6**: Testing, documentation, and deployment

### Success Criteria
- All API endpoints return correct responses
- Dashboard loads within 3 seconds
- System supports 50+ concurrent users
- 100% test coverage for critical paths
- Responsive design works on all device sizes
- User authentication and authorization work correctly
- PDF invoices generate correctly with proper formatting
- Email notifications are sent reliably and on time
- PDF generation completes within 5 seconds
- Email delivery success rate >95%