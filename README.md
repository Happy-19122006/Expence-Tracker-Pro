# ExpenseTracker Pro

A modern, secure personal finance management application with a comprehensive authentication system.

## 🚀 Quick Start

### Option 1: Express.js Server (Recommended)
```bash
# Install dependencies
npm install

# Start the server
node server.js

# Open http://localhost:3000
```

### Option 2: Python HTTP Server
```bash
# Navigate to public folder
cd public

# Start Python server
python -m http.server 8000

# Open http://localhost:8000
```

## 📁 Project Structure

```
expence/
├── server.js                 # Express.js server
├── package.json              # Node.js dependencies
├── public/                   # Frontend files
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styles
│   ├── script.js            # JavaScript logic
│   ├── favicon.svg          # App icon
│   └── *.md                 # Documentation
├── backend/                  # Backend API (separate)
└── node_modules/            # Dependencies
```

## 🎯 Features

### Authentication System
- ✅ Email/Password Login
- ✅ Account Registration
- ✅ OAuth Integration (Google, Facebook)
- ✅ Guest Access
- ✅ Password Reset
- ✅ Secure Token Management

### User Experience
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Loading States & Animations
- ✅ Error Handling & Validation
- ✅ Accessibility (ARIA, Keyboard Navigation)
- ✅ Real-time Password Strength Indicator

### Security
- ✅ Input Sanitization & Validation
- ✅ XSS Protection
- ✅ Secure Cookie Handling
- ✅ HTTPS Detection
- ✅ CSRF Protection

### Technical
- ✅ Modular JavaScript Architecture
- ✅ API Service Layer
- ✅ State Management
- ✅ Event Handling
- ✅ Console Logging for Debugging

## 🔧 API Endpoints

The Express.js server provides mock API endpoints:

- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/validate-token` - Token validation
- `POST /api/forgot-password` - Password reset
- `GET /api/health` - Health check

## 🧪 Testing

### Manual Testing
1. Open the application in your browser
2. Test login/registration forms
3. Try OAuth buttons (will redirect)
4. Test guest access
5. Verify responsive design
6. Check console for API logs

### Test Scenarios
- Valid/Invalid login credentials
- Password strength validation
- Form field validation
- Error handling
- Loading states
- Responsive design
- Accessibility features

## 📱 Browser Compatibility

- ✅ Chrome (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)
- ✅ Mobile browsers

## 🛠️ Development

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd expence

# Install dependencies
npm install

# Start development server
node server.js

# Open http://localhost:3000
```

### File Structure
- `public/index.html` - Main application HTML
- `public/styles.css` - Responsive CSS styles
- `public/script.js` - JavaScript application logic
- `server.js` - Express.js server with API endpoints

## 🔒 Security Features

- Input sanitization to prevent XSS attacks
- Secure cookie handling for authentication tokens
- HTTPS detection and secure flags
- Password strength validation
- Form validation and error handling

## 📊 Performance

- Fast loading with optimized assets
- Smooth animations and transitions
- Efficient API calls with error handling
- Responsive design for all devices
- Accessibility compliance (WCAG 2.1 AA)

## 🚀 Deployment

### Production Deployment
1. Ensure all dependencies are installed
2. Set environment variables if needed
3. Start the server: `node server.js`
4. Configure reverse proxy (nginx, Apache)
5. Set up SSL certificate for HTTPS

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=production          # Environment
```

## 📚 Documentation

- [Testing Guide](public/TESTING_GUIDE.md) - Comprehensive testing instructions
- [Button Test Plan](public/BUTTON_TEST_PLAN.md) - UI testing checklist
- [Authentication Setup](public/AUTHENTICATION_SETUP.md) - Auth system documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the testing guides

---

**ExpenseTracker Pro** - Modern, secure, and user-friendly personal finance management.