import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Drawer from "@/components/ui/Drawer";
import Modal from "@/components/ui/Modal";
import InviteUserDrawer from "@/features/users/InviteUserDrawer";
import EditUserModal from "@/features/users/EditUserModal";
import { useUsers, useUpdateUser, useBulkUpdateUsers } from "@/hooks/useUsers";
import type { User } from "@/types/api";

export default function ManageUsers() {
  const [roleFilter, setRoleFilter] = useState<"All" | User['role']>("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Fetch users from API
  const { data: usersData, isLoading, error } = useUsers({
    role: roleFilter === "All" ? undefined : roleFilter,
  });

  const updateUserMutation = useUpdateUser();
  const bulkUpdateMutation = useBulkUpdateUsers();

  const users = usersData?.results || [];

  const filtered = useMemo(
    () => (roleFilter === "All" ? users : users.filter((u: User) => u.role === roleFilter)),
    [users, roleFilter]
  );

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="flex justify-center p-8 text-red-600">Error loading users</div>;

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
            {filtered.map((u: User) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <Td><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} aria-label={`Select ${u.first_name} ${u.last_name}`} /></Td>
                <Td className="font-medium">{u.first_name} {u.last_name}</Td>
                <Td>{u.email}</Td>
                <Td>{u.role}</Td>
                <Td><Badge>{u.is_active ? "Active" : "Suspended"}</Badge></Td>
                <Td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</Td>
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
          onInvite={() => {
            // Invite mutation will be handled inside InviteUserDrawer
            setInviteOpen(false);
          }}
        />
      </Drawer>

      <Modal open={!!editUser} title="Edit User" onClose={() => setEditUser(null)}>
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={(updates) => {
              updateUserMutation.mutate({ id: editUser.id, userData: updates });
              setEditUser(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left font-medium text-slate-600">{children}</th>; }
function Td({ className = "", children }: { className?: string; children: React.ReactNode }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
