> ✅ Homepage hero now showcases featured and new arrival books with Arabic calligraphy accents and dual CTAs.
## 1. Navigation & Site Pages
- [x] Expand the primary navigation to include all customer-facing pages.
	- [x] Add menu links for: About Us, Shop, Authors, Blog, Contact, FAQ, Privacy Policy, Cart, and New Arrivals.
	- [x] Ensure responsive behavior and accessible focus states for the new navigation items.
- [x] Implement the Shop catalog page.
	- [x] Display all products with pagination or lazy loading as needed.
	- [x] Add keyword search and sorting (price, popularity, newest).
	- [x] Surface category filters for: Quran & Tafseer, Hadith Collection, Seerah, Fiqh, Aqeedah, Islamic History, Children’s Islamic Books.
	- [x] Include language filters (e.g., Arabic, English, Urdu, roman urdu, hindi) and allow multi-select.
- [x] Create stub content pages (About Us, Authors, Blog listing, Contact, FAQ, Privacy Policy) with hero, breadcrumbs, and SEO metadata.
- [x] Build a dedicated New Arrivals page that highlights the latest inventory.

## 2. Homepage & UI Enhancements
- [x] Redesign the hero section to showcase featured and new arrivals books side-by-side.
	- [x] Integrate Arabic calligraphy motifs or background accents consistent with the brand palette.
	- [x] Add CTAs driving to Shop and New Arrivals pages.
- [ ] Refresh overall UI spacing, typography, and card components for a polished feel.
- [ ] Validate the experience across mobile, tablet, and desktop viewports.

## 3. Admin Panel Access & Stability
- [ ] Remove the Admin Panel link from the public navigation.
- [ ] Ensure the admin dashboard is accessible directly at `/admin` while remaining protected behind authentication/authorization.
- [ ] Fix the redirect loop that currently sends authenticated admins to the order request page.
- [ ] Add regression checks to confirm non-admin users cannot reach `/admin`.
