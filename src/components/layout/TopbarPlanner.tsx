import { Link, useNavigate } from "react-router-dom";
import { signOut, isAuthenticated } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { DashboardService } from "@/services/DashboardService";
import { Event } from "@/types/dashboard";

export default function TopbarPlanner() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dashboardService = new DashboardService();

  const onSignOut = () => { signOut(); navigate('/signin'); };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search events when query changes
  useEffect(() => {
    const searchEvents = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const events = await dashboardService.getEvents();
        const filtered = events.filter(event =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchEvents, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleEventClick = (eventId: string) => {
    navigate(`/planner/event-config/${eventId}`);
    setShowDropdown(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
        <Link to="/planner" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">S</span>
          <span>SiPanit Planner</span>
        </Link>
        <div className="flex items-center gap-4">
          <div ref={searchRef} className="relative hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                className="w-80 rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
              />
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event.id)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {event.name}
                            </p>
                            {event.startDate && (
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(event.startDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                          {event.status && (
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                              event.status === 'DRAFT' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {event.status}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No events found
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
            🔔 <span className="sr-only">Notifications</span>
          </button>
          {isAuthenticated() ? (
            <button onClick={onSignOut} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">Sign out</button>
          ) : (
            <Link to="/signin" className="text-sm text-purple-600 hover:underline">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
