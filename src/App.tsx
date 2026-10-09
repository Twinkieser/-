import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { ClientsPage } from './pages/ClientsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { ServiceTypesPage } from './pages/ServiceTypesPage';
import { TicketModal } from './components/TicketModal';
import { ClientModal } from './components/ClientModal';
import { EventLogModal } from './components/EventLogModal';
import { AutoTestModal } from './components/AutoTestModal';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Modals state
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const [isAutoTestOpen, setIsAutoTestOpen] = useState(false);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Badges count
  const [myTasksCount, setMyTasksCount] = useState(0);

  const refreshBadgeCounts = async () => {
    if (user) {
      try {
        const tasks = await api.getMyTasks();
        setMyTasksCount(tasks.length);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    refreshBadgeCounts();
  }, [user, activeTab, selectedTicketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        Инициализация системы ClientDesk...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenLogs={() => setIsEventLogOpen(true)}
        onOpenAutoTest={() => setIsAutoTestOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onRefreshData={() => {
          refreshBadgeCounts();
          setSelectedTicketId(null);
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tab => {
            setActiveTab(tab);
            setSelectedTicketId(null);
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          myTasksCount={myTasksCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {selectedTicketId !== null ? (
            <TicketDetailPage
              ticketId={selectedTicketId}
              onBack={() => setSelectedTicketId(null)}
              onRefreshData={refreshBadgeCounts}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  onOpenCreateTicket={() => setIsCreateTicketOpen(true)}
                  onOpenCreateClient={() => setIsCreateClientOpen(true)}
                  onSelectTicket={id => setSelectedTicketId(id)}
                  onNavigateToTab={tab => setActiveTab(tab)}
                />
              )}

              {activeTab === 'tickets' && (
                <TicketsPage
                  onSelectTicket={id => setSelectedTicketId(id)}
                  onOpenCreateTicket={() => setIsCreateTicketOpen(true)}
                />
              )}

              {activeTab === 'my-tasks' && (
                <MyTasksPage onSelectTicket={id => setSelectedTicketId(id)} />
              )}

              {activeTab === 'clients' && (
                <ClientsPage onSelectTicket={id => setSelectedTicketId(id)} />
              )}

              {activeTab === 'services' && <ServiceTypesPage />}

              {activeTab === 'reports' && (
                <ReportsPage onSelectTicket={id => setSelectedTicketId(id)} />
              )}

              {activeTab === 'users' && <UsersPage />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      {isCreateTicketOpen && (
        <TicketModal
          isOpen={true}
          onClose={() => setIsCreateTicketOpen(false)}
          onSaved={() => {
            refreshBadgeCounts();
          }}
        />
      )}

      {isCreateClientOpen && (
        <ClientModal
          isOpen={true}
          onClose={() => setIsCreateClientOpen(false)}
          onSaved={() => {}}
        />
      )}

      <EventLogModal
        isOpen={isEventLogOpen}
        onClose={() => setIsEventLogOpen(false)}
      />

      <AutoTestModal
        isOpen={isAutoTestOpen}
        onClose={() => setIsAutoTestOpen(false)}
        onRefreshData={() => {
          refreshBadgeCounts();
          setSelectedTicketId(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
