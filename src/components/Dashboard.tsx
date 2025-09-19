import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoGenerationCard } from "./VideoGenerationCard";
import { CredentialsPanel } from "./CredentialsPanel";
import { VideoGallery } from "./VideoGallery";
import { SchedulePanel } from "./SchedulePanel";
import { ErrorLogViewer } from "./ErrorLogViewer";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { 
  Play, 
  Settings, 
  Calendar, 
  Video,
  Sparkles,
  Activity,
  Clock,
  CheckCircle,
  LogOut,
  User
} from "lucide-react";

interface GenerationStatus {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  title: string;
  createdAt: string;
  duration?: string;
}

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'credentials' | 'schedule' | 'gallery'>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  
  // Mock data for demonstration
  const [generations] = useState<GenerationStatus[]>([
    {
      id: '1',
      status: 'generating',
      progress: 65,
      title: 'Motivational Monday: Unlock Your Potential',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      status: 'completed',
      progress: 100,
      title: 'Success Mindset: 5 Keys to Achievement',
      createdAt: '2024-01-14T09:15:00Z',
      duration: '3:42'
    },
    {
      id: '3',
      status: 'completed',
      progress: 100,
      title: 'Transform Your Life Today',
      createdAt: '2024-01-13T14:20:00Z',
      duration: '4:18'
    }
  ]);

  const stats = {
    totalVideos: 127,
    todayGenerated: 3,
    totalViews: '2.1M',
    avgDuration: '3:45'
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  const handleSignOut = async () => {
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
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Now
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-2 mt-6">
            <TabButton
              id="dashboard"
              icon={Activity}
              label="Dashboard"
              isActive={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
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
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-card border-border/50 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalVideos}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border/50 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{stats.todayGenerated}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.totalViews}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{stats.avgDuration}</div>
                </CardContent>
              </Card>
            </div>

            {/* Generation Status */}
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Generation Status
              </h2>
              <div className="grid gap-4">
                {generations.map((generation) => (
                  <VideoGenerationCard key={generation.id} generation={generation} />
                ))}
              </div>
            </div>
          </div>
        )}

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