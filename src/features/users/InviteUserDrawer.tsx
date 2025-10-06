import { useState } from "react";
import Button from "@/components/ui/Button";
import { useCreateUser } from "@/hooks/useUsers";
import type { User } from "@/types/api";

export default function InviteUserDrawer({
  onInvite,
  onClose,
}: {
  onInvite: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "Planner" as User['role']
  });
  
  const createUserMutation = useCreateUser();
  
  const update = (k: keyof typeof form, v: string) => setForm(s => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync(form);
      onInvite();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Username"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.username} onChange={e=>update("username", e.target.value)} required /></Field>
      <Field label="First Name"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.first_name} onChange={e=>update("first_name", e.target.value)} required /></Field>
      <Field label="Last Name"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.last_name} onChange={e=>update("last_name", e.target.value)} required /></Field>
      <Field label="Email"><input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.email} onChange={e=>update("email", e.target.value)} required /></Field>
      <Field label="Password"><input type="password" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.password} onChange={e=>update("password", e.target.value)} required /></Field>
      <Field label="Role">
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.role} onChange={e=>update("role", e.target.value as User['role'])}>
          {["Admin","Planner","Vendor","Guest"].map(r=><option key={r}>{r}</option>)}
        </select>
      </Field>
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
