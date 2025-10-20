import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { SavedAddressesManager } from "@/components/site/addresses/SavedAddressesManager";
import { getSessionUser } from "@/lib/authHelpers";
import { getUserAddresses } from "@/lib/data/profile";

export const dynamic = "force-dynamic";

const QUERY_KEY = ["profile-addresses"] as const;

export default async function AccountAddressesPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect(`/login?redirect=${encodeURIComponent("/account/addresses")}`);
  }

  const addresses = await getUserAddresses(sessionUser.id);
  const queryClient = new QueryClient();
  queryClient.setQueryData(QUERY_KEY, { addresses, isAuthenticated: true as const });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto max-w-3xl space-y-6">
        <SavedAddressesManager initialAddresses={addresses} sessionUser={sessionUser} />
      </div>
    </HydrationBoundary>
  );
}
