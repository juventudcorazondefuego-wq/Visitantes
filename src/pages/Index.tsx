import { VisitorSearch } from "@/components/VisitorSearch";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-secondary text-secondary-foreground py-4 sm:py-6 shadow-lg border-b-4 border-primary">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
            <div className="text-center min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Prosegur Security
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-secondary-foreground/80 mt-0.5 sm:mt-1">
                Control de Visitantes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        <VisitorSearch />
        
        <div className="mt-6 sm:mt-8 text-center">
          <Link to="/login">
            <Button variant="outline" size="sm">
              <Lock className="mr-2 h-4 w-4" />
              Acceso Administrativo
            </Button>
          </Link>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-secondary/50 backdrop-blur-sm py-2 sm:py-3 border-t border-border">
        <p className="text-center text-xs sm:text-sm text-muted-foreground px-2">
          Sistema de Control de Acceso - Prosegur Security © {new Date().getFullYear()}
        </p>
      </footer>
      
      <InstallPrompt />
    </div>
  );
};

export default Index;
