import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import type { EventItem, UserItem } from "@/types";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listEvents().then(setEvents).catch(()=>{}),
      api.listUsers().then(setUsers).catch(()=>{}),
      api.listRecentActivity({ limit: 5 })
        .then(setActivity)
        .catch(() => setActivity(["Unable to load recent activity."]))
    ]).finally(() => setLoading(false));
  }, []);

  // Get upcoming events (future dates only, sorted by date)
  const getUpcomingEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    return events
      .filter(e => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and manage your platform</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Total Events"
          value={events.length}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Active Events"
          value={events.filter(e => e.status === "Active").length}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title="Total Users"
          value={users.length}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="Planning"
          value={events.filter(e => e.status === "Planning").length}
          color="orange"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
            <Link 
              to="/admin/events" 
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading events...</div>
            ) : getUpcomingEvents().length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">No upcoming events</div>
            ) : (
              getUpcomingEvents().map((e, idx) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    to={`/admin/events/${e.id}`} 
                    className="flex items-center justify-between py-4 px-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg group transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{e.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'} • {e.venue || 'TBD'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{e.status}</Badge>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Team</h2>
              <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                View All
              </Link>
            </div>
            <ul className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-slate-500">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">No users found</div>
              ) : (
                users.slice(0, 5).map(u => (
                  <li key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{u.role}</div>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0" title="Online" />
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Draft Events</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{events.filter(e => e.status === "Draft").length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <span className="text-sm font-medium text-green-900 dark:text-green-200">Active Users</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{users.filter(u => u.status === "Active").length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <span className="text-sm font-medium text-purple-900 dark:text-purple-200">Admins</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{users.filter(u => u.role === "Admin").length}</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="col-span-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading activity...</div>
          ) : activity.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No recent activity yet.</div>
          ) : (
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{a}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, loading }: { 
  icon: React.ReactNode; 
  title: string; 
  value: number; 
  color: string;
  loading: boolean;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }[color] || 'from-slate-500 to-slate-600';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {loading ? '...' : value}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}