# 🚀 Pre-Deployment Checklist

Use this checklist before deploying your Maktab Muhammadiya website to production.

## ✅ Code Quality

- [x] All lint errors fixed (`npm run lint`)
- [x] Build succeeds locally (`npm run build`)
- [x] TypeScript errors resolved
- [ ] All console.log statements removed or made conditional
- [x] No sensitive data in code (all in environment variables)

## 🔐 Security

- [x] `.env.local` is in `.gitignore`
- [ ] Supabase Row Level Security (RLS) policies enabled
- [ ] Admin email configured correctly in Supabase
- [ ] All API routes have authentication checks
- [x] CORS configured in Supabase Storage
- [ ] Supabase buckets have correct permissions
- [ ] Admin panel requires authentication
- [x] No API keys exposed in client-side code

## 🗄️ Database

- [ ] All Supabase migrations applied
- [ ] Sample data removed (if any test data exists)
- [ ] Database indexes created for performance
- [ ] RLS policies tested for all tables
- [ ] Admin user created and tested
- [ ] Storage buckets created:
  - [ ] `book-cover` (public)
  - [ ] `book-images` (public)

## 📝 Content

- [ ] At least 10 books added to catalog
- [ ] Categories created and assigned
- [ ] Homepage content added
- [ ] About page content updated
- [ ] FAQ items added (at least 5)
- [ ] Privacy policy reviewed
- [ ] Contact information verified
- [ ] Blog posts created (optional)

## 🎨 Design & UX

- [x] Mobile responsive on all pages
- [ ] All images optimized (< 500KB each)
- [ ] Favicon and app icons set
- [x] Loading states for all async operations
- [x] Error states and messages user-friendly
- [ ] Forms have proper validation
- [x] Success messages after actions

## ⚙️ Configuration

- [x] All environment variables documented
- [x] Contact email correct: `maktabamuhammadiya@gmail.com`
- [x] Contact phone correct: `+91 93155 80623`
- [x] Address updated in config
- [ ] Social media links added (Instagram)
- [ ] Currency conversion rates configured
- [x] Default currency set

## 🧪 Testing

Test all major features:

### Public Pages
- [ ] Homepage loads correctly
- [ ] Shop page with filters works
- [ ] Search functionality works
- [ ] Book detail pages display correctly
- [ ] Category pages work
- [ ] Blog pages load
- [ ] About page loads
- [ ] Contact form submits
- [ ] FAQ page loads

### Authentication
- [ ] Sign up creates new account
- [ ] Email confirmation works (if enabled)
- [ ] Login works with correct credentials
- [ ] Logout works
- [ ] Password reset works (test carefully!)
- [ ] Protected routes redirect to login

### Shopping Features
- [ ] Add to cart works
- [ ] Cart updates quantities
- [ ] Cart persists across sessions
- [ ] Remove from cart works
- [ ] Checkout process works
- [ ] Order confirmation received
- [ ] Order appears in user's order history

### User Account
- [ ] Profile page loads
- [ ] Can add addresses
- [ ] Can edit addresses
- [ ] Can delete addresses
- [ ] Can set default address
- [ ] Order history shows orders

### Admin Panel
- [ ] Admin login works at `/adminlogin`
- [ ] Dashboard shows analytics
- [ ] Can add new books
- [ ] Can edit books
- [ ] Can delete books
- [ ] Can upload images
- [ ] Can manage categories
- [ ] Can view orders
- [ ] Can view messages
- [ ] Can manage bulk orders
- [ ] Can view users
- [ ] Can export data

### Forms
- [ ] Contact form sends messages
- [ ] Bulk order form submits
- [ ] Order request form works
- [ ] Newsletter signup (if applicable)

### Currency
- [ ] Currency selector appears
- [ ] Prices convert correctly
- [ ] Selected currency persists
- [ ] All supported currencies work

## 🌐 SEO & Meta

- [x] Page titles are descriptive
- [x] Meta descriptions added
- [x] Open Graph tags set
- [x] Robots.txt configured
- [x] Sitemap generated
- [ ] Google Search Console set up (after deployment)
- [ ] Google Analytics added (optional)

## 📱 Performance

- [x] Lighthouse score > 80 on all metrics
- [x] Images use Next.js Image component
- [x] Lazy loading implemented
- [x] Code splitting automatic with App Router
- [ ] Test on slow 3G network
- [ ] Test on mobile devices

## 🔄 Git & Version Control

- [ ] All changes committed
- [ ] Commit messages are clear
- [ ] No merge conflicts
- [ ] Branch is up to date with main
- [ ] `.gitignore` excludes:
  - [x] `node_modules/`
  - [x] `.next/`
  - [x] `.env*.local`
  - [x] `.vercel/`

## 📦 Dependencies

- [x] No unused dependencies
- [x] All dependencies up to date
- [x] No security vulnerabilities (`npm audit`)
- [x] Package.json has correct scripts

## 🚀 Deployment Preparation

### Vercel Setup
- [ ] Vercel account created
- [ ] GitHub repository created
- [ ] Repository is private (recommended)
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables ready to add

### Environment Variables for Vercel
Prepare these values from your `.env.local`:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `SUPABASE_PROJECT_ID`
- [ ] `SUPABASE_COVER_BUCKET`
- [ ] `SUPABASE_GALLERY_BUCKET`
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL`
- [ ] `NEXT_PUBLIC_CONTACT_PHONE`
- [ ] `NODE_ENV` (set to `production`)

**Note:** `NEXT_PUBLIC_APP_URL` will be set after first deployment

### Supabase Configuration
- [ ] Supabase project is on production/paid plan (if needed)
- [ ] Database backups enabled
- [ ] Auth redirect URLs updated with Vercel domain
- [ ] Auth email templates customized (optional)
- [ ] Storage CORS configured for Vercel domain

## 📊 Post-Deployment

After deploying, verify:

- [ ] Site loads at Vercel URL
- [ ] All pages accessible
- [ ] No console errors in browser
- [ ] Images load correctly
- [ ] Authentication works
- [ ] Admin panel accessible
- [ ] Forms submit successfully
- [ ] Email notifications work
- [ ] Database operations work
- [ ] Mobile view works
- [ ] SSL/HTTPS enabled (automatic on Vercel)

## 🎯 Launch Day Tasks

- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel
- [ ] Update Supabase auth URLs
- [ ] Redeploy to apply URL changes
- [ ] Test complete user journey
- [ ] Share link with team for testing
- [ ] Announce launch (when ready!)

## 🔍 Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Set up alerts for downtime
- [ ] Monitor database usage
- [ ] Check storage usage
- [ ] Review logs regularly

## 📞 Support Preparation

- [ ] Document common issues
- [ ] Prepare FAQ responses
- [ ] Set up support email monitoring
- [ ] Create admin user guide
- [ ] Test customer support workflow

## 🎉 Ready to Deploy!

Once all checkboxes are ticked:

1. ✅ Do a final `npm run build` locally
2. ✅ Push all changes to GitHub
3. ✅ Follow the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
4. ✅ Test everything in production
5. ✅ Celebrate! 🎊

---

**Questions?** Review the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or contact the development team.

**May Allah accept this work and make it beneficial for the Ummah!**

*Barakallahu feekum*
