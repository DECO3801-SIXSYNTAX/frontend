import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DashboardContextType, CurrentPage, Event, Guest, TeamMember, Activity } from '../types/dashboard';
import { DashboardService } from '../services/DashboardService';

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('signin');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dashboardService = new DashboardService();

  // Always restore user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        console.log('✓ Restored user from localStorage:', user);
      } catch (error) {
        console.error('Failed to restore user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        setCurrentUser(null);
        // Only redirect if we're not on public pages
        const publicPaths = ['/', '/signin', '/signup', '/admin/login'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/signin';
        }
      }
    } else {
      setCurrentUser(null);
      // Only redirect if we're not on public pages
      const publicPaths = ['/', '/signin', '/signup', '/admin/login'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/signin';
      }
    }
    setIsLoading(false);
  }, []);

  const refreshData = async () => {
    // Skip if no user or not a planner
    if (!currentUser || currentUser.role !== 'planner') {
      console.log('⊘ Skipping data refresh - User:', currentUser?.email, 'Role:', currentUser?.role);
      setEvents([]);
      setGuests([]);
      setTeamMembers([]);
      setActivities([]);
      return;
    }

    try {
      console.log('↻ Refreshing data for planner:', currentUser.email);
      setIsLoading(true);
      
      const [eventsData, guestsData, teamData, activitiesData, usersData] = await Promise.all([
        dashboardService.getEvents(),
        dashboardService.getGuests(),
        dashboardService.getTeamMembers(),
        dashboardService.getActivities(),
        dashboardService.getUsers()
      ]);

      console.log('✓ Raw data fetched:', {
        events: eventsData.length,
        guests: guestsData.length,
        team: teamData.length,
        activities: activitiesData.length,
        users: usersData.length
      });

      // Filter data by company for planners
      let filteredEvents = eventsData;
      let filteredActivities = activitiesData;

      if (currentUser.company) {
        console.log('→ Filtering by company:', currentUser.company);
        
        // Get all users from the same company
        const companyUserIds = usersData
          .filter(user => user.role === 'planner' && user.company === currentUser.company)
          .map(user => user.id);

        console.log('→ Company user IDs:', companyUserIds);

        // Filter events created by users in the same company
        filteredEvents = eventsData.filter(event =>
          companyUserIds.includes(event.createdBy)
        );

        // Filter activities by users in the same company
        filteredActivities = activitiesData.filter(activity =>
          companyUserIds.includes(activity.userId)
        );
      }

      console.log('✓ Filtered data:', {
        events: filteredEvents.length,
        guests: guestsData.length,
        team: teamData.length,
        activities: filteredActivities.length
      });

      setEvents(filteredEvents);
      setGuests(guestsData);
      setTeamMembers(teamData);
      setActivities(filteredActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('✗ Error refreshing data:', error);
      setIsLoading(false);
      // Don't clear data on error, keep existing data
    }
  };

  // Refresh data when currentUser changes (including initial load)
  useEffect(() => {
    if (currentUser && currentUser.role === 'planner') {
      console.log('→ User loaded, refreshing data...');
      refreshData();
    }
  }, [currentUser]);

  // Also refresh when currentPage changes (for navigation)
  useEffect(() => {
    if (currentPage !== 'signin' && currentUser && currentUser.role === 'planner') {
      console.log('→ Page changed to:', currentPage);
      refreshData();
    }
  }, [currentPage]);

  const value: DashboardContextType = {
    currentPage,
    setCurrentPage,
    currentUser,
    setCurrentUser,
    events,
    setEvents,
    guests,
    setGuests,
    teamMembers,
    setTeamMembers,
    activities,
    setActivities,
    refreshData
  };

  // Don't render children until initial load is complete
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-slate-500">Loading...</div>
    </div>;
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};