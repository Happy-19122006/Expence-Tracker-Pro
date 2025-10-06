# ExpenseTracker Pro - Backend Deployment Guide

This guide covers deploying the ExpenseTracker Pro backend to various cloud platforms.

## 🚀 Quick Deployment Options

### Option 1: Deploy to Render (Recommended)

1. **Fork/Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd expensetracker-backend
   ```

2. **Create a new Web Service on Render**
   - Sign up at [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the backend folder

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expensetracker
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   CORS_ORIGIN=https://expence-tracker-pro.vercel.app
   ```

4. **Deploy**
   - Render will automatically build and deploy your app
   - Your API will be available at `https://your-app-name.onrender.com`

### Option 2: Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set MONGODB_URI=your-mongodb-connection-string
   railway variables set JWT_SECRET=your-jwt-secret
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option 3: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd backend
   vercel
   ```

3. **Set Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variables

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)

2. **Create Cluster**
   - Choose a free tier cluster
   - Select your preferred region

3. **Configure Database Access**
   - Go to "Database Access"
   - Create a new database user
   - Set appropriate permissions

4. **Configure Network Access**
   - Go to "Network Access"
   - Add IP addresses (0.0.0.0/0 for all IPs)

5. **Get Connection String**
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string

### Alternative: Self-hosted MongoDB

Use the provided `docker-compose.yml` file:

```bash
cd backend
docker-compose up -d mongodb
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expensetracker?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=https://expence-tracker-pro.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t expensetracker-backend .

# Run the container
docker run -p 3000:3000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-jwt-secret \
  expensetracker-backend
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Testing the Deployment

### Health Check
```bash
curl https://your-app-url/health
```

### API Documentation
```bash
curl https://your-app-url/api
```

### Test Authentication
```bash
# Register a new user
curl -X POST https://your-app-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🔗 Frontend Integration

After deploying the backend:

1. **Update Frontend API URL**
   - Set the `EXPENSE_TRACKER_API_URL` environment variable in your frontend
   - Or update the default URL in `api-client.js`

2. **Add Integration Scripts**
   - Copy the `frontend-integration` folder to your frontend project
   - Add the integration script to your `index.html`:

   ```html
   <script src="./frontend-integration/integration.js"></script>
   ```

3. **Test Integration**
   - Open browser console
   - Check for "✅ Backend integration completed" message
   - Test login/signup functionality

## 📊 Monitoring and Logs

### Render
- View logs in the Render dashboard
- Set up alerts for errors and performance

### Railway
- Use Railway CLI: `railway logs`
- Set up monitoring in Railway dashboard

### Vercel
- View logs in Vercel dashboard
- Use Vercel CLI: `vercel logs`

## 🔒 Security Considerations

1. **Use HTTPS** - All production deployments should use HTTPS
2. **Environment Variables** - Never commit `.env` files
3. **Database Security** - Use strong passwords and restrict network access
4. **CORS** - Configure CORS to only allow your frontend domain
5. **Rate Limiting** - The backend includes rate limiting by default
6. **Input Validation** - All inputs are validated using Joi schemas

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Verify network access settings
   - Ensure database user has correct permissions

2. **CORS Errors**
   - Verify CORS_ORIGIN environment variable
   - Check if frontend URL matches exactly

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings

4. **Build Failures**
   - Ensure all dependencies are in package.json
   - Check Node.js version compatibility

### Debug Mode

Set `NODE_ENV=development` to enable detailed error messages and logging.

## 📈 Scaling

### Horizontal Scaling
- Use load balancers for multiple instances
- Ensure session affinity for WebSocket connections
- Consider using Redis for session storage

### Database Scaling
- Use MongoDB replica sets for high availability
- Implement database sharding for large datasets
- Set up database monitoring and alerts

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## 📞 Support

For deployment issues:
1. Check the logs in your hosting platform
2. Verify environment variables
3. Test the health endpoint
4. Check database connectivity

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and alerts
2. Configure custom domain (optional)
3. Set up automated backups
4. Implement CI/CD pipeline
5. Add performance monitoring
