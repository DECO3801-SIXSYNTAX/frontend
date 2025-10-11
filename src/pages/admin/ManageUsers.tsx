import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Drawer from "@/components/ui/Drawer";
import Modal from "@/components/ui/Modal";
import InviteUserDrawer from "@/features/users/InviteUserDrawer";
import EditUserModal from "@/features/users/EditUserModal";
import type { UserItem, UserRole } from "@/types";
import { api } from "@/lib/api";

export default function ManageUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listUsers()
      .then((data) => { if (!active) return; setUsers(data as UserItem[]); setError(null); })
      .catch((e) => { if (!active) return; setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(
    () => (roleFilter === "All" ? users : users.filter(u => u.role === roleFilter)),
    [users, roleFilter]
  );

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Users</h1>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {["All", "Admin", "Planner", "Vendor", "Guest"].map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
        </div>
      </div>

  {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? new Set(filtered.map(u => u.id)) : new Set())
                  }
                  checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                  aria-label="Select all"
                />
              </Th>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Last Active</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><Td colSpan={7}>Loading…</Td></tr>
            )}
            {!loading && filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <Td><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} aria-label={`Select ${u.name}`} /></Td>
                <Td className="font-medium">{u.name}</Td>
                <Td>{u.email}</Td>
                <Td>{u.role}</Td>
                <Td><Badge>{u.status === "Active" ? "Active" : "Suspended"}</Badge></Td>
                <Td>{u.lastActive ?? ""}</Td>
                <Td><button className="text-blue-700 hover:underline" onClick={() => setEditUser(u)}>Edit</button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow">
          <span className="mr-3 text-sm">{selectedIds.size} selected</span>
          <Button variant="secondary" className="mr-2" onClick={() => alert("Disabled!")}>Disable</Button>
          <Button variant="secondary" onClick={() => alert("Change Role!")}>Change Role</Button>
        </div>
      )}

      <Drawer open={inviteOpen} title="Invite User" onClose={() => setInviteOpen(false)}>
        <InviteUserDrawer
          onClose={() => setInviteOpen(false)}
          onInvite={async (newUser) => {
            try {
              const created = await api.inviteUser({ name: newUser.name, email: newUser.email, role: newUser.role });
              setUsers(prev => [created as UserItem, ...prev]);
              setInviteOpen(false);
            } catch (e) { setError(String(e)); }
          }}
        />
      </Drawer>

      <Modal open={!!editUser} title="Edit User" onClose={() => setEditUser(null)}>
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={async (patch) => {
              try {
                const updated = await api.updateUser(editUser.id, patch) as Partial<UserItem>;
                setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...(updated as object) } as UserItem : u));
                setEditUser(null);
              } catch (e) { setError(String(e)); }
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left font-medium text-slate-600">{children}</th>; }
function Td({ className = "", colSpan, children }: { className?: string; colSpan?: number; children: React.ReactNode }) { return <td colSpan={colSpan} className={`px-4 py-3 ${className}`}>{children}</td>; }
