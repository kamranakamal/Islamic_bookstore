# 🚀 Quick Start Guide - Maktab Muhammadiya

Get your website up and running in minutes!

## For Beginners: Complete Setup

### Step 1: Get Your Code (5 minutes)

If you don't have the code yet:

1. Download the project files
2. Extract to a folder like `maktab_muhammadiya`
3. Open Terminal (Mac/Linux) or Command Prompt (Windows)
4. Navigate to the folder:
   ```bash
   cd path/to/maktab_muhammadiya
   ```

### Step 2: Install Node.js (if not installed)

1. Go to [nodejs.org](https://nodejs.org)
2. Download the LTS version (recommended)
3. Install it (follow the installer)
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 3: Install Project Dependencies (2 minutes)

```bash
npm install
```

This will download all required packages. It might take a few minutes.

### Step 4: Set Up Environment Variables (5 minutes)

1. Create a file named `.env.local` in the project root
2. Copy this template and fill in your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
SUPABASE_PROJECT_ID=your-project-id

# Storage Buckets
SUPABASE_COVER_BUCKET=book-cover
SUPABASE_GALLERY_BUCKET=book-images

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONTACT_EMAIL=maktabamuhammadiya@gmail.com
NEXT_PUBLIC_CONTACT_PHONE=+919315580623
NODE_ENV=development
```

**Where to find Supabase values:**
- Go to [supabase.com](https://supabase.com)
- Open your project
- Go to Settings → API
- Copy the values

### Step 5: Set Up Database (10 minutes)

1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Create a new query
4. Copy and paste the contents of each file in `supabase/migrations/`
5. Run each migration in order
6. Run `scripts/seed-sample-books.sql` for sample data (optional)

### Step 6: Create Storage Buckets (5 minutes)

1. In Supabase, go to Storage
2. Create these buckets:
   - `book-cover` (make it public)
   - `book-images` (make it public)
3. For each bucket:
   - Click on the bucket
   - Go to Policies
   - Add policy: Allow public read access

### Step 7: Run the Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### Step 8: Create Admin Account (5 minutes)

1. Sign up through the website at `/signup`
2. Go to Supabase → SQL Editor
3. Run this query (replace with your email):
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```
4. Access admin panel at `/adminlogin`

## For Developers: Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linter
npm run lint

# Fix lint errors
npm run lint --fix

# Build for production
npm run build

# Run production build locally
npm run start
```

## 🎯 Next Steps After Setup

### Add Your First Book

1. Go to `/adminlogin` and log in
2. Click "Books" in the admin sidebar
3. Click "Add New Book"
4. Fill in the details:
   - Title
   - Author
   - ISBN (optional)
   - Price
   - Category
   - Upload cover image
5. Click "Save"

### Customize Content

1. **Homepage:** Edit `app/page.tsx`
2. **About Page:** Edit `app/about/page.tsx`
3. **Contact Info:** Update `.env.local`
4. **Logo:** Replace `public/logo.svg`
5. **Favicon:** Replace `public/icon.png`

### Add Categories

1. Go to Admin Panel → Categories
2. Click "Add Category"
3. Enter name and slug (URL-friendly name)
4. Save and assign books to categories

### Configure Email

For bulk order notifications:
1. Gmail link is already configured
2. It opens Gmail compose window with recipient email
3. No additional setup needed!

## 🐛 Common Issues & Solutions

### Port 3000 Already in Use

```bash
# Kill the process using port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Or use a different port:
PORT=3001 npm run dev
```

### Database Connection Error

- Check your `DATABASE_URL` in `.env.local`
- Make sure Supabase project is active
- Verify you're using the pooler connection string

### Images Not Showing

- Ensure buckets are created in Supabase Storage
- Make buckets public
- Check bucket names match `.env.local`
- Verify CORS is configured

### Can't Access Admin Panel

- Make sure you set role to 'admin' in database
- Clear browser cookies and try again
- Check that email matches exactly

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🚀 Ready to Deploy?

Once everything works locally:

1. Read [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)
2. Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Deploy to Vercel!

## 💡 Tips

### Development Workflow

1. Make changes to code
2. Save the file
3. Browser auto-refreshes (hot reload)
4. Check for errors in terminal and browser console
5. Test the feature
6. Commit changes with Git

### Testing Locally

Always test these before deploying:
- Sign up / Login
- Add to cart
- Search books
- Admin functions
- Forms submission

### Keep Code Clean

```bash
# Before committing:
npm run lint
npm run build

# Fix any errors that appear
```

## 🆘 Need Help?

If you get stuck:

1. Check the error message carefully
2. Search the error on Google
3. Check the documentation links above
4. Look at similar code in the project
5. Ask the team for help

## 🎉 You're All Set!

Your Maktab Muhammadiya website is now running locally!

**Happy coding!** 🚀

---

**Made with ❤️ for the Islamic community**

*May Allah accept this work - Ameen*
