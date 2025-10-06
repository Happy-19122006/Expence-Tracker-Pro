# ExpenseTracker Pro - Complete Authentication System

This document provides a comprehensive guide to the authentication system implemented for ExpenseTracker Pro, including setup instructions, features, and usage examples.

## 🎯 Overview

The ExpenseTracker Pro authentication system is a modern, secure, and user-friendly solution that includes:

- **Multi-method Authentication**: Email/password, OAuth (Google/Facebook), and guest access
- **Security Features**: JWT tokens, password hashing, rate limiting, input validation
- **User Experience**: Smooth transitions, toast notifications, responsive design
- **Backend Integration**: Node.js API with MongoDB for data persistence

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Update .env with your configuration
# Start MongoDB
mongod

# Start the backend server
npm run dev
```

### 2. Frontend Setup

```bash
# The frontend is already configured
# Start a local server to test
python -m http.server 8000
# or
npx serve .
```

### 3. Access the Application

- Frontend: http://localhost:8000
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## 🔐 Authentication Features

### Login Page Features

- **Email/Password Login**: Secure authentication with validation
- **OAuth Integration**: 
  - Google OAuth 2.0
  - Facebook OAuth 2.0
- **Guest Access**: "Skip for Now" button for temporary access
- **Forgot Password**: Secure password reset flow
- **Password Strength**: Real-time password strength indicator
- **Form Validation**: Client and server-side validation

### Sign Up Page Features

- **User Registration**: Name, email, password, confirm password
- **Password Requirements**: 
  - Minimum 8 characters
  - Uppercase and lowercase letters
  - Numbers and special characters
- **Email Verification**: Automatic email with verification link
- **OAuth Sign Up**: Same OAuth options as login

### Security Features

- **JWT Tokens**: 7-day access tokens with 30-day refresh tokens
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: 5 attempts per 15 minutes for auth endpoints
- **Account Lockout**: 2-hour lockout after 5 failed attempts
- **Input Validation**: Comprehensive validation on all inputs
- **XSS Protection**: Helmet middleware for security headers

## 🛠️ Implementation Details

### Frontend Authentication Flow

```javascript
// Login with email/password
async function handleLogin(email, password) {
    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Show main application
        showApp();
    }
}

// Guest access
async function handleGuestAccess() {
    const response = await fetch('/api/v1/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestData: { currency: 'INR' } })
    });
    
    // Same token storage as regular login
    // User can upgrade to full account later
}

// OAuth redirects
function handleGoogleAuth() {
    window.location.href = '/api/v1/auth/google';
}

function handleFacebookAuth() {
    window.location.href = '/api/v1/auth/facebook';
}
```

### Backend Authentication Routes

```javascript
// User registration
POST /api/v1/auth/register
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
}

// User login
POST /api/v1/auth/login
{
    "email": "john@example.com",
    "password": "SecurePass123!"
}

// Guest access
POST /api/v1/auth/guest
{
    "guestData": {
        "currency": "INR",
        "theme": "light"
    }
}

// Password reset request
POST /api/v1/auth/forgot-password
{
    "email": "john@example.com"
}

// Password reset with token
POST /api/v1/auth/reset-password
{
    "token": "reset-token-from-email",
    "password": "NewSecurePass123!"
}
```

### OAuth Configuration

#### Google OAuth Setup

1. **Google Cloud Console**:
   - Create project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3000/api/v1/auth/google/callback`

2. **Environment Variables**:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

#### Facebook OAuth Setup

1. **Facebook Developers**:
   - Create app
   - Add Facebook Login product
   - Add redirect URI: `http://localhost:3000/api/v1/auth/facebook/callback`

2. **Environment Variables**:
   ```env
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   ```

## 📧 Email Configuration

### Gmail Setup

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Environment Variables**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=ExpenseTracker Pro <noreply@expensetracker.com>
   ```

### Email Templates

The system includes three email templates:

1. **Email Verification**: Sent after registration
2. **Password Reset**: Sent when user requests password reset
3. **Welcome Email**: Sent after successful verification

## 🔄 User Flows

### 1. New User Registration

```mermaid
graph TD
    A[User visits app] --> B[Click Sign Up]
    B --> C[Fill registration form]
    C --> D[Submit form]
    D --> E[Backend validates data]
    E --> F[Create user account]
    F --> G[Send verification email]
    G --> H[User receives email]
    H --> I[Click verification link]
    I --> J[Account verified]
    J --> K[User can login]
```

### 2. Password Reset Flow

```mermaid
graph TD
    A[User clicks 'Forgot Password'] --> B[Enter email address]
    B --> C[Submit email]
    C --> D[Backend generates reset token]
    D --> E[Send reset email]
    E --> F[User receives email]
    F --> G[Click reset link]
    G --> H[Enter new password]
    H --> I[Submit new password]
    I --> J[Password updated]
    J --> K[User can login with new password]
```

### 3. Guest Access Flow

```mermaid
graph TD
    A[User visits app] --> B[Click 'Skip for Now']
    B --> C[Backend creates guest user]
    C --> D[Generate guest tokens]
    D --> E[User accesses app]
    E --> F[Use app with limitations]
    F --> G[Prompt to upgrade account]
    G --> H[User can upgrade anytime]
```

### 4. OAuth Flow

```mermaid
graph TD
    A[User clicks OAuth button] --> B[Redirect to OAuth provider]
    B --> C[User authorizes app]
    C --> D[Provider redirects back]
    D --> E[Backend processes OAuth data]
    E --> F[Create or update user account]
    F --> G[Generate tokens]
    G --> H[Redirect to frontend with tokens]
    H --> I[User logged in]
```

## 🎨 UI Components

### Login Form
```html
<form id="login-form" class="auth-form">
    <div class="input-group">
        <i class="fas fa-envelope"></i>
        <input type="email" id="login-email" placeholder="Email" required>
    </div>
    <div class="input-group">
        <i class="fas fa-lock"></i>
        <input type="password" id="login-password" placeholder="Password" required>
    </div>
    
    <div class="auth-options">
        <a href="#" id="forgot-password-link">Forgot Password?</a>
    </div>
    
    <button type="submit" class="auth-btn primary">Login</button>
    
    <div class="auth-divider">
        <span>or continue with</span>
    </div>
    
    <div class="oauth-buttons">
        <button type="button" class="oauth-btn google-btn">Continue with Google</button>
        <button type="button" class="oauth-btn facebook-btn">Continue with Facebook</button>
    </div>
    
    <button type="button" class="auth-btn guest-btn">Skip for Now (Guest Access)</button>
</form>
```

### Sign Up Form
```html
<form id="signup-form" class="auth-form">
    <div class="input-group">
        <i class="fas fa-user"></i>
        <input type="text" id="signup-name" placeholder="Full Name" required>
    </div>
    <div class="input-group">
        <i class="fas fa-envelope"></i>
        <input type="email" id="signup-email" placeholder="Email" required>
    </div>
    <div class="input-group">
        <i class="fas fa-lock"></i>
        <input type="password" id="signup-password" placeholder="Password" required>
        <div class="password-strength" id="password-strength"></div>
    </div>
    <div class="input-group">
        <i class="fas fa-lock"></i>
        <input type="password" id="signup-confirm-password" placeholder="Confirm Password" required>
    </div>
    
    <div class="password-requirements">
        <small>Password must be at least 8 characters with uppercase, lowercase, number, and special character</small>
    </div>
    
    <button type="submit" class="auth-btn primary">Create Account</button>
    
    <div class="oauth-buttons">
        <button type="button" class="oauth-btn google-btn">Continue with Google</button>
        <button type="button" class="oauth-btn facebook-btn">Continue with Facebook</button>
    </div>
</form>
```

## 🔒 Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Automatic token refresh on API calls

### Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- General API endpoints: 100 requests per 15 minutes
- Account lockout after 5 failed login attempts for 2 hours

### Input Validation
- All user inputs are validated on both client and server
- Email format validation
- Password strength validation
- XSS protection with input sanitization

## 🚀 Deployment Considerations

### Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker-pro
JWT_SECRET=super-secure-jwt-secret-for-production
SESSION_SECRET=super-secure-session-secret-for-production
FRONTEND_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### HTTPS Configuration
- Use HTTPS in production
- Update OAuth redirect URIs to HTTPS
- Configure secure cookies for session management

### Database Security
- Use MongoDB Atlas for production
- Enable database authentication
- Configure network access restrictions
- Regular database backups

## 🧪 Testing

### Manual Testing Checklist

#### Registration Flow
- [ ] Valid registration with strong password
- [ ] Invalid email format rejection
- [ ] Weak password rejection
- [ ] Password confirmation mismatch
- [ ] Duplicate email rejection
- [ ] Email verification email sent
- [ ] Email verification link works
- [ ] OAuth registration works

#### Login Flow
- [ ] Valid credentials login
- [ ] Invalid credentials rejection
- [ ] Account lockout after 5 failed attempts
- [ ] OAuth login works
- [ ] Guest access works
- [ ] Token storage and retrieval

#### Password Reset Flow
- [ ] Forgot password email sent
- [ ] Reset link works
- [ ] New password accepted
- [ ] Old password rejected
- [ ] Token expiration handling

#### Security Features
- [ ] Rate limiting works
- [ ] Input validation works
- [ ] XSS protection active
- [ ] CSRF protection active
- [ ] Secure headers present

### Automated Testing
```bash
# Run backend tests
cd backend
npm test

# Run frontend tests (if implemented)
npm test
```

## 🐛 Troubleshooting

### Common Issues

#### 1. OAuth Redirect Issues
**Problem**: OAuth redirects to wrong URL
**Solution**: Check redirect URIs in OAuth provider console

#### 2. Email Not Sending
**Problem**: Verification emails not received
**Solution**: Check email configuration and app passwords

#### 3. Token Expiration
**Problem**: User gets logged out frequently
**Solution**: Check token expiration settings and refresh logic

#### 4. Database Connection
**Problem**: MongoDB connection errors
**Solution**: Check MongoDB service and connection string

### Debug Mode
Enable debug mode by setting:
```env
NODE_ENV=development
DEBUG=expense-tracker:*
```

## 📚 Additional Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Cloud database
- [Nodemailer Documentation](https://nodemailer.com/about/) - Email sending

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement authentication improvements
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**ExpenseTracker Pro Authentication System** - A modern, secure, and user-friendly authentication solution for web applications.
