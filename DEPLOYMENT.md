# Deployment Guide: LEGAFIN SARL Brand Detection Dashboard on Hostinger

## Prerequisites
- Hostinger account with Node.js hosting support
- GitHub account (for deployment)
- Supabase project (already configured)

## Step 1: Prepare Your Project for Production

### 1.1 Create Production Build Script
Your `package.json` already has the necessary scripts. Verify:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 1.2 Update Environment Variables
Create a `.env.production` file (DO NOT commit this to Git):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tiszirpwlhomuxmyqnkq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_-t3H7Ekfl36-iA0rMiQySA_yPpBdYBa
SUPABASE_SERVICE_ROLE_KEY=sb_secret_hitciY6fumQ8iwxxorqGBQ_UYVteAVw
```

### 1.3 Add `.gitignore`
Ensure sensitive files aren't uploaded:
```
node_modules/
.next/
.env.local
.env.production
.env
```

## Step 2: Push to GitHub

### 2.1 Initialize Git (if not already done)
```bash
cd "/home/micro/Documents/Cursor/AI Model"
git init
git add .
git commit -m "Initial commit: LEGAFIN Brand Detection Dashboard"
```

### 2.2 Create GitHub Repository
1. Go to https://github.com/new
2. Name: `legafin-brand-detection`
3. Make it **Private** (recommended for business apps)
4. Click **Create repository**

### 2.3 Push Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/legafin-brand-detection.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Hostinger

### Option A: Using Hostinger's Node.js Hosting

#### 3.1 Access Hostinger Panel
1. Log in to Hostinger
2. Go to **Hosting** → **Manage**
3. Find **Node.js** section

#### 3.2 Create Node.js Application
1. Click **Create Application**
2. **Application Root**: `/public_html/brand-detection`
3. **Application URL**: Choose your domain or subdomain
4. **Node.js Version**: Select **18.x** or higher
5. **Application Mode**: Production
6. **Application Startup File**: `server.js` (we'll create this)

#### 3.3 Upload Files via FTP/SSH
**Using File Manager:**
1. Go to **Files** → **File Manager**
2. Navigate to `/public_html/brand-detection`
3. Upload all project files EXCEPT:
   - `node_modules/` (will be installed on server)
   - `.next/` (will be built on server)

**Using SSH (Recommended):**
```bash
# Connect to Hostinger via SSH
ssh your-username@your-domain.com

# Navigate to app directory
cd public_html/brand-detection

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/legafin-brand-detection.git .

# Install dependencies
npm install

# Build the app
npm run build
```

#### 3.4 Create Server File
Hostinger needs a custom server file. Create `server.js`:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

#### 3.5 Set Environment Variables
In Hostinger Panel:
1. Go to **Node.js** → **Your App** → **Environment Variables**
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`

#### 3.6 Start Application
```bash
npm run build
npm start
```

Or use Hostinger's **Start Application** button.

---

### Option B: Using Vercel (Easier Alternative - Recommended)

Hostinger's Node.js support can be limited. **Vercel** is optimized for Next.js and FREE for small projects.

#### 3.1 Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Vercel auto-detects Next.js settings
6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Click **Deploy**

#### 3.2 Custom Domain (Optional)
1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your Hostinger domain (e.g., `brands.legafin.com`)
3. Update DNS in Hostinger:
   - Type: `CNAME`
   - Name: `brands` (or `@` for root)
   - Value: `cname.vercel-dns.com`

---

## Step 4: Post-Deployment Checklist

### 4.1 Test the Application
1. Visit your deployed URL
2. Test Brand Library import
3. Test PDF Scan
4. Verify Supabase connection

### 4.2 Configure Supabase for Production
1. Go to Supabase Dashboard → **Settings** → **API**
2. Add your production domain to **Allowed Origins**:
   - `https://your-domain.com`
   - `https://www.your-domain.com`

### 4.3 Enable HTTPS
- Vercel: Automatic
- Hostinger: Enable SSL in **SSL/TLS** section

### 4.4 Monitor Logs
- Vercel: Built-in logging dashboard
- Hostinger: Check `/logs` directory or Node.js panel

---

## Troubleshooting

### "Module not found" errors
```bash
npm install
npm run build
```

### Environment variables not loading
- Verify they're set in hosting panel
- Restart the application

### Supabase connection fails
- Check if production domain is in Supabase allowed origins
- Verify API keys are correct

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## Recommended: Use Vercel
For Next.js apps, **Vercel is the easiest and most reliable option**. It's free for personal/small business use and handles all the complexity automatically.

Hostinger is better for traditional PHP/static sites, but can work with extra configuration.
