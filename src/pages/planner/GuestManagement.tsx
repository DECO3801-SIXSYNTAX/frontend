import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { GuestItem, DietaryTag } from "@/types";
import { api } from "@/lib/api";

export default function GuestManagement() {
  const { slug } = useParams<{ slug: string }>();
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (!slug) return;
    let active = true;
    setLoading(true);
    api
      .listEventGuests(slug)
      .then((data) => {
        if (!active) return;
        // Transform payload to match component expectations
        const transformedData = (data as any[]).map((guest: any) => ({
          id: String(guest.id),
          name: guest.name,
          email: guest.email,
          group: guest.group || undefined,
          dietary: Array.isArray(guest.dietary) ? guest.dietary : (guest.dietary ? [guest.dietary] : []),
          access: Array.isArray(guest.access) ? guest.access : (guest.access ? [guest.access] : []),
          rsvp: guest.rsvp || "Pending",
          seat: guest.seat || undefined,
          checkedIn: Boolean(guest.checked_in),
          // Optional fields not provided by API are left undefined (e.g., phone, tags)
        }));
        setGuests(transformedData as GuestItem[]);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(String(e));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  const filtered = useMemo(() => {
    if (!query.trim()) return guests;
    const q = query.toLowerCase();
    return guests.filter((g) =>
      [g.name, g.email, g.phone ?? "", g.seat ?? "", g.group ?? ""].some((v) => v?.toLowerCase().includes(q))
    );
  }, [guests, query]);

  const toggle = (gid: string) => {
    const next = new Set(expanded);
    next.has(gid) ? next.delete(gid) : next.add(gid);
    setExpanded(next);
  };

  const expandAll = () => setExpanded(new Set(filtered.map((g) => g.id)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Guest Management</h1>
          <p className="text-sm text-slate-600">Quickly find and focus on what matters. Expand a guest to see full details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Expand all</button>
          <button onClick={collapseAll} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Collapse all</button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Guests: <span className="font-medium text-slate-900">{filtered.length}</span></div>
        <div className="relative w-72">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, seat, or group"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-sm text-slate-500">Loading…</div>}
      {!loading && filtered.length === 0 && <div className="text-sm text-slate-500">No guests match your search.</div>}

      <ul className="space-y-3">
        {filtered.map((g) => (
          <li key={g.id} className="rounded-lg border border-slate-200 bg-white p-4">
            {/* Row – minimal info */}
            <button onClick={() => toggle(g.id)} className="flex w-full items-start justify-between gap-4 text-left">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-slate-900">{g.name}</span>
                  {g.seat && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Seat {g.seat}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {(g.dietary ?? []).slice(0, 3).map((t) => (
                    <DietaryChip key={t} tag={t} />
                  ))}
                  {(g.dietary?.length ?? 0) > 3 && (
                    <span className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500">+{(g.dietary!.length - 3)} more</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RsvpDot status={g.rsvp} />
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${expanded.has(g.id) ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Details – progressive disclosure */}
            {expanded.has(g.id) && (
              <div className="mt-4 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
                <Field label="Email">{g.email}</Field>
                <Field label="Phone">{g.phone ?? "–"}</Field>
                <Field label="Group">{g.group ?? "–"}</Field>
                <Field label="RSVP Status">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{g.rsvp}</span>
                </Field>
                <Field label="Checked In">{g.checkedIn ? "Yes" : "No"}</Field>
                <Field label="Seat">{g.seat ?? "–"}</Field>
                
                {(g.tags && g.tags.length > 0) && (
                  <div className="sm:col-span-2">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {g.tags.map((t: string) => (
                        <span key={t} className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Dietary Restrictions</div>
                  <div className="flex flex-wrap gap-1">
                    {(g.dietary ?? []).length === 0 ? (
                      <span className="text-sm text-slate-500">None</span>
                    ) : (
                      (g.dietary ?? []).map((t) => <DietaryChip key={t} tag={t} />)
                    )}
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Accessibility Needs</div>
                  <div className="flex flex-wrap gap-1">
                    {(g.access ?? []).length === 0 ? (
                      <span className="text-sm text-slate-500">None</span>
                    ) : (
                      (g.access ?? []).map((t) => (
                        <span key={t} className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">{t}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-600">{label}</div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}

function RsvpDot({ status }: { status: "Pending" | "Accepted" | "Declined" }) {
  const color = status === "Accepted" ? "bg-green-500" : status === "Declined" ? "bg-red-500" : "bg-amber-500";
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} title={`RSVP: ${status}`} />
  );
}

function DietaryChip({ tag }: { tag: DietaryTag }) {
  const cls = dietaryClass(tag);
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{tag}</span>;
}

function dietaryClass(tag: DietaryTag) {
  switch (tag) {
    case "Vegetarian":
      return "bg-green-100 text-green-700";
    case "Vegan":
      return "bg-emerald-100 text-emerald-700";
    case "Halal":
      return "bg-blue-100 text-blue-700";
    case "Kosher":
      return "bg-indigo-100 text-indigo-700";
    case "Gluten-free":
      return "bg-amber-100 text-amber-700";
    case "Nut allergy":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}