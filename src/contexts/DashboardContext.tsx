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
      if (currentPage !== 'signin' && currentUser) {
        const [eventsData, guestsData, teamData, activitiesData, usersData] = await Promise.all([
          dashboardService.getEvents(),
          dashboardService.getGuests(),
          dashboardService.getTeamMembers(),
          dashboardService.getActivities(),
          dashboardService.getUsers()
        ]);

        // Filter data by company for planners
        let filteredEvents = eventsData;
        let filteredActivities = activitiesData;

        if (currentUser.role === 'planner' && currentUser.company) {
          // Get all users from the same company
          const companyUserIds = usersData
            .filter(user => user.role === 'planner' && user.company === currentUser.company)
            .map(user => user.id);

          // Filter events created by users in the same company
          filteredEvents = eventsData.filter(event =>
            companyUserIds.includes(event.createdBy)
          );

          // Filter activities by users in the same company
          filteredActivities = activitiesData.filter(activity =>
            companyUserIds.includes(activity.userId)
          );
        }

        setEvents(filteredEvents);
        setGuests(guestsData);
        setTeamMembers(teamData);
        setActivities(filteredActivities);
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