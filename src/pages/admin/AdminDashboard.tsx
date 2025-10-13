import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { EventItem, UserItem } from "@/types";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activity, setActivity] = useState<string[]>([]);

  useEffect(() => {
    api.listEvents().then(setEvents).catch(()=>{});
    api.listUsers().then(setUsers).catch(()=>{});
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 rounded-lg bg-white border border-slate-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Upcoming Events</h2>
          </div>
          <div className="space-y-1">
            {events.map(e => (
              <Link key={e.id} to={`/admin/events/${e.id}`} className="flex items-center justify-between py-3 px-3 hover:bg-slate-50 rounded-md group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{e.name}</div>
                    <div className="text-sm text-slate-500">{e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'} • {e.venue || 'TBD'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{e.status}</Badge>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="rounded-lg bg-white border border-slate-200 p-6">
            <div className="mb-4 font-semibold text-slate-900">Activity List</div>
            <div className="space-y-4">
              <div className="flex items-center justify-center flex-col py-4 px-4 rounded-lg bg-slate-50">
                <div className="text-3xl font-bold text-blue-600">{events.length}</div>
                <div className="text-xs text-slate-600 mt-1">Total Events</div>
              </div>
              <div className="flex items-center justify-center flex-col py-4 px-4 rounded-lg bg-slate-50">
                <div className="text-3xl font-bold text-green-600">{events.filter(x=>x.status==="Active").length}</div>
                <div className="text-xs text-slate-600 mt-1">Active Events</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-center flex-col py-3 px-3 rounded-lg bg-slate-50">
                  <div className="text-2xl font-bold text-slate-900">{events.filter(x=>x.status==="Planning").length}</div>
                  <div className="text-xs text-slate-600 mt-1">Planning</div>
                </div>
                <div className="flex items-center justify-center flex-col py-3 px-3 rounded-lg bg-slate-50">
                  <div className="text-2xl font-bold text-orange-600">{users.length}</div>
                  <div className="text-xs text-slate-600 mt-1">Total Users</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-white border border-slate-200 p-6">
            <div className="mb-4 font-semibold text-slate-900">Active Team</div>
            <ul className="space-y-3">
              {users.slice(0,4).map(u=>(
                <li key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700 flex-1">{u.name}</span>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="col-span-12 rounded-lg bg-white border border-slate-200 p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="text-sm text-slate-500">No recent activity yet.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((a, i) => (<li key={i}>{a}</li>))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}