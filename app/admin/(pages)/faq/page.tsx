import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { FaqManager } from "@/components/admin/FaqManager";
import { getAdminFaqEntries } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const entries = await getAdminFaqEntries();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-faq"], entries);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Manage FAQs</h1>
        <p className="text-sm text-gray-600">Curate the support page by adding, reordering, and publishing answers.</p>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FaqManager entries={entries} />
      </HydrationBoundary>
    </div>
  );
}
