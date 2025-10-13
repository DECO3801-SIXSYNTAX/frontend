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
    <div className="mx-auto max-w-[1200px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Manage Users</h1>
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-medium text-slate-700">Users</div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["All", "Admin", "Planner", "Vendor", "Guest"].map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <Button onClick={() => setInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            Invite User
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}
      
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? new Set(filtered.map(u => u.id)) : new Set())
                  }
                  checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                  aria-label="Select all"
                  className="rounded border-slate-300"
                />
              </Th>
              <Th><span className="sr-only">Avatar</span></Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><Td colSpan={8} className="text-center text-slate-500">Loading…</Td></tr>
            )}
            {!loading && filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <Td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(u.id)} 
                    onChange={() => toggleSelect(u.id)} 
                    aria-label={`Select ${u.name}`}
                    className="rounded border-slate-300"
                  />
                </Td>
                <Td>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Td>
                <Td className="font-medium text-slate-900">{u.name}</Td>
                <Td className="text-slate-700">{u.email}</Td>
                <Td className="text-slate-700">{u.role}</Td>
                <Td><Badge>{u.status === "Active" ? "Active" : "Suspended"}</Badge></Td>
                <Td className="text-slate-600">{u.lastActive ?? ""}</Td>
                <Td>
                  <button 
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium" 
                    onClick={() => setEditUser(u)}
                  >
                    Edit
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-6 py-3 shadow-lg">
          <span className="mr-4 text-sm font-medium text-slate-700">{selectedIds.size} selected</span>
          <Button variant="secondary" className="mr-2 border border-slate-300 bg-white text-slate-700" onClick={() => alert("Disabled!")}>
            Disable
          </Button>
          <Button variant="secondary" className="border border-slate-300 bg-white text-slate-700" onClick={() => alert("Change Role!")}>
            Change Role
          </Button>
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

function Th({ children }: { children: React.ReactNode }) { 
  return <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{children}</th>; 
}

function Td({ className = "", colSpan, children }: { className?: string; colSpan?: number; children: React.ReactNode }) { 
  return <td colSpan={colSpan} className={`px-6 py-4 ${className}`}>{children}</td>; 
}