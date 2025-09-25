# ExpenseTracker Pro - Modern Personal Finance Manager

A beautiful, modern expense tracking application with Google and Facebook authentication, guest access, and comprehensive financial management features.

## Features

### 🔐 Authentication Options
- **Traditional Login/Signup**: Email and password authentication
- **Google Sign-In**: One-click login with Google account
- **Facebook Login**: Social authentication with Facebook
- **Guest Access**: Browse the application without creating an account

### 💰 Financial Management
- Add, edit, and delete income and expense transactions
- Categorize transactions with custom categories
- View comprehensive dashboard with statistics
- Generate detailed analytics and reports
- Export data to PDF and CSV formats

### 🎨 Modern UI/UX
- Responsive design that works on all devices
- Dark and light theme support
- Beautiful animations and transitions
- Intuitive user interface

### 🔒 Security & Privacy
- Local data storage (no server required)
- Secure authentication with social providers
- Guest mode with limited functionality
- Login required for data modification

## Setup Instructions

### 1. Google Sign-In Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to authorized origins
6. Copy the Client ID and replace `YOUR_GOOGLE_CLIENT_ID` in `script.js` line 266

### 2. Facebook Login Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy the App ID and replace `YOUR_FACEBOOK_APP_ID` in `script.js` line 274

### 3. Local Development

1. Clone or download the project files
2. Open `index.html` in a web browser
3. The application will work immediately with guest access
4. For full functionality, set up the API keys as described above

## Usage

### Guest Access
- Click "Guest Access" to browse without login
- View sample data and explore features
- Limited functionality - cannot save data

### User Authentication
- **Login**: Use existing credentials or social login
- **Sign Up**: Create new account or use social signup
- **Social Login**: One-click authentication with Google or Facebook

### Key Features
- **Dashboard**: Overview of financial status
- **Transactions**: Add, edit, delete financial records
- **Analytics**: Visual charts and trends
- **Reports**: Export financial data
- **Settings**: Customize categories and preferences

## File Structure

```
expense-tracker/
├── index.html          # Main HTML file
├── script.js           # JavaScript functionality
├── styles.css          # CSS styling
├── favicon.svg         # Website icon
└── README.md           # This file
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Security Notes

- All data is stored locally in the browser
- No data is sent to external servers (except for authentication)
- Social login uses official OAuth flows
- Guest data is not persisted

## Customization

### Adding New Categories
1. Go to Settings
2. Add custom categories
3. Categories are saved locally

### Theme Customization
- Toggle between light and dark themes
- Theme preference is saved automatically

### Data Management
- Export all data as JSON backup
- Import previously exported data
- Clear all data (requires confirmation)

## Troubleshooting

### Social Login Not Working
- Verify API keys are correctly set
- Check browser console for errors
- Ensure domains are authorized in provider settings

### Data Not Saving
- Check if you're logged in (not in guest mode)
- Verify browser allows local storage
- Try clearing browser cache

### Performance Issues
- Close other browser tabs
- Clear browser cache
- Use a modern browser

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API key configuration
3. Ensure all files are in the same directory
4. Try refreshing the page

## License

This project is open source and available under the MIT License.
