import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Drawer from "../../components/ui/Drawer";
import Modal from "../../components/ui/Modal";
import { guestsByEvent } from "../../data";
import type { GuestItem, DietaryTag, AccessTag, RSVPStatus } from "../../types";

const DIETARY: DietaryTag[] = ["Vegetarian","Vegan","Halal","Kosher","Gluten-free","Nut allergy"];
const ACCESS: AccessTag[]  = ["Wheelchair","Low-vision","Hearing"];
const RSVP: RSVPStatus[]   = ["Pending","Accepted","Declined"];

export default function GuestManagement() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<GuestItem[]>(guestsByEvent[id ?? "tech-2024"] ?? []);
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState<Set<DietaryTag>>(new Set());
  const [access, setAccess] = useState<Set<AccessTag>>(new Set());
  const [rsvp, setRsvp] = useState<"All" | RSVPStatus>("All");
  const [group, setGroup] = useState<string>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<GuestItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const groups = useMemo(() => Array.from(new Set(rows.map(r => r.group).filter(Boolean))) as string[], [rows]);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return rows.filter(g => {
      if (qlc && !(g.name.toLowerCase().includes(qlc) || g.email.toLowerCase().includes(qlc))) return false;
      if (rsvp !== "All" && g.rsvp !== rsvp) return false;
      if (group !== "All" && g.group !== group) return false;
      if (diet.size && !Array.from(diet).every(tag => g.dietary?.includes(tag))) return false;
      if (access.size && !Array.from(access).every(tag => g.access?.includes(tag))) return false;
      return true;
    });
  }, [rows, q, rsvp, group, diet, access]);

  const toggleSet = <T,>(setter: (s: Set<T>) => void, current: Set<T>, value: T) => {
    const next = new Set(current);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const toggleSelected = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const bulkAssignGroup = (gname: string) => {
    setRows(prev => prev.map(r => selected.has(r.id) ? { ...r, group: gname || undefined } : r));
    setSelected(new Set());
  };

  const bulkAddTag = (type: "dietary" | "access", value: string) => {
    setRows(prev => prev.map(r => {
      if (!selected.has(r.id)) return r;
      if (type === "dietary") {
        const cur = new Set(r.dietary ?? []);
        cur.add(value as DietaryTag);
        return { ...r, dietary: Array.from(cur) as DietaryTag[] };
      }
      const cur = new Set(r.access ?? []);
      cur.add(value as AccessTag);
      return { ...r, access: Array.from(cur) as AccessTag[] };
    }));
    setSelected(new Set());
  };

  const removeGuest = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link to={`/admin/events/${id ?? "tech-2024"}`} className="text-sm text-blue-700">&larr; Back to Event</Link>
          <h1 className="text-2xl font-semibold">Guest Management</h1>
          <div className="text-slate-500 text-sm">Event: <span className="font-medium">{id ?? "tech-2024"}</span></div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button onClick={() => alert("Exported CSV (mock)")}>Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search name or email"
            className="w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select value={rsvp} onChange={e=>setRsvp(e.target.value as any)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option>All</option>{RSVP.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={group} onChange={e=>setGroup(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option>All</option>{groups.map(g => <option key={g}>{g}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {DIETARY.map(t => (
              <FilterChip key={t} active={diet.has(t)} onClick={() => toggleSet(setDiet, diet, t)}>{t}</FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCESS.map(t => (
              <FilterChip key={t} active={access.has(t)} onClick={() => toggleSet(setAccess, access, t)}>{t}</FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>
                <input
                  type="checkbox"
                  onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())}
                  checked={selected.size > 0 && selected.size === filtered.length}
                  aria-label="Select all"
                />
              </Th>
              <Th>Guest</Th><Th>Email</Th><Th>Group</Th><Th>Tags</Th><Th>RSVP</Th><Th>Seat</Th><Th>Check-in</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(g => (
              <tr key={g.id} className="hover:bg-slate-50">
                <Td>
                  <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggleSelected(g.id)} aria-label={`Select ${g.name}`} />
                </Td>
                <Td className="font-medium">{g.name}</Td>
                <Td>{g.email}</Td>
                <Td>{g.group ?? "-"}</Td>
                <Td className="space-x-1">
                  {(g.dietary ?? []).map(t => <Badge key={t}>{t}</Badge>)}
                  {(g.access ?? []).map(t => <Badge key={t}>{t}</Badge>)}
                </Td>
                <Td><Badge>{g.rsvp}</Badge></Td>
                <Td>{g.seat ? <Link className="text-blue-700" to={`/planner/events/${id ?? "tech-2024"}/seating`}>{g.seat}</Link> : "-"}</Td>
                <Td>{g.checkedIn ? "✅" : "—"}</Td>
                <Td className="space-x-2">
                  <button className="text-blue-700 hover:underline" onClick={() => setEdit(g)}>Edit</button>
                  <button className="text-rose-700 hover:underline" onClick={() => removeGuest(g.id)}>Remove</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow flex items-center gap-3">
          <span className="text-sm">{selected.size} selected</span>
          <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onChange={(e)=> bulkAssignGroup(e.target.value)} defaultValue="">
            <option value="" disabled>Assign group…</option>
            {groups.map(g => <option key={g}>{g}</option>)}
            <option value="">Clear group</option>
          </select>
          <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onChange={(e)=> bulkAddTag("dietary", e.target.value)} defaultValue="">
            <option value="" disabled>Add dietary…</option>
            {DIETARY.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onChange={(e)=> bulkAddTag("access", e.target.value)} defaultValue="">
            <option value="" disabled>Add accessibility…</option>
            {ACCESS.map(t => <option key={t}>{t}</option>)}
          </select>
          <Button variant="secondary" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Edit drawer */}
      <Drawer open={!!edit} title="Edit Guest" onClose={() => setEdit(null)}>
        {edit && <EditGuestForm guest={edit} onSave={(patch)=>{
          setRows(prev => prev.map(r => r.id === edit.id ? {...r, ...patch} : r));
          setEdit(null);
        }} onClose={()=>setEdit(null)} />}
      </Drawer>

      {/* Import modal (stub mapping flow) */}
      <Modal open={importOpen} title="Import Guests (CSV)" onClose={() => setImportOpen(false)}>
        <ImportGuests onClose={()=>setImportOpen(false)} onFinish={(added)=>{
          setRows(prev => [...added, ...prev]);
          setImportOpen(false);
        }}/>
      </Modal>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 py-3 text-left font-medium text-slate-600">{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-3 ${className}`}>{children}</td>; }

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

function EditGuestForm({ guest, onSave, onClose }: { guest: GuestItem; onSave: (patch: Partial<GuestItem>) => void; onClose: () => void }) {
  const [name, setName] = useState(guest.name);
  const [email, setEmail] = useState(guest.email);
  const [group, setGroup] = useState(guest.group ?? "");
  const [rsvp, setRsvp] = useState<RSVPStatus>(guest.rsvp);

  return (
    <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); onSave({ name, email, group: group || undefined, rsvp }); }}>
      <Field label="Name"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={name} onChange={e=>setName(e.target.value)} /></Field>
      <Field label="Email"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} /></Field>
      <Field label="Group"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={group} onChange={e=>setGroup(e.target.value)} placeholder="VIP, Company A…" /></Field>
      <Field label="RSVP">
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={rsvp} onChange={e=>setRsvp(e.target.value as RSVPStatus)}>
          {RSVP.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
function ImportGuests({ onFinish, onClose }: { onFinish: (g: GuestItem[]) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="space-y-3">
      <input type="file" accept=".csv" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
      <p className="text-sm text-slate-600">This stub just adds two sample guests so you can wire the flow.</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={()=>onFinish([
          { id: crypto.randomUUID(), name: "New Guest A", email: "a@ex.com", rsvp: "Pending", checkedIn: false },
          { id: crypto.randomUUID(), name: "New Guest B", email: "b@ex.com", rsvp: "Pending", checkedIn: false },
        ])} disabled={!file}>Import</Button>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="mb-1 text-sm text-slate-600">{label}</div>{children}</label>);
}
