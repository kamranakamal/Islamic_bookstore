import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { toAdminBlogPost, toAdminBook } from "@/lib/data/transformers";
import type {
  AdminAnalyticsSnapshot,
  AdminBlogPost,
  AdminBooksData,
  AdminBulkOrderRequest,
  AdminCheckoutPreference,
  AdminContactMessage,
  AdminFaqEntry,
  AdminMessageThread,
  AdminOrder,
  AdminUserSummary,
  BlogPostRow,
  BookLanguage,
  BookRowWithCategory,
  BulkOrderRequestRow,
  CategorySummary,
  CheckoutPreferenceRow,
  ContactMessageRow,
  FaqEntryRow,
  MessageRow,
  OrderRow,
  ProfileRow
} from "@/lib/types";

export async function getAdminBooksData(): Promise<AdminBooksData> {
  const supabase = getSupabaseAdmin();
  const [booksResponse, categoriesResponse] = await Promise.all([
    supabase
      .from("books")
      .select("*, categories(name, slug)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, slug, name, description, updated_at")
      .order("name", { ascending: true })
  ]);

  const bookRows = (booksResponse.data ?? []) as BookRowWithCategory[];
  const categoryRows = (categoriesResponse.data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    updated_at: string;
  }>;

  return {
    books: bookRows.map((row) => toAdminBook(row)),
    categories: categoryRows.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      updatedAt: category.updated_at
    } satisfies CategorySummary))
  };
}

export async function getAdminCategories(): Promise<CategorySummary[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description, updated_at")
    .order("name", { ascending: true });

  const rows = (data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    updatedAt: row.updated_at
  } satisfies CategorySummary));
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("orders")
    .select("id, full_name, email, phone, institution, status, notes, items, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as OrderRow[];

  return rows.map((order) => ({
    id: order.id,
    fullName: order.full_name,
    email: order.email,
    phone: order.phone,
    institution: order.institution,
    status: order.status,
    notes: order.notes,
    items: order.items ?? [],
    createdAt: order.created_at
  }));
}

export async function getAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ProfileRow[];

  return rows.map((profile) => ({
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    createdAt: profile.created_at
  }));
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsSnapshot> {
  const supabase = getSupabaseAdmin();

  const [booksResponse, ordersResponse, userCountResponse] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, created_at, is_featured, available_languages, price_local_inr, categories(name, slug)")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("id, status, items, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]);

  const bookRows = (booksResponse.data ?? []) as BookRowWithCategory[];
  type OrderForAnalytics = Pick<OrderRow, "status" | "items" | "created_at"> & { id: string };
  const orderRows = (ordersResponse.data ?? []) as OrderForAnalytics[];
  const totalUsers = userCountResponse.count ?? 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newBooksLast30Days = bookRows.filter((book) => new Date(book.created_at) >= thirtyDaysAgo).length;
  const featuredBooks = bookRows.filter((book) => book.is_featured).length;

  const booksByCategoryMap = new Map<string, number>();
  for (const book of bookRows) {
  const categoryName = book.categories?.name ?? "Uncategorised";
    booksByCategoryMap.set(categoryName, (booksByCategoryMap.get(categoryName) ?? 0) + 1);
  }
  const booksByCategory = Array.from(booksByCategoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const booksByLanguageMap = new Map<BookLanguage, number>();
  for (const book of bookRows) {
    for (const language of book.available_languages ?? []) {
      booksByLanguageMap.set(language, (booksByLanguageMap.get(language) ?? 0) + 1);
    }
  }
  const booksByLanguage = Array.from(booksByLanguageMap.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  const totalOrders = orderRows.length;
  const ordersByStatusMap = new Map<OrderRow["status"], number>();
  let totalOrderItems = 0;

  const bookTitleById = new Map<string, string>();
  const bookPriceById = new Map<string, number>();
  for (const book of bookRows) {
    bookTitleById.set(book.id, book.title);
    bookPriceById.set(book.id, book.price_local_inr ?? 0);
  }

  const aggregatedTitles = new Map<string, number>();
  let estimatedLocalRevenue = 0;

  for (const order of orderRows) {
    ordersByStatusMap.set(order.status, (ordersByStatusMap.get(order.status) ?? 0) + 1);
    const items = order.items ?? [];
    for (const item of items) {
      totalOrderItems += item.quantity;
      const title = bookTitleById.get(item.book_id);
      if (title) {
        aggregatedTitles.set(title, (aggregatedTitles.get(title) ?? 0) + item.quantity);
      }

      if (order.status !== "cancelled") {
        const price = bookPriceById.get(item.book_id) ?? 0;
        estimatedLocalRevenue += price * item.quantity;
      }
    }
  }

  const ordersByStatus = Array.from(ordersByStatusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const mostRequestedTitles = Array.from(aggregatedTitles.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, count }));

  const recentBooks = bookRows.slice(0, 5).map((book) => ({
    id: book.id,
    title: book.title,
    createdAt: book.created_at,
    category: book.categories?.name ?? "Uncategorised",
    isFeatured: book.is_featured
  }));

  return {
    totalBooks: bookRows.length,
    newBooksLast30Days,
    featuredBooks,
    booksByCategory,
    booksByLanguage,
    totalOrders,
    totalOrdersPending: ordersByStatusMap.get("pending") ?? 0,
    ordersByStatus,
    totalOrderItems,
    estimatedLocalRevenue,
    totalUsers,
    mostRequestedTitles,
    recentBooks
  };
}

export async function getAdminMessages(): Promise<AdminContactMessage[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ContactMessageRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getAdminFaqEntries(): Promise<AdminFaqEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("faq_entries")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as FaqEntryRow[];

  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    position: row.position,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getAdminBlogPosts(): Promise<AdminBlogPost[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as BlogPostRow[];

  return rows.map((row) => toAdminBlogPost(row));
}

export async function getAdminBulkOrderRequests(): Promise<AdminBulkOrderRequest[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("bulk_order_requests")
    .select("*")
    .order("submitted_at", { ascending: false });

  const rows = (data ?? []) as BulkOrderRequestRow[];

  return rows.map((row) => ({
    id: row.id,
    organizationName: row.organization_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    location: row.location,
    quantityEstimate: row.quantity_estimate,
    budgetRange: row.budget_range,
    notes: row.notes,
    requestedTitles: Array.isArray(row.requested_titles) ? (row.requested_titles as string[]) : [],
    status: row.status,
    metadata: row.metadata ?? {},
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at
  }));
}

export async function getAdminMessageThread(id: string): Promise<AdminMessageThread | null> {
  const supabase = getSupabaseAdmin();
  const [{ data: contact }, { data: messages }] = await Promise.all([
    supabase.from("contact_messages").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("messages")
      .select("*")
      .eq("contact_message_id", id)
      .order("sent_at", { ascending: true })
  ]);

  const contactRow = contact as ContactMessageRow | null;
  const messageRows = (messages ?? []) as MessageRow[];

  if (!contactRow) {
    return null;
  }

  const contactMessage: AdminContactMessage = {
    id: contactRow.id,
    name: contactRow.name,
    email: contactRow.email,
    phone: contactRow.phone,
    subject: contactRow.subject,
    message: contactRow.message,
    status: contactRow.status,
    adminNotes: contactRow.admin_notes,
    respondedAt: contactRow.responded_at,
    createdAt: contactRow.created_at,
    updatedAt: contactRow.updated_at
  };

  return {
    contactMessage,
    messages: messageRows.map((row) => ({
      id: row.id,
      direction: row.direction,
      subject: row.subject,
      body: row.body,
      sentAt: row.sent_at,
      senderName: row.sender_name,
      senderEmail: row.sender_email,
      attachments: row.attachments ?? []
    }))
  };
}

export async function getAdminCheckoutPreferences(): Promise<AdminCheckoutPreference[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("checkout_preferences")
    .select("*, profiles:profile_id(id, email, display_name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Array<
    CheckoutPreferenceRow & { profiles: Pick<ProfileRow, "id" | "email" | "display_name"> | null }
  >;

  return rows.map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    profileEmail: row.profiles?.email ?? "",
    profileName: row.profiles?.display_name ?? null,
    billingName: row.billing_name,
    billingEmail: row.billing_email,
    billingPhone: row.billing_phone,
    paymentMethod: row.payment_method,
    deliveryWindow: row.delivery_window,
    referenceCode: row.reference_code,
    paymentIdentifier: row.payment_identifier,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
