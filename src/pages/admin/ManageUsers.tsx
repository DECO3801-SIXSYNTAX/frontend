import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Drawer from "../../components/ui/Drawer";
import Modal from "../../components/ui/Modal";
import InviteUserDrawer from "../../features/users/InviteUserDrawer";
import EditUserModal from "../../features/users/EditUserModal";
import type { UserItem, UserRole } from "../../types";
import { api } from "../../lib/api";

// Simple dropdown menu component
function DropdownMenu({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-20">
            <div className="py-1" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({ onClick, children, variant = "default" }: { onClick: () => void; children: React.ReactNode; variant?: "default" | "danger" }) {
  const classes = variant === "danger"
    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm ${classes} transition-colors`}
    >
      {children}
    </button>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Suspended">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const filtered = useMemo(() => {
    let result = roleFilter === "All" ? users : users.filter(u => u.role === roleFilter);
    
    // Filter by status
    if (statusFilter !== "All") {
      result = result.filter(u => u.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
    }
    return result;
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === "Active").length;
    const suspended = users.filter(u => u.status === "Suspended").length;
    const byRole = {
      Admin: users.filter(u => u.role === "Admin").length,
      Planner: users.filter(u => u.role === "Planner").length,
      Vendor: users.filter(u => u.role === "Vendor").length,
      Guest: users.filter(u => u.role === "Guest").length,
    };
    return { total, active, suspended, byRole };
  }, [users]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkSuspend = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Suspend ${selectedIds.size} user(s)?`)) return;
    
    try {
      setLoading(true);
      await Promise.all(Array.from(selectedIds).map(id => api.suspendUser(id)));
      
      // Update local state
      setUsers(prev => prev.map(u => 
        selectedIds.has(u.id) ? { ...u, status: "Suspended" } : u
      ));
      setSelectedIds(new Set());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Activate ${selectedIds.size} user(s)?`)) return;
    
    try {
      setLoading(true);
      await Promise.all(Array.from(selectedIds).map(id => api.activateUser(id)));
      
      // Update local state
      setUsers(prev => prev.map(u => 
        selectedIds.has(u.id) ? { ...u, status: "Active" } : u
      ));
      setSelectedIds(new Set());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;
    
    try {
      setLoading(true);
      await api.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    try {
      setLoading(true);
      if (user.status === "Active") {
        await api.suspendUser(user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "Suspended" } : u));
      } else {
        await api.activateUser(user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "Active" } : u));
      }
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content from filtered users
    const headers = ["Name", "Email", "Role", "Status", "Last Active"];
    const rows = filtered.map(u => [
      u.name,
      u.email,
      u.role,
      u.status,
      u.lastActive || "Never"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Users</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Invite, edit, and manage user permissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Suspended</p>
              <p className="text-3xl font-bold mt-1">{stats.suspended}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">By Role</p>
              <div className="mt-1 space-y-1">
                <p className="text-sm">Admin: {stats.byRole.Admin} | Planner: {stats.byRole.Planner}</p>
                <p className="text-sm">Vendor: {stats.byRole.Vendor} | Guest: {stats.byRole.Guest}</p>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as ("All" | UserRole))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {["All", "Admin", "Planner", "Vendor", "Guest"].map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ("All" | "Active" | "Suspended"))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportCSV}
            variant="secondary"
            className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
          <Button 
            onClick={() => setInviteOpen(true)} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite User
          </Button>
        </div>
      </div>

      {/* User Count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{users.length}</span> users
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? new Set(filtered.map(u => u.id)) : new Set())
                    }
                    checked={filtered.length > 0 && selectedIds.size > 0 && selectedIds.size === filtered.length}
                    aria-label="Select all"
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr><Td colSpan={8} className="text-center text-slate-500 dark:text-slate-400 py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <span>Loading users...</span>
                  </div>
                </Td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><Td colSpan={8} className="text-center text-slate-500 dark:text-slate-400 py-12">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </Td></tr>
              )}
              {!loading && filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <Td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(u.id)} 
                      onChange={() => toggleSelect(u.id)} 
                      aria-label={`Select ${u.name}`}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                    />
                  </Td>
                  <Td>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                  </Td>
                  <Td className="font-medium text-slate-900 dark:text-white">{u.name}</Td>
                  <Td className="text-slate-700 dark:text-slate-300">{u.email}</Td>
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                      u.role === 'Planner' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                      u.role === 'Vendor' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </Td>
                  <Td><Badge>{u.status === "Active" ? "Active" : "Suspended"}</Badge></Td>
                  <Td className="text-slate-600 dark:text-slate-400">{u.lastActive || 'Never'}</Td>
                  <Td>
                    <DropdownMenu
                      trigger={
                        <button className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      }
                    >
                      <DropdownItem onClick={() => setEditUser(u)}>
                        ✏️ Edit User
                      </DropdownItem>
                      <DropdownItem onClick={() => handleToggleStatus(u)}>
                        {u.status === "Active" ? "🚫 Suspend" : "✅ Activate"}
                      </DropdownItem>
                      <DropdownItem onClick={() => handleDeleteUser(u)} variant="danger">
                        🗑️ Delete User
                      </DropdownItem>
                    </DropdownMenu>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 shadow-2xl flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {selectedIds.size} user{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" 
              onClick={handleBulkSuspend}
            >
              Suspend
            </Button>
            <Button 
              variant="secondary" 
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" 
              onClick={handleBulkActivate}
            >
              Activate
            </Button>
            <Button 
              variant="secondary" 
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" 
              onClick={() => {
                alert(`Change role for ${selectedIds.size} user(s)`);
                setSelectedIds(new Set());
              }}
            >
              Change Role
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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