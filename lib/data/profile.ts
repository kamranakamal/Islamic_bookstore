import { getServerSupabaseClient } from "@/lib/authHelpers";
import { getBookSummariesByIds } from "@/lib/data/books";
import { toUserAddress } from "@/lib/data/transformers";
import type { OrderRow, UserAddress, UserAddressRow, UserOrder } from "@/lib/types";

export async function getUserAddresses(profileId: string): Promise<UserAddress[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load user addresses", error);
    return [];
  }

  return (data ?? []).map((row) => toUserAddress(row as UserAddressRow));
}

export async function getUserOrders(profileId: string): Promise<UserOrder[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, items, created_at, notes, shipping_address")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load user orders", error);
    return [];
  }

  const rows = (data ?? []) as Array<
    Pick<OrderRow, "id" | "status" | "items" | "created_at" | "notes" | "shipping_address">
  >;

  const bookIds = new Set<string>();
  for (const order of rows) {
    for (const item of order.items ?? []) {
      if (item?.book_id) {
        bookIds.add(item.book_id);
      }
    }
  }

  const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
  const bookSummaries = await getBookSummariesByIds(Array.from(bookIds));

  return rows.map((order) => {
    const orderItems = Array.isArray(order.items) ? order.items : [];
    let estimatedTotal = 0;
    let hasUnavailableItems = false;

    const items = orderItems.map((item) => {
      const summary = bookSummaries[item.book_id];

      if (!summary) {
        hasUnavailableItems = true;
        return {
          bookId: item.book_id,
          quantity: item.quantity,
          title: "Book no longer available",
          author: null,
          coverUrl: "/logo.svg",
          unitPrice: null,
          unitPriceFormatted: null,
          lineTotalFormatted: null,
          isUnavailable: true
        };
      }

      const lineTotal = summary.priceLocalInr * item.quantity;
      estimatedTotal += lineTotal;

      return {
        bookId: summary.id,
        quantity: item.quantity,
        title: summary.title,
        author: summary.author,
        coverUrl: summary.coverUrl,
        unitPrice: summary.priceLocalInr,
        unitPriceFormatted: summary.priceFormattedLocal,
        lineTotalFormatted: currencyFormatter.format(lineTotal),
        isUnavailable: false
      };
    });

    const estimatedTotalFormatted = estimatedTotal > 0 ? currencyFormatter.format(estimatedTotal) : null;

    return {
      id: order.id,
      status: order.status,
      createdAt: order.created_at,
      items,
      estimatedTotal: estimatedTotal > 0 ? estimatedTotal : null,
      estimatedTotalFormatted,
      shippingAddress: (order.shipping_address ?? null) || null,
      notes: order.notes ?? null,
      hasUnavailableItems
    } satisfies UserOrder;
  });
}
