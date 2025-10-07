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

  const dashboardService = new DashboardService();

  const refreshData = async () => {
    try {
      if (currentPage !== 'signin') {
        const [eventsData, guestsData, teamData, activitiesData] = await Promise.all([
          dashboardService.getEvents(),
          dashboardService.getGuests(),
          dashboardService.getTeamMembers(),
          dashboardService.getActivities()
        ]);

        setEvents(eventsData);
        setGuests(guestsData);
        setTeamMembers(teamData);
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    refreshData();
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