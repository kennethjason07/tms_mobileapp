# TMS Application Deployment Guide

## Frontend Deployment to Netlify

Your TMS (Tailor Management System) application is now ready for deployment to Netlify. Follow these steps:

### Prerequisites
- GitHub account
- Netlify account (free tier available)
- Your code pushed to a GitHub repository

### Step 1: Prepare Your Repository
1. Initialize git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - TMS app ready for deployment"
   ```

2. Create a GitHub repository and push your code:
   ```bash
   git remote add origin https://github.com/yourusername/tms-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Netlify

#### Option A: Netlify Dashboard (Recommended)
1. Visit [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your TMS repository
5. Configure build settings:
   - **Branch to deploy:** main
   - **Build command:** `npm run build:web`
   - **Publish directory:** `dist`
6. Click "Deploy site"

#### Option B: Netlify CLI
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Step 3: Environment Variables (If Needed)
If your app uses environment variables, add them in Netlify Dashboard:
1. Go to Site settings > Environment variables
2. Add any required variables (e.g., Supabase keys)

### Build Configuration
The project includes:
- ✅ `netlify.toml` - Netlify configuration file
- ✅ Build script: `npm run build:web`
- ✅ SPA routing configuration
- ✅ Performance headers and caching

## Backend Deployment Options

Your Python Flask backend (in the `/back` folder) needs to be deployed separately. Here are recommended options:

### Option 1: Railway (Recommended)
Railway offers easy Python deployment with database support:

1. Visit [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `back` folder as the root
4. Add a `Procfile` in the back folder:
   ```
   web: python app.py
   ```
5. Configure environment variables
6. Deploy

### Option 2: Render
1. Visit [render.com](https://render.com)
2. Create a new Web Service
3. Connect your repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python app.py`

### Option 3: Heroku
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-tms-backend`
3. Add Python buildpack: `heroku buildpacks:set heroku/python`
4. Deploy: `git subtree push --prefix=back heroku main`

### Backend Requirements
You'll need to create a `requirements.txt` file in your `/back` folder:
```txt
Flask==2.3.3
Flask-CORS==4.0.0
python-dotenv==1.0.0
# Add other dependencies as needed
```

## Database Setup
If you're using Supabase (as indicated in your frontend), make sure to:
1. Create a Supabase project
2. Set up your database tables
3. Configure environment variables in both frontend and backend deployments

## Domain Configuration
1. **Frontend (Netlify):** Will get a free .netlify.app subdomain
2. **Backend:** Will get a subdomain based on hosting provider
3. **Custom Domain:** Configure in Netlify settings if you have one

## Environment Variables to Configure

### Frontend (Netlify)
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_API_BASE_URL` (your backend URL)

### Backend
- `DATABASE_URL`
- `FLASK_ENV=production`
- `SECRET_KEY`
- Any API keys needed

## Post-Deployment Steps
1. Test all functionality in the deployed app
2. Update any hardcoded URLs to use your new backend URL
3. Configure CORS in your backend to allow your Netlify domain
4. Set up monitoring and error tracking

## Continuous Deployment
Both platforms support automatic deployment when you push to your main branch, enabling continuous deployment.

---

Your TMS application is now ready for deployment! The frontend will be served from Netlify's global CDN, providing fast loading times worldwide.