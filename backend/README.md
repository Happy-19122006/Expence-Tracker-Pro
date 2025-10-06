# ExpenseTracker Pro Backend

A complete Node.js backend API for the ExpenseTracker Pro application with comprehensive authentication, transaction management, and analytics.

## Features

### 🔐 Authentication System
- **User Registration & Login** with email/password
- **OAuth Integration** (Google & Facebook)
- **Guest Access** for temporary users
- **Password Reset** with secure token-based flow
- **Email Verification** for new accounts
- **JWT Token Management** with refresh tokens
- **Rate Limiting** to prevent brute force attacks

### 💰 Transaction Management
- **CRUD Operations** for income/expense transactions
- **Category Management** with predefined and custom categories
- **Recurring Transactions** with flexible patterns
- **Transaction Filtering** by date, category, type
- **Pagination** for large datasets
- **File Attachments** for receipts

### 📊 Analytics & Reporting
- **Dashboard Analytics** with real-time statistics
- **Financial Reports** in JSON and CSV formats
- **Spending Insights** with AI-powered recommendations
- **Category Breakdown** analysis
- **Monthly Trends** and comparisons
- **Export Functionality** for data portability

### 🛡️ Security Features
- **Password Hashing** with bcrypt
- **Input Validation** with express-validator
- **SQL Injection Prevention** with MongoDB
- **XSS Protection** with helmet
- **CORS Configuration** for cross-origin requests
- **Rate Limiting** on sensitive endpoints

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker-pro/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/expense-tracker-pro
   
   # Server
   PORT=3000
   NODE_ENV=development
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_REFRESH_EXPIRE=30d
   
   # Email (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=ExpenseTracker Pro <noreply@expensetracker.com>
   
   # OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   
   # Session
   SESSION_SECRET=your-super-secret-session-key
   
   # Frontend
   FRONTEND_URL=http://localhost:8000
   CLIENT_URL=http://localhost:8000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/guest` - Guest access
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/google` - Google OAuth login
- `GET /api/v1/auth/facebook` - Facebook OAuth login
- `GET /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user profile

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/preferences` - Update user preferences
- `PUT /api/v1/users/password` - Change password
- `DELETE /api/v1/users/account` - Delete account
- `POST /api/v1/users/upgrade-guest` - Upgrade guest account

### Transactions
- `GET /api/v1/transactions` - Get user transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get specific transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `GET /api/v1/transactions/stats/summary` - Get transaction summary

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard analytics
- `GET /api/v1/analytics/reports` - Generate reports
- `GET /api/v1/analytics/insights` - Get spending insights

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: Object,
  isEmailVerified: Boolean,
  googleId: String,
  facebookId: String,
  preferences: {
    currency: String,
    theme: String,
    language: String,
    notifications: Object
  },
  isGuest: Boolean,
  guestData: Object,
  isActive: Boolean
}
```

### Transaction Model
```javascript
{
  user: ObjectId,
  type: String (income/expense),
  amount: Number,
  category: String,
  description: String,
  date: Date,
  tags: [String],
  location: Object,
  receipt: Object,
  isRecurring: Boolean,
  recurringPattern: Object,
  status: String,
  notes: String
}
```

## Security Considerations

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Bcrypt hashing with 12 rounds
- Password reset tokens expire in 10 minutes

### Authentication Security
- JWT tokens with 7-day expiration
- Refresh tokens with 30-day expiration
- Rate limiting: 5 attempts per 15 minutes for auth endpoints
- Account lockout after 5 failed attempts for 2 hours

### Input Validation
- All inputs validated with express-validator
- SQL injection prevention with MongoDB
- XSS protection with helmet middleware
- File upload restrictions for receipts

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/v1/auth/google/callback`
   - `https://yourdomain.com/api/v1/auth/google/callback`

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/api/v1/auth/facebook/callback`
   - `https://yourdomain.com/api/v1/auth/facebook/callback`

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password
3. Use the app password in `EMAIL_PASS` environment variable

### Custom SMTP
Update the email configuration in `.env`:
```env
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker-pro
JWT_SECRET=super-secure-jwt-secret
SESSION_SECRET=super-secure-session-secret
FRONTEND_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Health Check
The API provides a health check endpoint:
```bash
GET /health
```

Response:
```json
{
  "status": "success",
  "message": "ExpenseTracker Pro API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@expensetracker.com
- Documentation: https://docs.expensetracker.com

## Changelog

### v1.0.0
- Initial release
- Complete authentication system
- Transaction management
- Analytics and reporting
- OAuth integration
- Guest access support
- Email verification
- Password reset functionality
