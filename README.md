# PlotSure Connect

A comprehensive land listing platform designed to combat land fraud in Bugesera, Rwanda by providing transparent, verified land listings with complete documentation.

## 🎯 Mission

To combat land fraud and improve trust in land transactions in Bugesera, Rwanda, by providing a transparent, secure platform that showcases verified land listings with documentation.

## ✨ Features Implemented

### ✅ Core Features (SRS Requirements Met)

#### **FR 1: Manage Listings**
- ✅ **FR 1.1**: Upload New Listing - Brokers can upload land listings with title deeds, photos, and videos
- ✅ **FR 1.2**: Edit Existing Listings - Brokers can update listing information (price, description, media)
- ✅ **FR 1.3**: Delete Listings - Brokers can remove listings no longer available

#### **FR 2: Listing View & Inquiry**
- ✅ **FR 2.1**: View Land Listings - Buyers can view all available listings with full media and document previews
- ✅ **FR 2.2**: Submit Inquiry - Buyers can contact brokers via inquiry form
- ✅ **FR 2.3**: Submit Reservation Request - Buyers can request to reserve a plot

#### **FR 3: Authentication**
- ✅ **FR 3.1**: Broker Login - Brokers must log in to access admin dashboard
- ✅ **FR 3.2**: Secure Logout - Brokers can securely log out

#### **FR 4: Notifications**
- ✅ **FR 4.1**: Email Notification to Broker - Send emails when reservations/inquiries are submitted
- ✅ **FR 4.2**: Confirmation to Buyer - Send confirmation emails to buyers after inquiry submission

#### **FR 5: Search & Filter**
- ✅ **FR 5.1**: Search Listings - Buyers can search by location, size, or price
- ✅ **FR 5.2**: Filter Listings - Buyers can filter using criteria like price range and land type

### ✅ Non-Functional Requirements (SRS Requirements Met)

#### **NFR 1: Security**
- ✅ **Two-Factor Authentication (2FA)** - Admin access requires 2FA with TOTP support
- ✅ **Secure Password Encryption** - All passwords are bcrypt hashed
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **XSS Protection** - Input sanitization and XSS prevention
- ✅ **CSRF Protection** - Cross-site request forgery protection
- ✅ **Rate Limiting** - API rate limiting to prevent abuse

#### **NFR 2: Performance**
- ✅ **Scalable Architecture** - Handles 100+ concurrent users
- ✅ **Database Optimization** - Efficient queries with proper indexing
- ✅ **Compression** - Response compression for faster loading
- ✅ **Caching** - Smart caching strategies

#### **NFR 4: Usability**
- ✅ **User-Friendly Interface** - Modern, responsive design
- ✅ **English Language** - All communications in English
- ✅ **Mobile Responsive** - Works on all devices and screen sizes

#### **NFR 5: Auditability**
- ✅ **Activity Logging** - All key user activities are logged
- ✅ **Downloadable Reports** - Admin can export activity logs as CSV
- ✅ **User Activity Tracking** - Track user actions with IP and user agent
- ✅ **System Statistics** - Comprehensive system analytics

#### **NFR 6: Cross Browser Support**
- ✅ **Google Chrome** - Fully functional
- ✅ **Mozilla Firefox** - Fully functional
- ✅ **Microsoft Edge** - Fully functional

#### **NFR 7: Technology**
- ✅ **Desktop Browsers** - Full functionality
- ✅ **Mobile Browsers** - Android and iOS support
- ✅ **No App Installation Required** - Web-based platform

#### **NFR 8: Availability**
- ✅ **99% Uptime** - Robust error handling and monitoring
- ✅ **Health Checks** - API health monitoring endpoints
- ✅ **Graceful Error Handling** - User-friendly error messages

#### **NFR 9: Mobile Compatibility**
- ✅ **Responsive Design** - Adapts to all screen sizes
- ✅ **Touch-Friendly** - Optimized for touch interactions
- ✅ **Mobile-First** - Designed with mobile users in mind

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript support
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT with 2FA support
- **File Upload**: Multer with cloud storage support
- **Email**: Nodemailer with templated emails
- **Security**: Helmet, rate limiting, XSS protection

### Frontend (HTML/CSS/JavaScript)
- **Design**: Modern, responsive design with CSS Grid/Flexbox
- **JavaScript**: Vanilla JS with modern ES6+ features
- **Mobile**: Progressive Web App (PWA) ready
- **Performance**: Optimized images and lazy loading

### Database Schema
```
Users (Brokers/Admins)
├── Listings
│   ├── Documents (Title deeds, certificates)
│   ├── Media (Images, videos)
│   └── Inquiries
└── ActivityLogs
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/plotsure-connect.git
cd plotsure-connect
```

2. **Install dependencies**
```bash
cd plotsure_backend
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize the database**
```bash
npm run init-db
```

5. **Create a test user**
```bash
npm run create-test-user
```

6. **Start the server**
```bash
npm start
# or for development
npm run dev
```

### Environment Variables

Create a `.env` file in the `plotsure_backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DB_PATH=./database.sqlite

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PlotSure Connect <noreply@plotsureconnect.rw>

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Frontend URL
FRONTEND_URL=http://localhost:5000
```

## 📱 Usage

### For Brokers/Admins

1. **Login**: Access the admin dashboard at `/admin/login`
2. **Create Listings**: Upload land listings with documents and media
3. **Manage Inquiries**: Respond to buyer inquiries and reservations
4. **View Reports**: Monitor activity logs and system statistics
5. **Setup 2FA**: Enable two-factor authentication for enhanced security

### For Buyers

1. **Browse Listings**: View all available land listings
2. **Search & Filter**: Find properties by location, price, or type
3. **Submit Inquiries**: Contact brokers about specific properties
4. **View Details**: See complete documentation and media for each listing

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Listings
- `GET /api/listings` - Get all listings with filters
- `POST /api/listings` - Create new listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Inquiries
- `POST /api/inquiries` - Submit inquiry
- `GET /api/inquiries` - Get inquiries (brokers only)
- `PUT /api/inquiries/:id` - Update inquiry status

### Two-Factor Authentication
- `POST /api/2fa/setup` - Setup 2FA
- `POST /api/2fa/verify` - Verify 2FA token
- `POST /api/2fa/disable` - Disable 2FA

### Reports (Admin Only)
- `GET /api/reports/activity-logs` - View activity logs
- `GET /api/reports/activity-logs/export` - Export logs as CSV
- `GET /api/reports/system-stats` - System statistics

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Broker)
- Two-factor authentication for admins
- Secure password hashing with bcrypt

### Data Protection
- Input sanitization and validation
- XSS protection
- CSRF protection
- Rate limiting
- SQL injection prevention

### File Security
- Secure file upload with validation
- Virus scanning (configurable)
- File type restrictions
- Secure file storage

## 📊 Monitoring & Analytics

### Activity Logging
- All user actions are logged
- IP address and user agent tracking
- Detailed audit trails
- Exportable activity reports

### System Statistics
- User activity metrics
- Listing performance analytics
- Inquiry conversion rates
- System health monitoring

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-production-secret
EMAIL_HOST=your-smtp-server
```

2. **Database Setup**
```bash
npm run init-db
```

3. **Start Production Server**
```bash
npm start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: plotsureconnect@gmail.com
- **Phone**: +250 791 845 708
- **Location**: Nyamata, Bugesera District, Rwanda

## 🎯 Roadmap

### Phase 2 Features (Future)
- [ ] Mobile app development
- [ ] Advanced mapping integration
- [ ] Payment processing
- [ ] Legal document verification API
- [ ] Multi-language support (Kinyarwanda)
- [ ] Advanced analytics dashboard
- [ ] SMS notifications
- [ ] WhatsApp integration

---

**Built with ❤️ for Rwanda's land market transparency**