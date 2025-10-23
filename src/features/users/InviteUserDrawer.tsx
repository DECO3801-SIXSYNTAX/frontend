import { useState } from "react";
import Button from "@/components/ui/Button";
import type { UserRole } from "@/types";

export default function InviteUserDrawer({
  onInvite,
  onClose,
}: {
  onInvite: (u: { name: string; email: string; role: UserRole; locations: string; status?: "Active"; lastActive?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<{ name: string; email: string; role: UserRole; locations: string }>({
    name: "", email: "", role: "Planner", locations: ""
  });
  const update = (k: keyof typeof form, v: string) => setForm(s => ({ ...s, [k]: v }));

  return (
    <form className="space-y-4" onSubmit={(e)=>{ e.preventDefault(); onInvite({ ...form, status: "Active", lastActive: "just now" }); }}>
      <Field label="Name"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={e=>update("name", e.target.value)} required /></Field>
      <Field label="Email"><input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.email} onChange={e=>update("email", e.target.value)} required /></Field>
      <Field label="Role">
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.role} onChange={e=>update("role", e.target.value as UserRole)}>
          {["Admin","Planner","Vendor","Guest"].map(r=><option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Locations (comma separated)"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.locations} onChange={e=>update("locations", e.target.value)} /></Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit">Invite</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="mb-1 text-sm text-slate-600">{label}</div>{children}</label>);
}
