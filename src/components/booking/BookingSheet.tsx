import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Calendar, Clock, Users, Wallet, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Listing } from "@/data/listings";
import { createCustomerBooking } from "@/lib/marketplace-api";

type PaymentMode = "full" | "split";

export function BookingSheet({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const today = new Date();
  const [date, setDate] = useState(today.toISOString().slice(0, 10));
  const [hours, setHours] = useState(2);
  const [guests, setGuests] = useState(2);
  const [payment, setPayment] = useState<PaymentMode>("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHourly = listing.bookingType === "hourly";
  const isTicket = listing.bookingType === "ticket";
  const isDaily = listing.bookingType === "daily";

  const subtotal = useMemo(() => {
    if (isHourly) return listing.price * hours;
    if (isTicket) return listing.price * guests;
    if (isDaily) return listing.price;
    return listing.price;
  }, [isHourly, isTicket, isDaily, listing.price, hours, guests]);

  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;
  const splitAmount = Math.ceil(total / Math.max(guests, 1));

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const booking = await createCustomerBooking({ listing, date, hours, guests, total });
      navigate({
        to: "/payment/$bookingId",
        params: { bookingId: booking.id },
        search: {
          listing: listing.id,
          total,
          date,
          guests,
          hours,
          payment,
          otp: booking.otp,
        } as never,
      });
    } catch (e: any) {
      setError(e.message ?? "Could not create booking. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full max-w-[520px] rounded-t-3xl bg-background p-5 shadow-[var(--shadow-elevated)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Confirm booking</h2>
            <p className="text-xs text-muted-foreground">{listing.title}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field icon={<Calendar className="h-4 w-4" />} label="Date">
            <input
              type="date"
              value={date}
              min={today.toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none"
            />
          </Field>

          {isHourly && (
            <Field icon={<Clock className="h-4 w-4" />} label="Duration">
              <Stepper value={hours} setValue={setHours} min={1} max={12} suffix="hr" />
            </Field>
          )}

          {(isTicket || isDaily || isHourly) && (
            <Field icon={<Users className="h-4 w-4" />} label={isTicket ? "Tickets" : "Guests"}>
              <Stepper value={guests} setValue={setGuests} min={1} max={20} />
            </Field>
          )}

          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Wallet className="h-4 w-4" /> Payment
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["full", "split"] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPayment(mode)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    payment === mode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  {mode === "full" ? "Pay in full" : `Split (${guests} ways)`}
                </button>
              ))}
            </div>
            {payment === "split" && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Each guest pays ₹{splitAmount.toLocaleString("en-IN")} via shared link.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-muted/60 p-3 text-sm">
            <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
            <Row label="Taxes & fees" value={`₹${taxes.toLocaleString("en-IN")}`} />
            <div className="my-2 h-px bg-border" />
            <Row
              label={<span className="font-semibold">Total</span>}
              value={
                <span className="font-semibold text-primary">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              }
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            onClick={handleConfirm}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {listing.instantBook ? "Pay & confirm" : "Request to book"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Powered by Razorpay / QR & OTP issued on confirmation
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stepper({
  value,
  setValue,
  min,
  max,
  suffix,
}: {
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setValue(Math.max(min, value - 1))}
        className="grid h-7 w-7 place-items-center rounded-full border border-border text-sm"
      >
        -
      </button>
      <span className="w-12 text-center text-sm font-semibold">
        {value}
        {suffix ? ` ${suffix}` : ""}
      </span>
      <button
        onClick={() => setValue(Math.min(max, value + 1))}
        className="grid h-7 w-7 place-items-center rounded-full border border-border text-sm"
      >
        +
      </button>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
