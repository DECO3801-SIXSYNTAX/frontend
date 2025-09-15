import React, { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

type Tab =
  | "Overview"
  | "Basics"
  | "Venue & Rooms"
  | "Layout & Seating"
  | "Groups & Tags"
  | "Vendors & Roles"
  | "Check-in & Kiosk"
  | "Communications"
  | "Accessibility & Privacy"
  | "Integrations"
  | "Publish";

type EventStatus = "Draft" | "Planning" | "Live" | "Archived";

type VendorType = "Catering" | "AV" | "Logistics" | "Other";

interface Room {
  id: string;
  name: string;
  capacity?: number;
}
interface Vendor {
  id: string;
  type: VendorType;
  name: string;
  contact?: string;
}
interface EventSettings {
  id: string;
  name: string;
  status: EventStatus;
  timezone: string;
  startsAt: string; // ISO datetime-local
  endsAt: string;   // ISO datetime-local
  description?: string;
  venue: {
    name: string;
    address?: string;
    mapUrl?: string;
    capacity?: number;
    rooms: Room[];
  };
  seatingRules: {
    tableSizeDefault?: number;
    maxPerTable?: number;
    keepGroupsTogether: boolean;
    separateDietary: boolean;
    aisleWidth?: number;
    layoutTemplateId?: string;
  };
  groups: string[];
  tags: { dietary: string[]; access: string[] };
  vendors: Vendor[];
  roles: { plannerUids: string[]; vendorUids: string[] }; // front-end placeholders
  checkin: { enabled: boolean; qrPrefix?: string; kioskPin?: string; opensAt?: string; closesAt?: string; offlineHint?: string };
  comms: { rsvpTemplate?: string; reminderTemplate?: string; dayOfSmsTemplate?: string };
  accessibility: { statement?: string; evacuationNote?: string };
  privacy: { consentText?: string; retentionDays?: number };
  exports: { catererPreset?: string; seatingPreset?: string };
  integrations?: { sheetSync?: { enabled: boolean; sheetId?: string } };
  createdAt: string;
  updatedAt: string;
}

const defaultSettings = (): EventSettings => ({
  id: "tech-2024",
  name: "Tech Conference 2024",
  status: "Planning",
  timezone: "Australia/Brisbane",
  startsAt: "2025-03-15T09:00",
  endsAt: "2025-03-15T18:00",
  description: "Annual technology conference.",
  venue: {
    name: "Brisbane Convention & Exhibition Centre",
    address: "Merivale St, South Brisbane QLD",
    mapUrl: "",
    capacity: 2500,
    rooms: [
      { id: crypto.randomUUID(), name: "Expo Hall A", capacity: 1200 },
      { id: crypto.randomUUID(), name: "Ballroom 1", capacity: 600 },
    ],
  },
  seatingRules: {
    tableSizeDefault: 10,
    maxPerTable: 12,
    keepGroupsTogether: true,
    separateDietary: true,
    aisleWidth: 180,
    layoutTemplateId: "",
  },
  groups: ["VIP", "Speakers", "Company A", "Company B"],
  tags: {
    dietary: ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "Nut allergy"],
    access: ["Wheelchair", "Low-vision", "Hearing"],
  },
  vendors: [
    { id: crypto.randomUUID(), type: "Catering", name: "Catering Co.", contact: "catering@example.com" },
  ],
  roles: { plannerUids: [], vendorUids: [] },
  checkin: { enabled: false, qrPrefix: "TC24", kioskPin: "", opensAt: "", closesAt: "", offlineHint: "" },
  comms: { rsvpTemplate: "default-rsvp", reminderTemplate: "reminder-1w", dayOfSmsTemplate: "day-of-basic" },
  accessibility: { statement: "", evacuationNote: "" },
  privacy: { consentText: "", retentionDays: 90 },
  exports: { catererPreset: "dietary_breakdown_v1", seatingPreset: "table_assignments_v1" },
  integrations: { sheetSync: { enabled: false, sheetId: "" } },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function EventSettingsPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [s, setS] = useState<EventSettings>(defaultSettings());
  const [showPublish, setShowPublish] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const issues = useValidation(s);

  const save = () => {
    setS((prev) => ({ ...prev, updatedAt: new Date().toISOString() }));
    flash("Saved");
  };
  const publish = () => {
    if (issues.length) { setShowPublish(true); return; }
    setS((prev) => ({ ...prev, status: "Live", updatedAt: new Date().toISOString() }));
    setShowPublish(false);
    flash("Published");
  };
  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Planner • Event Settings</div>
          <h1 className="text-2xl font-semibold">{s.name}</h1>
          <div className="text-sm text-slate-500">{s.timezone} • {fmtRange(s.startsAt, s.endsAt)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={save}>Save</Button>
          <Button onClick={() => setShowPublish(true)}>{s.status === "Live" ? "Update" : "Publish"}</Button>
        </div>
      </div>

      {/* Tabs */}
      <TabBar current={tab} onChange={setTab} />

      {/* Content */}
      <div className="rounded-2xl bg-white p-5 shadow">
        {tab === "Overview" && <Overview s={s} />}
        {tab === "Basics" && <Basics s={s} onChange={setS} />}
        {tab === "Venue & Rooms" && <VenueRooms s={s} onChange={setS} />}
        {tab === "Layout & Seating" && <LayoutSeating s={s} onChange={setS} />}
        {tab === "Groups & Tags" && <GroupsTags s={s} onChange={setS} />}
        {tab === "Vendors & Roles" && <VendorsRoles s={s} onChange={setS} />}
        {tab === "Check-in & Kiosk" && <CheckinKiosk s={s} onChange={setS} />}
        {tab === "Communications" && <Communications s={s} onChange={setS} />}
        {tab === "Accessibility & Privacy" && <AccessPrivacy s={s} onChange={setS} />}
        {tab === "Integrations" && <Integrations s={s} onChange={setS} />}
        {tab === "Publish" && <PublishSummary s={s} issues={issues} onPublish={publish} />}
      </div>

      {/* Publish modal (validation checklist) */}
      <Modal open={showPublish} title="Publish checklist" onClose={() => setShowPublish(false)}>
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="rounded-lg bg-green-50 p-3 text-green-700">
              All checks passed. Ready to publish!
            </div>
          ) : (
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {issues.map((it) => <li key={it}>{it}</li>)}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button onClick={publish} disabled={issues.length > 0}>Publish</Button>
          </div>
        </div>
      </Modal>

      {/* Tiny toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow">
          {toast}
        </div>
      )}
    </div>
  );
}

/* -------------------------- Sections -------------------------- */

function Overview({ s }: { s: EventSettings }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Status">
        <div className="text-lg font-semibold">{s.status}</div>
        <div className="text-sm text-slate-500">Created {new Date(s.createdAt).toLocaleString()}</div>
      </Card>
      <Card title="Venue">
        <div className="font-medium">{s.venue.name || "—"}</div>
        <div className="text-sm text-slate-500">{s.venue.address || "—"}</div>
        <div className="text-sm">Capacity: {s.venue.capacity ?? "—"}</div>
        <div className="text-sm">Rooms: {s.venue.rooms.length}</div>
      </Card>
      <Card title="Seating rules">
        <div className="text-sm">Table size: {s.seatingRules.tableSizeDefault ?? "—"}</div>
        <div className="text-sm">Max / table: {s.seatingRules.maxPerTable ?? "—"}</div>
        <div className="text-sm">Keep groups: {s.seatingRules.keepGroupsTogether ? "Yes" : "No"}</div>
      </Card>
    </div>
  );
}

function Basics({ s, onChange }: { s: EventSettings; onChange: React.Dispatch<React.SetStateAction<EventSettings>> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Event name">
        <input className="input" value={s.name} onChange={(e) => onChange({ ...s, name: e.target.value })} />
      </Field>
      <Field label="Status">
        <select className="input" value={s.status} onChange={(e) => onChange({ ...s, status: e.target.value as EventStatus })}>
          {["Draft", "Planning", "Live", "Archived"].map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="Timezone">
        <select className="input" value={s.timezone} onChange={(e) => onChange({ ...s, timezone: e.target.value })}>
          <option>Australia/Brisbane</option>
          <option>UTC</option>
          <option>Australia/Sydney</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts at">
          <input type="datetime-local" className="input" value={s.startsAt} onChange={(e) => onChange({ ...s, startsAt: e.target.value })} />
        </Field>
        <Field label="Ends at">
          <input type="datetime-local" className="input" value={s.endsAt} onChange={(e) => onChange({ ...s, endsAt: e.target.value })} />
        </Field>
      </div>
      <Field label="Description" full>
        <textarea className="input min-h-[120px]" value={s.description ?? ""} onChange={(e) => onChange({ ...s, description: e.target.value })} />
      </Field>
    </div>
  );
}

function VenueRooms({ s, onChange }: Props) {
  const addRoom = () => onChange({
    ...s,
    venue: { ...s.venue, rooms: [...s.venue.rooms, { id: crypto.randomUUID(), name: `Room ${s.venue.rooms.length + 1}` }] },
  });
  const editRoom = (id: string, patch: Partial<Room>) =>
    onChange({ ...s, venue: { ...s.venue, rooms: s.venue.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) } });
  const removeRoom = (id: string) =>
    onChange({ ...s, venue: { ...s.venue, rooms: s.venue.rooms.filter((r) => r.id !== id) } });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Venue name">
          <input className="input" value={s.venue.name} onChange={(e) => onChange({ ...s, venue: { ...s.venue, name: e.target.value } })} />
        </Field>
        <Field label="Capacity">
          <input type="number" className="input" value={s.venue.capacity ?? ""} onChange={(e) => onChange({ ...s, venue: { ...s.venue, capacity: toNum(e.target.value) } })} />
        </Field>
        <Field label="Address">
          <input className="input" value={s.venue.address ?? ""} onChange={(e) => onChange({ ...s, venue: { ...s.venue, address: e.target.value } })} />
        </Field>
        <Field label="Map URL">
          <input className="input" value={s.venue.mapUrl ?? ""} onChange={(e) => onChange({ ...s, venue: { ...s.venue, mapUrl: e.target.value } })} />
        </Field>
      </div>

      <div>
        <div className="mb-2 font-semibold">Rooms</div>
        <div className="space-y-2">
          {s.venue.rooms.map((r) => (
            <div key={r.id} className="grid items-end gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-3">
              <Field label="Name"><input className="input" value={r.name} onChange={(e) => editRoom(r.id, { name: e.target.value })} /></Field>
              <Field label="Capacity"><input type="number" className="input" value={r.capacity ?? ""} onChange={(e) => editRoom(r.id, { capacity: toNum(e.target.value) })} /></Field>
              <div className="flex justify-end"><Button variant="secondary" onClick={() => removeRoom(r.id)}>Remove</Button></div>
            </div>
          ))}
        </div>
        <div className="mt-3"><Button onClick={addRoom}>Add room</Button></div>
      </div>
    </div>
  );
}

function LayoutSeating({ s, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Layout template ID">
        <input className="input" value={s.seatingRules.layoutTemplateId ?? ""} onChange={(e) => onChange({ ...s, seatingRules: { ...s.seatingRules, layoutTemplateId: e.target.value } })} />
      </Field>
      <Field label="Default table size">
        <input type="number" className="input" value={s.seatingRules.tableSizeDefault ?? ""} onChange={(e) => onChange({ ...s, seatingRules: { ...s.seatingRules, tableSizeDefault: toNum(e.target.value) } })} />
      </Field>
      <Field label="Max per table">
        <input type="number" className="input" value={s.seatingRules.maxPerTable ?? ""} onChange={(e) => onChange({ ...s, seatingRules: { ...s.seatingRules, maxPerTable: toNum(e.target.value) } })} />
      </Field>
      <Field label="Aisle width (cm)">
        <input type="number" className="input" value={s.seatingRules.aisleWidth ?? ""} onChange={(e) => onChange({ ...s, seatingRules: { ...s.seatingRules, aisleWidth: toNum(e.target.value) } })} />
      </Field>
      <Toggle
        label="Keep groups together"
        checked={s.seatingRules.keepGroupsTogether}
        onChange={(v) => onChange({ ...s, seatingRules: { ...s.seatingRules, keepGroupsTogether: v } })}
      />
      <Toggle
        label="Separate dietary needs by table where possible"
        checked={s.seatingRules.separateDietary}
        onChange={(v) => onChange({ ...s, seatingRules: { ...s.seatingRules, separateDietary: v } })}
      />
      <div className="md:col-span-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Changing seating rules won’t move guests automatically. Re-run auto-seating from the Seating page.
      </div>
    </div>
  );
}

function GroupsTags({ s, onChange }: Props) {
  const [groupInput, setGroupInput] = useState("");
  const add = () => {
    const v = groupInput.trim(); if (!v) return;
    if (!s.groups.includes(v)) onChange({ ...s, groups: [...s.groups, v] });
    setGroupInput("");
  };
  const remove = (g: string) => onChange({ ...s, groups: s.groups.filter((x) => x !== g) });

  const addTag = (kind: "dietary" | "access", v: string) => {
    v = v.trim(); if (!v) return;
    const tags = s.tags[kind];
    if (!tags.includes(v)) onChange({ ...s, tags: { ...s.tags, [kind]: [...tags, v] } });
  };
  const removeTag = (kind: "dietary" | "access", v: string) =>
    onChange({ ...s, tags: { ...s.tags, [kind]: s.tags[kind].filter((x) => x !== v) } });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Groups">
        <div className="mb-2 flex gap-2">
          <input className="input" placeholder="Add group…" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} />
          <Button onClick={add}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.groups.map((g) => (
            <Chip key={g} onRemove={() => remove(g)}>{g}</Chip>
          ))}
        </div>
      </Card>

      <Card title="Tags">
        <div className="mb-2 text-sm font-medium">Dietary</div>
        <TagEditor items={s.tags.dietary} onAdd={(v) => addTag("dietary", v)} onRemove={(v) => removeTag("dietary", v)} />
        <div className="mt-4 mb-2 text-sm font-medium">Accessibility</div>
        <TagEditor items={s.tags.access} onAdd={(v) => addTag("access", v)} onRemove={(v) => removeTag("access", v)} />
      </Card>
    </div>
  );
}

function VendorsRoles({ s, onChange }: Props) {
  const addVendor = () => onChange({
    ...s,
    vendors: [...s.vendors, { id: crypto.randomUUID(), type: "Other", name: "" }],
  });
  const patchVendor = (id: string, patch: Partial<Vendor>) =>
    onChange({ ...s, vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  const removeVendor = (id: string) => onChange({ ...s, vendors: s.vendors.filter((v) => v.id !== id) });

  return (
    <div className="grid gap-6">
      <Card title="Vendors">
        <div className="space-y-2">
          {s.vendors.map((v) => (
            <div key={v.id} className="grid items-end gap-2 md:grid-cols-3">
              <Field label="Type">
                <select className="input" value={v.type} onChange={(e) => patchVendor(v.id, { type: e.target.value as VendorType })}>
                  {["Catering", "AV", "Logistics", "Other"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Name"><input className="input" value={v.name} onChange={(e) => patchVendor(v.id, { name: e.target.value })} /></Field>
              <Field label="Contact"><input className="input" value={v.contact ?? ""} onChange={(e) => patchVendor(v.id, { contact: e.target.value })} /></Field>
              <div className="md:col-span-3 flex justify-end"><Button variant="secondary" onClick={() => removeVendor(v.id)}>Remove</Button></div>
            </div>
          ))}
          <Button onClick={addVendor}>Add vendor</Button>
        </div>
      </Card>

      <Card title="Roles (per event)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Planner user IDs (comma separated)">
            <input className="input" value={s.roles.plannerUids.join(", ")} onChange={(e) => onChange({ ...s, roles: { ...s.roles, plannerUids: splitCsv(e.target.value) } })} />
          </Field>
          <Field label="Vendor user IDs (comma separated)">
            <input className="input" value={s.roles.vendorUids.join(", ")} onChange={(e) => onChange({ ...s, roles: { ...s.roles, vendorUids: splitCsv(e.target.value) } })} />
          </Field>
        </div>
      </Card>
    </div>
  );
}

function CheckinKiosk({ s, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Toggle label="Enable check-in" checked={s.checkin.enabled} onChange={(v) => onChange({ ...s, checkin: { ...s.checkin, enabled: v } })} />
      <Field label="QR prefix">
        <input className="input" value={s.checkin.qrPrefix ?? ""} onChange={(e) => onChange({ ...s, checkin: { ...s.checkin, qrPrefix: e.target.value } })} />
      </Field>
      <Field label="Kiosk PIN">
        <input className="input" value={s.checkin.kioskPin ?? ""} onChange={(e) => onChange({ ...s, checkin: { ...s.checkin, kioskPin: e.target.value } })} />
      </Field>
      <Field label="Opens at">
        <input type="datetime-local" className="input" value={s.checkin.opensAt ?? ""} onChange={(e) => onChange({ ...s, checkin: { ...s.checkin, opensAt: e.target.value } })} />
      </Field>
      <Field label="Closes at">
        <input type="datetime-local" className="input" value={s.checkin.closesAt ?? ""} onChange={(e) => onChange({ ...s, checkin: { ...s.checkin, closesAt: e.target.value } })} />
      </Field>
      <Field label="Offline hint text" full>
        <textarea className="input min-h-[100px]" value={s.checkin.offlineHint ?? ""} onChange={(e) => onChange({ ...s, checkin: { ...s.checkin, offlineHint: e.target.value } })} />
      </Field>
    </div>
  );
}

function Communications({ s, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="RSVP template ID">
        <input className="input" value={s.comms.rsvpTemplate ?? ""} onChange={(e) => onChange({ ...s, comms: { ...s.comms, rsvpTemplate: e.target.value } })} />
      </Field>
      <Field label="Reminder template ID">
        <input className="input" value={s.comms.reminderTemplate ?? ""} onChange={(e) => onChange({ ...s, comms: { ...s.comms, reminderTemplate: e.target.value } })} />
      </Field>
      <Field label="Day-of SMS template ID">
        <input className="input" value={s.comms.dayOfSmsTemplate ?? ""} onChange={(e) => onChange({ ...s, comms: { ...s.comms, dayOfSmsTemplate: e.target.value } })} />
      </Field>
      <div className="md:col-span-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Templates support variables like {"{{guest.name}}"}, {"{{seat}}"}, {"{{mapUrl}}"}.
      </div>
    </div>
  );
}

function AccessPrivacy({ s, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Accessibility statement" full>
        <textarea className="input min-h-[120px]" value={s.accessibility.statement ?? ""} onChange={(e) => onChange({ ...s, accessibility: { ...s.accessibility, statement: e.target.value } })} />
      </Field>
      <Field label="Evacuation note" full>
        <textarea className="input min-h-[120px]" value={s.accessibility.evacuationNote ?? ""} onChange={(e) => onChange({ ...s, accessibility: { ...s.accessibility, evacuationNote: e.target.value } })} />
      </Field>
      <Field label="Consent text" full>
        <textarea className="input min-h-[120px]" value={s.privacy.consentText ?? ""} onChange={(e) => onChange({ ...s, privacy: { ...s.privacy, consentText: e.target.value } })} />
      </Field>
      <Field label="Data retention (days)">
        <input type="number" className="input" value={s.privacy.retentionDays ?? ""} onChange={(e) => onChange({ ...s, privacy: { ...s.privacy, retentionDays: toNum(e.target.value) } })} />
      </Field>
    </div>
  );
}

function Integrations({ s, onChange }: Props) {
  const enabled = s.integrations?.sheetSync?.enabled ?? false;
  const sheetId = s.integrations?.sheetSync?.sheetId ?? "";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Toggle
        label="Enable Google Sheet sync"
        checked={enabled}
        onChange={(v) => onChange({ ...s, integrations: { sheetSync: { enabled: v, sheetId } } })}
      />
      <Field label="Sheet ID">
        <input className="input" value={sheetId} onChange={(e) => onChange({ ...s, integrations: { sheetSync: { enabled, sheetId: e.target.value } } })} />
      </Field>
      <Field label="Caterer CSV preset">
        <input className="input" value={s.exports.catererPreset ?? ""} onChange={(e) => onChange({ ...s, exports: { ...s.exports, catererPreset: e.target.value } })} />
      </Field>
      <Field label="Seating CSV preset">
        <input className="input" value={s.exports.seatingPreset ?? ""} onChange={(e) => onChange({ ...s, exports: { ...s.exports, seatingPreset: e.target.value } })} />
      </Field>
    </div>
  );
}

function PublishSummary({ s, issues, onPublish }: { s: EventSettings; issues: string[]; onPublish: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Review your settings before going live. Status: <span className="font-medium">{s.status}</span>
      </div>
      {issues.length ? (
        <Card title="Blocking issues">
          <ul className="list-disc pl-5 text-sm">
            {issues.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </Card>
      ) : (
        <Card title="All checks passed">Everything looks good ✨</Card>
      )}
      <div className="flex justify-end">
        <Button onClick={onPublish} disabled={issues.length > 0}>{s.status === "Live" ? "Update" : "Publish"}</Button>
      </div>
    </div>
  );
}

/* -------------------------- UI bits -------------------------- */

function TabBar({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = [
    "Overview","Basics","Venue & Rooms","Layout & Seating","Groups & Tags","Vendors & Roles",
    "Check-in & Kiosk","Communications","Accessibility & Privacy","Integrations","Publish",
  ];
  return (
    <div className="flex w-full snap-x overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${current === t ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      {title && <div className="mb-2 font-semibold">{title}</div>}
      {children}
    </div>
  );
}
function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <div className="mb-1 text-sm text-slate-600">{label}</div>
      {children}
    </label>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs">
      {children}
      <button className="text-slate-500 hover:text-slate-700" onClick={onRemove}>✕</button>
    </span>
  );
}
function TagEditor({ items, onAdd, onRemove }: { items: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input className="input" placeholder="Add tag…" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button onClick={() => { onAdd(val); setVal(""); }}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => <Chip key={t} onRemove={() => onRemove(t)}>{t}</Chip>)}
      </div>
    </div>
  );
}

/* -------------------------- utils -------------------------- */

type Props = { s: EventSettings; onChange: React.Dispatch<React.SetStateAction<EventSettings>> };

const toNum = (v: string) => (v === "" ? undefined : Number(v));
const splitCsv = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
const fmtRange = (a: string, b: string) => `${new Date(a).toLocaleString()} → ${new Date(b).toLocaleString()}`;

function useValidation(s: EventSettings) {
  return useMemo(() => {
    const errs: string[] = [];
    if (!s.name.trim()) errs.push("Add an event name.");
    if (!s.startsAt || !s.endsAt) errs.push("Set start and end times.");
    if (s.startsAt && s.endsAt && new Date(s.endsAt) <= new Date(s.startsAt)) errs.push("End time must be after start time.");
    if (!s.venue.name.trim()) errs.push("Add a venue name.");
    if (!s.timezone) errs.push("Select a timezone.");
    if (!s.seatingRules.layoutTemplateId) errs.push("Choose a layout template ID.");
    if (!s.venue.capacity) errs.push("Set a venue capacity.");
    return errs;
  }, [s]);
}

/* Tailwind helper class */
declare global {
  interface HTMLElementTagNameMap {
    // silence TS for className 'input' usage in JSX
  }
}
