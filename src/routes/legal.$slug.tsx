import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, FileCheck2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

const docs: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "Spacio collects account, booking, payment, location, notification and device safety data only to operate the marketplace.",
      "Camera access is used for QR scanning. Location access is used for nearby discovery, directions and distance calculations.",
      "Payment information is processed through secure payment providers such as Razorpay and is not stored as raw card data.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "Users must provide accurate booking and account information and follow host rules for each space or experience.",
      "Hosts are responsible for lawful listings, clear pricing, accurate availability, safety standards and entry verification.",
      "Admins may moderate content, suspend listings, ban accounts, resolve disputes and apply commission rules.",
    ],
  },
  refunds: {
    title: "Refund Policy",
    body: [
      "Refund eligibility depends on booking type, host policy, cancellation timing, payment status and dispute review.",
      "Approved refunds are processed to the original payment method, with transaction logs retained for audit and compliance.",
      "Platform commissions, host payouts and reversals are calculated from the final payable booking amount.",
    ],
  },
  community: {
    title: "Community Guidelines",
    body: [
      "Reviews must be based on verified bookings and may include public feedback plus private notes for hosts and admins.",
      "Fraudulent QR usage, repeated OTP attempts, unsafe behavior, harassment and fake listings can lead to restrictions.",
      "Support is available at supportspacio@gmail.com for safety, refunds, reports and account help.",
    ],
  },
};

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${docs[params.slug]?.title ?? "Legal"} - Spacio` }] }),
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useParams();
  const doc = docs[slug] ?? docs.privacy;

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ChevronLeft className="h-4 w-4" />
          Profile
        </Link>
        <section className="glass-panel-strong mt-5 rounded-3xl p-5 md:p-7">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileCheck2 className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold">{doc.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Spacio by GLN marketplace policy summary. Full legal copy can be expanded before launch.
          </p>
          <div className="mt-6 space-y-3">
            {doc.body.map((paragraph) => (
              <p key={paragraph} className="rounded-2xl bg-background/55 p-4 text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          <a
            href="mailto:supportspacio@gmail.com"
            className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            supportspacio@gmail.com
          </a>
        </section>
      </main>
    </AppShell>
  );
}
