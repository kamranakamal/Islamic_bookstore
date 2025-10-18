import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { toAdminBlogPost, toAdminBook } from "@/lib/data/transformers";
import type {
  AdminAnalyticsSnapshot,
  AdminBlogPost,
  AdminBooksData,
  AdminBulkOrderRequest,
  AdminContactMessage,
  AdminFaqEntry,
  AdminMessageThread,
  AdminOrder,
  AdminUserSummary,
  BlogPostRow,
  BookRowWithCategory,
  BulkOrderRequestRow,
  CategorySummary,
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

  const [{ count: totalBooks }, { count: totalOrdersPending }, { count: totalUsers }] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]);

  const [{ data: bookLookup }, { data: recentOrders }] = await Promise.all([
    supabase.from("books").select("id, title"),
    supabase.from("orders").select("items").order("created_at", { ascending: false }).limit(50)
  ]);

  const titleById = new Map<string, string>(
    ((bookLookup ?? []) as Array<{ id: string; title: string }>).map((book) => [book.id, book.title])
  );
  const aggregated = new Map<string, number>();

  for (const order of (recentOrders ?? []) as Array<{ items: OrderRow["items"] }>) {
    for (const item of order.items ?? []) {
      const title = titleById.get(item.book_id);
      if (!title) continue;
      aggregated.set(title, (aggregated.get(title) ?? 0) + item.quantity);
    }
  }

  const mostRequestedTitles = Array.from(aggregated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, count }));

  return {
    totalBooks: totalBooks ?? 0,
    totalOrdersPending: totalOrdersPending ?? 0,
    totalUsers: totalUsers ?? 0,
    mostRequestedTitles
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
