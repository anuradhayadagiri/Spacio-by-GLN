import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee,
  Check,
  ChevronLeft,
  CloudUpload,
  Film,
  ImagePlus,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HostShell } from "@/components/host/HostShell";
import { HOST_PLANS, type HostPlanId } from "@/data/platform";
import { createListing } from "@/lib/host.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MapLibreLocation } from "@/components/maps/MapLibreLocation";

export const Route = createFileRoute("/host/new")({
  head: () => ({ meta: [{ title: "Create host listing - Spacio" }] }),
  component: NewListingPage,
});

type SpaceType = {
  id: string;
  label: string;
  category: string;
  unit: "hour" | "day" | "ticket" | "package" | "person";
  icon: string;
};

type MediaItem = {
  id: string;
  type: "photo" | "video";
  name: string;
  preview: string;
  publicUrl?: string;
  progress: number;
  error?: string;
};

const STEPS = ["Type", "Media", "Details", "Location", "Plan"] as const;

const SPACE_TYPES: SpaceType[] = [
  { id: "stay", label: "Stay", category: "stays", unit: "day", icon: "S" },
  { id: "dining", label: "Dining", category: "dining", unit: "package", icon: "D" },
  { id: "workspace", label: "Workspace", category: "pro-spaces", unit: "hour", icon: "W" },
  { id: "event", label: "Event Space", category: "party", unit: "hour", icon: "E" },
  { id: "sports", label: "Sports Venue", category: "play", unit: "hour", icon: "P" },
  { id: "studio", label: "Studio", category: "pro-spaces", unit: "hour", icon: "St" },
  { id: "experience", label: "Experience", category: "experiences", unit: "ticket", icon: "X" },
  { id: "travel", label: "Travel Package", category: "experiences", unit: "package", icon: "T" },
];

const defaultLat = 12.9716;
const defaultLng = 77.5946;

function NewListingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { session } = useAuth();
  const createFn = useServerFn(createListing);
  const [step, setStep] = useState(0);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "" as string,
    title: "",
    description: "",
    amenities: "",
    rules: "",
    capacity: 2,
    price: 500,
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: defaultLat,
    longitude: defaultLng,
    plan: "standard" as HostPlanId,
    instantBook: true,
  });

  const selectedType = SPACE_TYPES.find((type) => type.id === form.type);
  const selectedPlan = HOST_PLANS.find((plan) => plan.id === form.plan) ?? HOST_PLANS[1];
  const commissionAmount = Math.round((form.price * selectedPlan.commission) / 100);
  const hostPayout = Math.max(0, form.price - commissionAmount);
  const mapPosition = useMemo(
    () => ({
      latitude: Number(form.latitude) || defaultLat,
      longitude: Number(form.longitude) || defaultLng,
    }),
    [form.latitude, form.longitude],
  );

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const list = Array.from(files).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (!list.length) return;
    if (!session?.access_token) {
      setUploadError("Sign in and activate Host mode before uploading media.");
      return;
    }

    for (const file of list) {
      const id = crypto.randomUUID();
      const item: MediaItem = {
        id,
        type: file.type.startsWith("video/") ? "video" : "photo",
        name: file.name,
        preview: URL.createObjectURL(file),
        progress: 18,
      };
      setMedia((items) => [...items, item]);

      try {
        setMedia((items) => items.map((m) => (m.id === id ? { ...m, progress: 42 } : m)));
        const extension = file.name.split(".").pop() ?? "bin";
        const path = `${session.user.id}/${Date.now()}-${id}.${extension}`;
        const { error } = await supabase.storage.from("listing-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("listing-media").getPublicUrl(path);
        setMedia((items) =>
          items.map((m) =>
            m.id === id ? { ...m, publicUrl: data.publicUrl, progress: 100 } : m,
          ),
        );
      } catch (error: any) {
        setMedia((items) =>
          items.map((m) =>
            m.id === id ? { ...m, progress: 100, error: error.message ?? "Upload failed" } : m,
          ),
        );
        setUploadError(error.message ?? "Upload failed. Check the Supabase Storage bucket.");
      }
    }
  };

  const publish = useMutation({
    mutationFn: () => {
      if (!selectedType) throw new Error("Select a space type.");
      return createFn({
        data: {
          accessToken: session?.access_token,
          title: form.title.trim(),
          category: selectedType.category,
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          amenities: splitLines(form.amenities),
          rules: splitLines(form.rules),
          capacity: Number(form.capacity) || 1,
          price: Number(form.price) || 0,
          price_unit: selectedType.unit,
          instant_book: form.instantBook,
          media_urls: media.filter((m) => m.type === "photo" && m.publicUrl).map((m) => m.publicUrl!),
          video_urls: media.filter((m) => m.type === "video" && m.publicUrl).map((m) => m.publicUrl!),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          approximate_area: `${form.city || "Area"}, ${form.state || "India"}`,
          plan: form.plan,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["host", "listings", session?.user.id] });
      router.navigate({ to: "/host/listings" });
    },
  });

  const canContinue =
    (step === 0 && form.type) ||
    (step === 1 && media.some((m) => m.publicUrl && m.type === "photo")) ||
    (step === 2 && form.title.trim() && form.description.trim() && form.price > 0) ||
    (step === 3 && form.address.trim() && form.city.trim() && form.state.trim() && form.pincode.trim()) ||
    step === 4;

  return (
    <HostShell title={`Create listing · ${STEPS[step]}`}>
      <div className="px-5 pb-32 pt-4">
        <div className="mb-5">
          <div className="flex gap-1.5">
            {STEPS.map((label, index) => (
              <div key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={false}
                  animate={{ width: index <= step ? "100%" : "0%" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {step === 0 && (
            <>
              <Heading title="Select space type" sub="This controls discovery, booking style, and guest expectations." />
              <div className="grid grid-cols-2 gap-3">
                {SPACE_TYPES.map((type) => {
                  const active = form.type === type.id;
                  return (
                    <motion.button
                      key={type.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => update("type", type.id)}
                      className={`glass-panel min-h-28 rounded-3xl p-4 text-left transition ${
                        active ? "ring-2 ring-primary shadow-[0_0_24px_rgba(30,64,175,0.22)]" : ""
                      }`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                        {type.icon}
                      </span>
                      <p className="mt-3 text-sm font-semibold">{type.label}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Book by {type.unit}</p>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Heading title="Upload photos and videos" sub="Add multiple files. Photos become the listing gallery, videos help hosts convert better." />
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  setDragging(false);
                  uploadFiles(event.dataTransfer.files);
                }}
                className={`glass-panel grid min-h-40 cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-5 text-center transition ${
                  dragging ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <CloudUpload className="h-9 w-9 text-primary" />
                <p className="mt-3 text-sm font-semibold">Drag media here</p>
                <p className="mt-1 text-xs text-muted-foreground">or tap to select photos and videos</p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => event.target.files && uploadFiles(event.target.files)}
                />
              </div>
              {uploadError && <Alert tone="danger">{uploadError}</Alert>}
              <div className="grid grid-cols-2 gap-3">
                {media.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="relative aspect-video bg-muted">
                      {item.type === "photo" ? (
                        <img src={item.preview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <video src={item.preview} className="h-full w-full object-cover" muted />
                      )}
                      <button
                        onClick={() => setMedia((items) => items.filter((m) => m.id !== item.id))}
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/85"
                        aria-label="Remove media"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/85 text-primary">
                        {item.type === "photo" ? <ImagePlus className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-1 text-[11px] font-medium">{item.name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${item.error ? "bg-destructive" : "bg-success"}`} style={{ width: `${item.progress}%` }} />
                      </div>
                      {item.error && <p className="mt-1 text-[10px] text-destructive">{item.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Heading title="Describe the space" sub="Guests should understand what is included before they pay." />
              <Field label="Title">
                <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="The Glasshouse Studio" className="w-full bg-transparent text-sm outline-none" />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="What makes this place special?" className="w-full resize-none bg-transparent text-sm outline-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <input type="number" min={1} value={form.capacity} onChange={(e) => update("capacity", Number(e.target.value))} className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </Field>
                <Field label={`Price / ${selectedType?.unit ?? "unit"}`}>
                  <div className="flex items-center gap-2">
                    <BadgeIndianRupee className="h-4 w-4 text-muted-foreground" />
                    <input type="number" min={1} value={form.price} onChange={(e) => update("price", Number(e.target.value))} className="w-full bg-transparent text-sm font-semibold outline-none" />
                  </div>
                </Field>
              </div>
              <Field label="Amenities">
                <textarea value={form.amenities} onChange={(e) => update("amenities", e.target.value)} rows={3} placeholder="Wi-Fi, AC, Parking, Projector" className="w-full resize-none bg-transparent text-sm outline-none" />
              </Field>
              <Field label="Rules">
                <textarea value={form.rules} onChange={(e) => update("rules", e.target.value)} rows={3} placeholder="No smoking, valid ID required" className="w-full resize-none bg-transparent text-sm outline-none" />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Heading title="Add exact location" sub="Guests see only approximate area before payment. Exact map and navigation unlock after paid booking validation." />
              <Field label="Full address">
                <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Building, street, landmark" className="w-full bg-transparent text-sm outline-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                </Field>
                <Field label="State">
                  <input value={form.state} onChange={(e) => update("state", e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                </Field>
              </div>
              <Field label="Pincode">
                <input inputMode="numeric" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} className="w-full bg-transparent text-sm outline-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input type="number" value={form.latitude} onChange={(e) => update("latitude", Number(e.target.value))} className="w-full bg-transparent text-sm outline-none" />
                </Field>
                <Field label="Longitude">
                  <input type="number" value={form.longitude} onChange={(e) => update("longitude", Number(e.target.value))} className="w-full bg-transparent text-sm outline-none" />
                </Field>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <MapLibreLocation
                  latitude={mapPosition.latitude}
                  longitude={mapPosition.longitude}
                  label={form.title || "New Spacio listing"}
                  interactive
                />
                <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Exact coordinates stay locked for users until payment succeeds.
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <Heading title="Select commission plan" sub="Only hosts can see commissions, earnings previews, and revenue analytics." />
              <div className="space-y-3">
                {HOST_PLANS.map((plan) => {
                  const active = form.plan === plan.id;
                  const fee = Math.round((form.price * plan.commission) / 100);
                  return (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => update("plan", plan.id)}
                      className={`glass-panel w-full rounded-3xl bg-gradient-to-br ${plan.accent} p-4 text-left transition ${
                        active ? "ring-2 ring-primary shadow-[0_0_30px_rgba(16,185,129,0.22)]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-semibold">{plan.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{plan.visibility}</p>
                        </div>
                        <span className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          {plan.badge}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <MiniStat label="Commission" value={`${plan.commission}%`} />
                        <MiniStat label="Admin" value={`Rs.${fee}`} />
                        <MiniStat label="Host gets" value={`Rs.${Math.max(0, form.price - fee)}`} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="rounded-3xl border border-success/30 bg-success/10 p-4 text-sm">
                <p className="font-semibold text-success">Launch preview</p>
                <p className="mt-1 text-muted-foreground">
                  Customer pays Rs.{form.price.toLocaleString("en-IN")}. Spacio deducts Rs.{commissionAmount.toLocaleString("en-IN")} and host payout is Rs.{hostPayout.toLocaleString("en-IN")}.
                </p>
              </div>
              {publish.error && <Alert tone="danger">{(publish.error as Error).message}</Alert>}
            </>
          )}
        </motion.div>
      </div>

      <div
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/90 px-5 py-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <div className="flex gap-2">
          <button
            onClick={() => (step === 0 ? router.history.back() : setStep((s) => s - 1))}
            className="inline-flex h-12 items-center justify-center gap-1 rounded-2xl border border-border bg-card px-4 text-sm font-semibold"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button
            disabled={!canContinue || publish.isPending}
            onClick={() => (step === STEPS.length - 1 ? publish.mutate() : setStep((s) => s + 1))}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] disabled:opacity-50"
          >
            {step === STEPS.length - 1 ? (
              publish.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Publishing
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Publish listing
                </>
              )
            ) : (
              <>
                Continue <Sparkles className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </HostShell>
  );
}

function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block rounded-2xl border border-border bg-card/80 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/70 p-2">
      <p className="text-xs font-semibold">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Alert({ children, tone }: { children: ReactNode; tone: "danger" }) {
  return (
    <p className={tone === "danger" ? "rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive" : ""}>
      {children}
    </p>
  );
}
