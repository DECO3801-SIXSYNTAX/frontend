import { useState } from "react";
import Button from "@/components/ui/Button";
import type { UserItem, UserRole, UserStatus } from "@/types";

export default function EditUserModal({
  user,
  onSave,
  onClose,
}: {
  user: UserItem;
  onSave: (patch: Partial<Pick<UserItem, "role" | "status">>) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);

  return (
    <form className="space-y-4" onSubmit={(e)=>{ e.preventDefault(); onSave({ role, status }); }}>
      <label className="block">
        <div className="mb-1 text-sm text-slate-600">Role</div>
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={role} onChange={e=>setRole(e.target.value as UserRole)}>
          {["Admin","Planner","Vendor","Guest"].map(r=><option key={r}>{r}</option>)}
        </select>
      </label>
      <label className="block">
        <div className="mb-1 text-sm text-slate-600">Status</div>
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={status} onChange={e=>setStatus(e.target.value as UserStatus)}>
          {["Active","Suspended"].map(s=><option key={s}>{s}</option>)}
        </select>
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
