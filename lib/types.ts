import type { GenericRelationship, GenericSchema, GenericTable } from "@supabase/supabase-js/dist/module/lib/types";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "admin" | "member";

export interface ProfileRow extends Record<string, unknown> {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface BookRow extends Record<string, unknown> {
  id: string;
  slug: string;
  title: string;
  author: string;
  publisher: string | null;
  format: string;
  page_count: number;
  language: string;
  isbn: string | null;
  price_cents: number;
  summary: string;
  description: string;
  cover_path: string | null;
  category_id: string;
  is_featured: boolean;
  search_vector: string | null;
  highlights: string[];
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
  slug: string;
  author: string;
  publisher: string | null;
  format: string;
  pageCount: number;
  language: string;
  isbn: string | null;
  priceCents: number;
  priceFormatted: string;
  summary: string;
  description: string;
  categoryId: string;
  categoryName: string;
  coverPath: string | null;
  coverUrl: string;
  highlights: string[];
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
  slug: string;
  title: string;
  author: string;
  summary: string;
  priceCents: number;
  priceFormatted: string;
  coverUrl: string;
  categoryName: string;
  categorySlug?: string;
  isFeatured?: boolean;
}

export interface BookDetail extends BookSummary {
  publisher: string | null;
  format: string;
  pageCount: number;
  language: string;
  isbn: string | null;
  description: string;
  highlights: string[];
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
    bookSlug: string;
    quantity: number;
  }>;
}

export interface CreateOrUpdateBookPayload {
  id?: string;
  title: string;
  slug: string;
  author: string;
  publisher?: string;
  format: string;
  pageCount: number;
  language: string;
  isbn?: string;
  priceCents: number;
  summary: string;
  description: string;
  categoryId: string;
  coverPath?: string | null;
  highlights?: string[];
  isFeatured?: boolean;
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
  slug: string;
  title: string;
  author: string;
  priceCents: number;
  priceFormatted: string;
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
    audit_logs: TableDefinition<
      AuditLogRow,
      Omit<AuditLogRow, "id" | "created_at"> & { id?: string; created_at?: string },
      Partial<AuditLogRow>
    >;
  };
  Views: Record<string, never>;
  Functions: Record<string, never>;
  Enums: {
    order_status: OrderRow["status"];
    user_role: UserRole;
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
  totalOrdersPending: number;
  totalUsers: number;
  mostRequestedTitles: Array<{ title: string; count: number }>;
}
