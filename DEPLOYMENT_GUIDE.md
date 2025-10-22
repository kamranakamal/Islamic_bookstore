# Deployment Guide for Maktab Muhammadiya - Vercel

This guide will help you deploy your Maktab Muhammadiya website to Vercel, even if you're a complete beginner.

## 📋 Prerequisites

Before you begin, make sure you have:

1. ✅ A GitHub account (sign up at [github.com](https://github.com))
2. ✅ A Vercel account (sign up at [vercel.com](https://vercel.com))
3. ✅ Your Supabase credentials ready (from your `.env.local` file)
4. ✅ Git installed on your computer

## 🚀 Step 1: Push Your Code to GitHub

### 1.1 Initialize Git Repository (if not already done)

Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit - Maktab Muhammadiya website"
```

### 1.2 Create a New Repository on GitHub

1. Go to [github.com](https://github.com)
2. Click the **+** icon in the top right corner
3. Select **"New repository"**
4. Name it: `maktab-muhammadiya`
5. Keep it **Private** (recommended) or **Public**
6. **DO NOT** initialize with README, .gitignore, or license
7. Click **"Create repository"**

### 1.3 Connect and Push to GitHub

Copy the commands GitHub shows you (something like this, but use YOUR username):

```bash
git remote add origin https://github.com/YOUR-USERNAME/maktab-muhammadiya.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Import Your Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and select your `maktab-muhammadiya` repository
5. Click **"Import"**

### 2.2 Configure Your Project

Vercel will detect it's a Next.js project automatically. Here's what to do:

#### Project Settings:
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (leave as is)
- **Build Command:** `npm run build` (auto-filled)
- **Output Directory:** `.next` (auto-filled)
- **Install Command:** `npm install` (auto-filled)

#### Node.js Version:
- Click **"Node.js Version"** dropdown
- Select **Node.js 18.x** or **20.x**

### 2.3 Add Environment Variables

This is the **most important step**! Click on **"Environment Variables"** and add each of these:

| Name | Value | Where to get it |
|------|-------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | From `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | From `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | From `.env.local` |
| `DATABASE_URL` | Your PostgreSQL connection string | From `.env.local` |
| `SUPABASE_BUCKET_NAME` | `book-covers` | From `.env.local` |
| `SUPABASE_PROJECT_ID` | Your Supabase project ID | From `.env.local` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `maktabamuhammadiya@gmail.com` | From `.env.local` |
| `NEXT_PUBLIC_CONTACT_PHONE` | `+919315580623` | From `.env.local` |
| `SUPABASE_COVER_BUCKET` | `book-cover` | From `.env.local` |
| `SUPABASE_GALLERY_BUCKET` | `book-images` | From `.env.local` |

**Important Notes:**
- Remove the quotation marks from values when copying from `.env.local`
- For `NEXT_PUBLIC_APP_URL`, use your Vercel domain (added after deployment)
- Make sure there are **no spaces** before or after the values

### 2.4 Deploy

1. After adding all environment variables, click **"Deploy"**
2. Wait 2-5 minutes for the build to complete
3. You'll see a success screen with confetti 🎉

## 🔧 Step 3: Post-Deployment Configuration

### 3.1 Update App URL

1. Copy your Vercel deployment URL (e.g., `https://maktab-muhammadiya.vercel.app`)
2. Go to your project **Settings** → **Environment Variables**
3. Add a new variable:
   - Name: `NEXT_PUBLIC_APP_URL`
   - Value: Your Vercel URL (e.g., `https://maktab-muhammadiya.vercel.app`)
4. Click **"Deployments"** tab → Click the three dots on latest deployment → **"Redeploy"**

### 3.2 Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to:
   - **Site URL:** `https://your-project.vercel.app`
   - **Redirect URLs:** Add `https://your-project.vercel.app/api/auth/callback`

### 3.3 Set Up Custom Domain (Optional)

If you have a custom domain:

1. In Vercel, go to your project **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `maktabmuhammadiya.com`)
4. Follow the DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` environment variable to your custom domain
6. Update Supabase redirect URLs with your custom domain

## 🔄 Step 4: Making Updates

Every time you make changes to your website:

```bash
# Save your changes
git add .
git commit -m "Description of what you changed"
git push

# Vercel will automatically detect and deploy!
```

## 🛠️ Troubleshooting

### Build Fails

**Problem:** Deployment fails during build

**Solutions:**
1. Check the build logs in Vercel dashboard
2. Make sure all environment variables are set correctly
3. Try running `npm run build` locally first
4. Check for TypeScript errors with `npm run lint`

### Database Connection Issues

**Problem:** Can't connect to Supabase

**Solutions:**
1. Verify all Supabase environment variables are correct
2. Check Supabase project is active and running
3. Ensure `DATABASE_URL` is the pooler connection string
4. Verify service role key has correct permissions

### Images Not Loading

**Problem:** Book covers or images don't appear

**Solutions:**
1. Check Supabase Storage buckets are public
2. Verify bucket names match environment variables
3. Go to Supabase Storage → Select bucket → Make it public
4. Check CORS settings in Supabase

### Authentication Not Working

**Problem:** Can't log in or sign up

**Solutions:**
1. Verify Supabase redirect URLs include your Vercel domain
2. Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Ensure cookies are enabled in browser
4. Check Supabase Auth settings

## 📊 Monitoring Your Site

### Vercel Analytics
1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. View visitor stats, performance metrics

### Error Tracking
1. Click **"Logs"** in Vercel dashboard
2. Filter by Runtime Logs or Build Logs
3. Check for any errors

## 🔒 Security Checklist

Before going live, ensure:

- [ ] All environment variables are set in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore` (never commit it!)
- [ ] Supabase Row Level Security (RLS) is enabled
- [ ] Admin routes are protected with authentication
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] Supabase API keys are not exposed in client code

## 📱 Testing Your Deployment

After deployment, test:

1. **Homepage:** Visit your site and check it loads
2. **Shop:** Browse books and categories
3. **Search:** Try searching for books
4. **Cart:** Add items to cart
5. **Authentication:** Try signing up and logging in
6. **Admin Panel:** Login to `/adminlogin` and verify access
7. **Contact Form:** Submit a test message
8. **Bulk Orders:** Submit a test bulk order request
9. **Mobile View:** Test on your phone or browser mobile view

## 🎯 Performance Optimization

Your site is already optimized, but you can:

1. **Enable Vercel Speed Insights:**
   - Go to project Settings → Speed Insights
   - Enable it for free
   
2. **Monitor Core Web Vitals:**
   - Check Vercel Analytics for performance metrics
   - Aim for green scores on all metrics

3. **Image Optimization:**
   - Vercel automatically optimizes images
   - Use WebP format when possible

## 🆘 Getting Help

If you encounter issues:

1. **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
2. **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
3. **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
4. **Vercel Support:** Available in dashboard chat

## 🎉 You're Live!

Congratulations! Your Maktab Muhammadiya website is now live on the internet!

**Share your site:**
- Your Vercel URL: `https://your-project.vercel.app`
- Custom domain (if configured): `https://yourdomain.com`

**Next Steps:**
1. Share the link with your team
2. Test all features thoroughly
3. Monitor analytics and errors
4. Plan your content and book catalog
5. Promote on social media

---

**Made with ❤️ for Maktab Muhammadiya**

*Last updated: October 2025*
