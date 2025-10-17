import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { toAdminBook } from "@/lib/data/transformers";
import type {
  AdminAnalyticsSnapshot,
  AdminBook,
  AdminBooksData,
  AdminOrder,
  AdminUserSummary,
  BookRowWithCategory,
  CategorySummary,
  OrderRow,
  ProfileRow
} from "@/lib/types";

export async function getAdminBooksData(): Promise<AdminBooksData> {
  const supabase = getSupabaseAdmin();
  const [booksResponse, categoriesResponse] = await Promise.all([
    supabase
      .from("books")
      .select("*, categories(name)")
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("id, slug, name, description").order("name", { ascending: true })
  ]);

  const bookRows = (booksResponse.data ?? []) as BookRowWithCategory[];

  return {
    books: bookRows.map((row) => toAdminBook(row)),
    categories: (categoriesResponse.data ?? []) as CategorySummary[]
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
