import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CredentialsPanel } from "./CredentialsPanel";
import { VideoGallery } from "./VideoGallery";
import { SchedulePanel } from "./SchedulePanel";
import { ErrorLogViewer } from "./ErrorLogViewer";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { 
  Settings, 
  Calendar, 
  Video,
  Sparkles,
  Activity,
  LogOut,
  User
} from "lucide-react";

export const Dashboard = () => {
  // Use localStorage to persist the active tab, defaulting to 'credentials'
  const [activeTab, setActiveTab] = useLocalStorage<'credentials' | 'schedule' | 'gallery'>('dashboard-active-tab', 'credentials');
  
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  const handleSignOut = async () => {
    console.log('Dashboard: Logout button clicked');
    await signOut();
  };

  const TabButton = ({ 
    id, 
    icon: Icon, 
    label, 
    isActive, 
    onClick 
  }: {
    id: string;
    icon: any;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      onClick={onClick}
      className={`flex items-center gap-2 transition-all duration-300 ${
        isActive 
          ? "bg-gradient-primary text-primary-foreground shadow-glow" 
          : "hover:bg-secondary/50"
      }`}
    >
      <Icon size={18} />
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  AI Video Studio
                </h1>
                <p className="text-sm text-muted-foreground">Automated Motivational Content</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {profile?.name || user?.email}
              </div>
              <Badge variant="outline" className="gap-2">
                <Activity className="w-4 h-4 text-success" />
                System Active
              </Badge>
              <Button 
                variant="outline"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-2 mt-6">
            <TabButton
              id="credentials"
              icon={Settings}
              label="Credentials"
              isActive={activeTab === 'credentials'}
              onClick={() => setActiveTab('credentials')}
            />
            <TabButton
              id="schedule"
              icon={Calendar}
              label="Schedule"
              isActive={activeTab === 'schedule'}
              onClick={() => setActiveTab('schedule')}
            />
            <TabButton
              id="gallery"
              icon={Video}
              label="Gallery"
              isActive={activeTab === 'gallery'}
              onClick={() => setActiveTab('gallery')}
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <CredentialsPanel />
            <ErrorLogViewer />
          </div>
        )}

        {activeTab === 'schedule' && <SchedulePanel />}
        {activeTab === 'gallery' && <VideoGallery />}
      </main>
    </div>
  );
};
