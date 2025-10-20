import type { GenericRelationship, GenericSchema, GenericTable } from "@supabase/supabase-js/dist/module/lib/types";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "admin" | "member";
export type MessageStatus = "new" | "in_progress" | "resolved" | "archived";

export interface ProfileRow extends Record<string, unknown> {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type BookLanguage = "arabic" | "urdu" | "roman_urdu" | "english" | "hindi";

export const BOOK_LANGUAGES: readonly BookLanguage[] = [
  "arabic",
  "urdu",
  "roman_urdu",
  "english",
  "hindi"
] as const;

export const BOOK_LANGUAGE_LABEL: Record<BookLanguage, string> = {
  arabic: "Arabic",
  urdu: "Urdu",
  roman_urdu: "Roman Urdu",
  english: "English",
  hindi: "Hindi"
};

export const getBookLanguageLabel = (language: BookLanguage): string => BOOK_LANGUAGE_LABEL[language];

export interface BookRow extends Record<string, unknown> {
  id: string;
  title: string;
  author: string;
  page_count: number;
  available_formats: string[];
  available_languages: BookLanguage[];
  stock_quantity: number;
  price_local_inr: number;
  price_international_usd: number;
  description: string;
  cover_path: string | null;
  gallery_paths: string[];
  category_id: string;
  is_featured: boolean;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SitePageRow extends Record<string, unknown> {
  id: string;
  slug: string;
  title: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  body: string;
  metadata: Json;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageSectionRow extends Record<string, unknown> {
  id: string;
  page_id: string;
  identifier: string;
  type: string;
  heading: string | null;
  body: string | null;
  position: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface ContactMessageRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  admin_notes: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FaqEntryRow extends Record<string, unknown> {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  position: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostRow extends Record<string, unknown> {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image: string | null;
  author_name: string | null;
  tags: string[];
  metadata: Json;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow extends Record<string, unknown> {
  id: string;
  contact_message_id: string | null;
  sender_profile_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  direction: "incoming" | "outgoing";
  subject: string | null;
  body: string;
  attachments: Json;
  metadata: Json;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface BulkOrderRequestRow extends Record<string, unknown> {
  id: string;
  organization_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  location: string | null;
  quantity_estimate: number | null;
  budget_range: string | null;
  notes: string | null;
  requested_titles: Json;
  status: "pending" | "reviewing" | "quoted" | "completed" | "cancelled";
  metadata: Json;
  submitted_at: string;
  updated_at: string;
}

export interface OrderRow extends Record<string, unknown> {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  institution: string | null;
  notes: string | null;
  items: Array<{
    book_id: string;
    quantity: number;
  }>;
  status: "pending" | "approved" | "shipped" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface UserAddressRow extends Record<string, unknown> {
  id: string;
  profile_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCartItemRow extends Record<string, unknown> {
  id: string;
  profile_id: string;
  book_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface UserCartItem {
  bookId: string;
  quantity: number;
}

export interface AuditLogRow extends Record<string, unknown> {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  availableFormats: string[];
  availableLanguages: BookLanguage[];
  pageCount: number;
  stockQuantity: number;
  priceLocalInr: number;
  priceInternationalUsd: number;
  priceFormattedLocal: string;
  priceFormattedInternational: string;
  description: string;
  categoryId: string;
  categoryName: string;
  coverPath: string | null;
  coverUrl: string;
  galleryPaths: string[];
  galleryUrls: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBooksData {
  books: AdminBook[];
  categories: CategorySummary[];
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  priceLocalInr: number;
  priceInternationalUsd: number;
  priceFormattedLocal: string;
  priceFormattedInternational: string;
  coverUrl: string;
  galleryUrls: string[];
  categoryName: string;
  categorySlug?: string;
  isFeatured?: boolean;
  stockQuantity: number;
}

export interface BookDetail extends BookSummary {
  availableFormats: string[];
  availableLanguages: BookLanguage[];
  pageCount: number;
  description: string;
}

export type BookRowWithCategory = BookRow & { categories: Pick<CategoryRow, "name" | "slug"> | null };

export type CategoryRowWithBooks = CategoryRow & { books: BookRowWithCategory[] };

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  updatedAt?: string;
}

export interface CategoryWithBooks extends CategorySummary {
  books: BookSummary[];
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  heroEyebrow?: string | null;
  heroTitle?: string | null;
  heroDescription?: string | null;
  body: string;
  metadata: Json;
  published: boolean;
  sections: PageSection[];
}

export interface PageSection {
  id: string;
  identifier: string;
  type: string;
  heading?: string | null;
  body?: string | null;
  position: number;
  metadata: Json;
}

export interface SearchResult extends BookSummary {
  rank: number;
}

export interface OrderRequestPayload {
  name: string;
  email: string;
  phone?: string;
  institution?: string;
  message?: string;
  items: Array<{
    bookId: string;
    quantity: number;
  }>;
}

export interface CreateOrUpdateBookPayload {
  id?: string;
  title: string;
  author: string;
  availableFormats: string[];
  availableLanguages: BookLanguage[];
  pageCount: number;
  stockQuantity: number;
  priceLocalInr: number;
  priceInternationalUsd: number;
  description: string;
  categoryId: string;
  coverPath?: string | null;
  galleryPaths?: string[];
  isFeatured?: boolean;
}

export interface CreateOrUpdateBlogPostPayload {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  coverImage?: string | null;
  authorName?: string | null;
  tags: string[];
  metadata?: Json;
  published: boolean;
  publishedAt?: string | null;
}

export interface UploadUrlResponse {
  url: string;
  bucket: string;
  path: string;
  expiresAt: string;
  token: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export interface PageParams {
  params: {
    slug: string;
  };
}

export interface CartBook {
  id: string;
  title: string;
  author: string;
  priceLocalInr: number;
  priceFormattedLocal: string;
}

export interface CartItem {
  book: CartBook;
  quantity: number;
}

type TableDefinition<RowType, InsertType, UpdateType> = GenericTable & {
  Row: RowType;
  Insert: InsertType;
  Update: UpdateType;
  Relationships: GenericRelationship[];
};

type PublicDatabaseSchema = GenericSchema & {
  Tables: {
    profiles: TableDefinition<
      ProfileRow,
      Omit<ProfileRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<ProfileRow>
    >;
    books: TableDefinition<
      BookRow,
      Omit<BookRow, "id" | "created_at" | "updated_at" | "search_vector"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
        search_vector?: string | null;
      },
      Partial<BookRow>
    >;
    categories: TableDefinition<
      CategoryRow,
      Omit<CategoryRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<CategoryRow>
    >;
    orders: TableDefinition<
      OrderRow,
      Omit<OrderRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<OrderRow>
    >;
    user_addresses: TableDefinition<
      UserAddressRow,
      Omit<UserAddressRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<UserAddressRow>
    >;
    user_cart_items: TableDefinition<
      UserCartItemRow,
      Omit<UserCartItemRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<UserCartItemRow>
    >;
    audit_logs: TableDefinition<
      AuditLogRow,
      Omit<AuditLogRow, "id" | "created_at"> & { id?: string; created_at?: string },
      Partial<AuditLogRow>
    >;
    site_pages: TableDefinition<
      SitePageRow,
      Omit<SitePageRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<SitePageRow>
    >;
    page_sections: TableDefinition<
      PageSectionRow,
      Omit<PageSectionRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<PageSectionRow>
    >;
    contact_messages: TableDefinition<
      ContactMessageRow,
      Omit<ContactMessageRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<ContactMessageRow>
    >;
    faq_entries: TableDefinition<
      FaqEntryRow,
      Omit<FaqEntryRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<FaqEntryRow>
    >;
    blog_posts: TableDefinition<
      BlogPostRow,
      Omit<BlogPostRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<BlogPostRow>
    >;
    messages: TableDefinition<
      MessageRow,
      Omit<MessageRow, "id" | "created_at" | "updated_at"> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      },
      Partial<MessageRow>
    >;
    bulk_order_requests: TableDefinition<
      BulkOrderRequestRow,
      Omit<BulkOrderRequestRow, "id" | "submitted_at" | "updated_at"> & {
        id?: string;
        submitted_at?: string;
        updated_at?: string;
      },
      Partial<BulkOrderRequestRow>
    >;
  };
  Views: Record<string, never>;
  Functions: Record<string, never>;
  Enums: {
    order_status: OrderRow["status"];
    user_role: UserRole;
    message_status: MessageStatus;
    bulk_order_status: BulkOrderRequestRow["status"];
  };
  CompositeTypes: Record<string, never>;
};

export type Database = {
  public: PublicDatabaseSchema;
};

type PublicSchema = Database["public"];

export type Tables<
  PublicTableName extends keyof PublicSchema["Tables"] & string
> = PublicSchema["Tables"][PublicTableName]["Row"];

export type TablesInsert<
  PublicTableName extends keyof PublicSchema["Tables"] & string
> = PublicSchema["Tables"][PublicTableName]["Insert"];

export type TablesUpdate<
  PublicTableName extends keyof PublicSchema["Tables"] & string
> = PublicSchema["Tables"][PublicTableName]["Update"];

export interface AdminOrder {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  institution: string | null;
  status: OrderRow["status"];
  notes: string | null;
  items: OrderRow["items"];
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AdminAnalyticsSnapshot {
  totalBooks: number;
  newBooksLast30Days: number;
  featuredBooks: number;
  booksByCategory: Array<{ category: string; count: number }>;
  booksByLanguage: Array<{ language: BookLanguage; count: number }>;
  totalOrders: number;
  totalOrdersPending: number;
  ordersByStatus: Array<{ status: OrderRow["status"]; count: number }>;
  totalOrderItems: number;
  estimatedLocalRevenue: number;
  totalUsers: number;
  mostRequestedTitles: Array<{ title: string; count: number }>;
  recentBooks: Array<{ id: string; title: string; createdAt: string; category: string | null; isFeatured: boolean }>;
}

export interface UserAddress {
  id: string;
  profileId: string;
  label: string;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  adminNotes: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  position: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  authorName: string | null;
  tags: string[];
  metadata: Json;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl: string;
  authorName?: string | null;
  tags: string[];
  publishedAt?: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  body: string;
}

export interface AdminBulkOrderRequest {
  id: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  location: string | null;
  quantityEstimate: number | null;
  budgetRange: string | null;
  notes: string | null;
  requestedTitles: string[];
  status: BulkOrderRequestRow["status"];
  metadata: Json;
  submittedAt: string;
  updatedAt: string;
}

export interface AdminMessageThreadMessage {
  id: string;
  direction: "incoming" | "outgoing";
  subject: string | null;
  body: string;
  sentAt: string;
  senderName: string | null;
  senderEmail: string | null;
  attachments: Json;
}

export interface AdminMessageThread {
  contactMessage: AdminContactMessage;
  messages: AdminMessageThreadMessage[];
}
