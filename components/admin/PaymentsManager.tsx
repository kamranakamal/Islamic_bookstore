import type { AdminCheckoutPreference } from "@/lib/types";

interface PaymentsManagerProps {
  preferences: AdminCheckoutPreference[];
}

function formatStatus(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PaymentsManager({ preferences }: PaymentsManagerProps) {
  const sorted = preferences
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!sorted.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Checkout payment details</h2>
        <p className="mt-2 text-sm text-gray-500">No checkout preferences have been submitted yet.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Checkout payment details</h2>
          <p className="text-sm text-gray-600">Review recent checkout submissions and confirm next steps with each customer.</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Payment method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Delivery window</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div>
                    <p>{entry.profileName ?? "Member"}</p>
                    <p className="text-xs text-gray-500">Profile ID: {entry.profileId}</p>
                    <p className="text-xs text-gray-500">Account email: {entry.profileEmail}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{entry.billingName ?? "—"}</p>
                    <a
                      href={`mailto:${entry.billingEmail ?? entry.profileEmail}`}
                      className="block text-primary hover:underline"
                    >
                      {entry.billingEmail ?? entry.profileEmail}
                    </a>
                    <p className="text-xs text-gray-500">{entry.billingPhone ?? "No phone provided"}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="space-y-1">
                    <span className="block font-semibold text-gray-900">{formatStatus(entry.paymentMethod)}</span>
                    {entry.paymentIdentifier ? (
                      <span className="block text-xs text-gray-500">ID: {entry.paymentIdentifier}</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{entry.deliveryWindow ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="space-y-1">
                    <span>{entry.referenceCode ?? "—"}</span>
                    {entry.notes ? <p className="text-xs text-gray-500">{entry.notes}</p> : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(entry.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {formatStatus(entry.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
