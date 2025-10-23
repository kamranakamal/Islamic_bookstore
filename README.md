# 📚 Maktab Muhammadiya

> Books curated from the Qur'an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge.

A modern, full-featured Islamic bookstore built with Next.js 14, TypeScript, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)

## ✨ Features

### 🛍️ Customer Features
- **Book Catalog** - Browse authenticated Islamic books with advanced filtering
- **Smart Search** - Find books by title, author, category, or ISBN
- **Shopping Cart** - Full cart management with quantity controls
- **User Accounts** - Secure authentication with Supabase Auth
- **Order Management** - Track orders and view order history
- **Multiple Addresses** - Save and manage shipping addresses
- **Multi-Currency** - Support for INR, USD, GBP, EUR, and SAR
- **Bulk Orders** - Special form for institutional and wholesale requests
- **Blog** - Islamic content and book reviews
- **Contact System** - Direct messaging to the team
- **FAQ Section** - Common questions and answers
- **Mobile Responsive** - Optimized for all devices
- **Smooth Scrolling** - Touch-optimized scrolling for mobile and tablet devices

### 👨‍💼 Admin Features
- **Dashboard** - Comprehensive analytics and insights
- **Book Management** - Add, edit, delete books with image upload
- **Category Management** - Organize books by categories
- **Order Processing** - View and manage customer orders
- **Payment Tracking** - Monitor payment confirmations
- **Bulk Order Management** - Handle wholesale requests
- **User Management** - View and manage customer accounts
- **Message System** - Respond to customer inquiries
- **Blog Management** - Create and publish blog posts
- **FAQ Management** - Manage frequently asked questions
- **Analytics Export** - Download sales and customer data

## 🚀 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Deployment:** Vercel
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Email:** Gmail integration for bulk orders

## 📦 Project Structure

```
maktab_muhammadiya/
├── app/                    # Next.js 14 App Router
│   ├── (routes)/          # Public routes
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/
│   ├── admin/             # Admin components
│   ├── site/              # Public site components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── data/              # Data fetching functions
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── validators/        # Zod schemas
├── public/                # Static assets
└── supabase/
    └── migrations/        # Database migrations
```

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd maktab_muhammadiya
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_postgres_connection_string
   SUPABASE_PROJECT_ID=your_project_id
   
   # Storage
   SUPABASE_COVER_BUCKET=book-cover
   SUPABASE_GALLERY_BUCKET=book-images
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_CONTACT_EMAIL=maktabamuhammadiya@gmail.com
   NEXT_PUBLIC_CONTACT_PHONE=+919315580623
   NODE_ENV=development
   ```

4. **Set up Supabase Database**
   
   Run the migrations in `supabase/migrations/` in your Supabase SQL editor

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Admin Access

To create an admin user:

1. Sign up normally through the website
2. Run the admin profile setup script in Supabase SQL editor:
   ```sql
   -- See scripts/fix-admin-profile.sql
   ```
3. Access admin panel at `/adminlogin`

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
```

## 🌐 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions to Vercel.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/maktab-muhammadiya)

**Important:** Set all environment variables in Vercel before deploying!

## 🔐 Security

- All sensitive data uses environment variables
- Supabase Row Level Security (RLS) enabled
- Admin routes protected with authentication
- API routes secured with auth checks
- CORS configured for Supabase Storage
- Input validation with Zod schemas
- XSS protection with React's built-in sanitization

## 🎨 Design System

### Colors
- **Primary:** Islamic green (`#047857`)
- **Text:** Gray scale for readability
- **Backgrounds:** White and subtle grays

### Typography
- **Headings:** Bold, clear hierarchy
- **Body:** Readable sans-serif font
- **RTL Support:** Ready for Arabic content

### Components
- Consistent spacing and sizing
- Accessible form controls
- Loading states and skeletons
- Error boundaries
- Responsive breakpoints

## 📊 Database Schema

Key tables:
- `books` - Book catalog
- `categories` - Book categories
- `orders` - Customer orders
- `order_items` - Order line items
- `profiles` - User profiles
- `addresses` - Shipping addresses
- `bulk_orders` - Wholesale requests
- `messages` - Contact form submissions
- `blog_posts` - Blog content
- `faq_items` - FAQ entries

See `supabase/migrations/` for full schema.

## 🧪 Testing

Currently manual testing. Future improvements:
- Unit tests with Jest
- E2E tests with Playwright
- Component tests with React Testing Library

## 📈 Performance

- **Lighthouse Score:** 90+ on all metrics
- **Image Optimization:** Next.js Image component
- **Code Splitting:** Automatic with App Router
- **Caching:** ISR with 60-second revalidation
- **Bundle Analysis:** Optimized imports
- **Smooth Scrolling:** Touch-optimized with iOS momentum scrolling support

### Smooth Scrolling Features
- Native `scroll-behavior: smooth` for modern browsers
- iOS Safari momentum scrolling (`-webkit-overflow-scrolling: touch`)
- Polyfill for older browsers with easeInOutCubic animation
- Anchor link smooth navigation
- Performance optimized (uses `requestAnimationFrame`)
- Accessibility compliant (respects `prefers-reduced-motion`)
- Touch-optimized viewport settings

See [PERFORMANCE_OPTIMIZATION_GUIDE.md](./PERFORMANCE_OPTIMIZATION_GUIDE.md) for details.

## 🤝 Contributing

This is a private project for Maktab Muhammadiya. If you're part of the team:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit for review

## 📞 Support

**Contact Information:**
- Email: maktabamuhammadiya@gmail.com
- Phone: +91 93155 80623
- Instagram: [@maktabamuhammadiya.__](https://www.instagram.com/maktabamuhammadiya.__)

**Address:**
Azad Market Mohalla Sheesh Mehel
House No. 830, Fourth Floor, Front Side
Purani Delhi 110006, India

## 📄 License

Private and proprietary. All rights reserved by Maktab Muhammadiya.

## 🙏 Acknowledgments

Built with modern web technologies to serve the Islamic community with authentic knowledge.

*Barakallahu feekum* (May Allah bless you)

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Maintained by:** Maktab Muhammadiya Team
