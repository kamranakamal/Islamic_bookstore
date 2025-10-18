import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { MessagesManager } from "@/components/admin/MessagesManager";
import { getAdminMessages } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-messages"], messages);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Manage messages</h1>
        <p className="text-sm text-gray-600">Track new inquiries and coordinate responses with the team.</p>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MessagesManager messages={messages} />
      </HydrationBoundary>
    </div>
  );
}
