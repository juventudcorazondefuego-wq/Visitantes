import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';

export default function AdminLayout() {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 sm:h-16 border-b bg-card flex items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="font-bold text-sm sm:text-lg truncate">Prosegur</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Gestión de Visitantes</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right text-xs sm:text-sm hidden md:block">
                <p className="font-medium truncate max-w-[150px] lg:max-w-none">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="whitespace-nowrap">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
