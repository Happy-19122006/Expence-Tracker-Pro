# OAuth Setup Guide for ExpenseTracker Pro

## 🔧 OAuth Configuration Steps

### 1. Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Visit: https://console.developers.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"

4. **Configure OAuth Consent Screen:**
   - Add your app name: "ExpenseTracker Pro"
   - Add authorized domains: `localhost`, `127.0.0.1`
   - Add scopes: `email`, `profile`

5. **Set Authorized Redirect URIs:**
   - Add: `http://localhost:3000/api/v1/auth/google/callback`
   - Add: `http://127.0.0.1:3000/api/v1/auth/google/callback`

6. **Copy Credentials:**
   - Copy Client ID and Client Secret
   - Update `backend/.env` file

### 2. Facebook OAuth Setup

1. **Go to Facebook Developers:**
   - Visit: https://developers.facebook.com/
   - Create a new app

2. **Add Facebook Login Product:**
   - Go to "Add a Product"
   - Add "Facebook Login"

3. **Configure OAuth Settings:**
   - Go to "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/v1/auth/facebook/callback`
     - `http://127.0.0.1:3000/api/v1/auth/facebook/callback`

4. **Get App Credentials:**
   - Go to "Settings" > "Basic"
   - Copy App ID and App Secret
   - Update `backend/.env` file

### 3. Environment Configuration

Update your `backend/.env` file with the credentials:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
FACEBOOK_APP_ID=your-actual-facebook-app-id
FACEBOOK_APP_SECRET=your-actual-facebook-app-secret
```

### 4. MongoDB Setup

Make sure MongoDB is running:

```bash
# Start MongoDB (Windows)
net start MongoDB

# Start MongoDB (Mac/Linux)
sudo systemctl start mongod
```

### 5. Start the Application

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start

# In another terminal, start frontend
cd ..
python -m http.server 8000
```

### 6. Test OAuth Login

1. Open: http://localhost:8000
2. Click "Continue with Google" or "Continue with Facebook"
3. Complete OAuth flow
4. You should be redirected back to the dashboard

## 🔍 Troubleshooting

### Common Issues:

1. **"OAuth login is not available" error:**
   - Make sure backend server is running on port 3000
   - Check if OAuth credentials are properly set in `.env`

2. **Google OAuth error:**
   - Verify redirect URI matches exactly
   - Check if Google+ API is enabled
   - Ensure OAuth consent screen is configured

3. **Facebook OAuth error:**
   - Verify app is in development mode
   - Check if Facebook Login product is added
   - Ensure redirect URI is correct

4. **MongoDB connection error:**
   - Make sure MongoDB is running
   - Check connection string in `.env`

### Development Tips:

- Use `http://localhost` instead of `http://127.0.0.1` for OAuth
- Keep both frontend (port 8000) and backend (port 3000) running
- Check browser console for detailed error messages
- Monitor backend logs for OAuth flow debugging

## 📱 Production Deployment

For production deployment:

1. Update OAuth redirect URIs to your domain
2. Set proper environment variables
3. Use HTTPS for OAuth callbacks
4. Configure proper CORS settings
5. Set up proper session management

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Enable HTTPS in production
- Regularly rotate OAuth credentials
- Monitor OAuth usage and implement rate limiting
