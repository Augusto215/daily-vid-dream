import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useVideoPreparation } from "@/hooks/useVideoPreparation";
import { useGoogleDrive } from "@/hooks/useGoogleDrive";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings,
  CheckCircle,
  AlertCircle,
  Trash2,
  Video,
  Loader,
  FileVideo,
  Terminal,
  Download
} from "lucide-react";

interface ScheduleEntry {
  id: string;
  time: string;
  frequency: string;
  status: 'active' | 'paused';
  nextRun: string;
  lastRun?: string;
}

export const SchedulePanel = () => {
  // Persist schedule form state
  const [isAutoEnabled, setIsAutoEnabled] = useLocalStorage('daily-dream-auto-enabled', true);
  const [scheduleTime, setScheduleTime] = useLocalStorage('daily-dream-schedule-time', "09:00");
  const [frequency, setFrequency] = useLocalStorage('daily-dream-frequency', "daily");
  const [customDate, setCustomDate] = useLocalStorage('daily-dream-custom-date', "");
  
  // Persist active schedules
  const [schedules, setSchedules] = useLocalStorage<ScheduleEntry[]>('daily-dream-schedules', [
    {
      id: '1',
      time: '09:00',
      frequency: 'Daily',
      status: 'active',
      nextRun: '2024-01-16T09:00:00Z',
      lastRun: '2024-01-15T09:00:00Z'
    },
    {
      id: '2',
      time: '15:00',
      frequency: 'Daily',
      status: 'paused',
      nextRun: '2024-01-16T15:00:00Z',
      lastRun: '2024-01-14T15:00:00Z'
    }
  ]);

  // Google Drive hook
  const { isAuthenticated, signIn, getAccessToken } = useGoogleDrive();

  // Função para debug do token
  const debugToken = async () => {
    console.log('=== DEBUG TOKEN ===');
    console.log('isAuthenticated:', isAuthenticated);
    
    const token = await getAccessToken();
    console.log('Token obtido:', token ? `${token.substring(0, 20)}...` : 'null');
    
    const savedToken = localStorage.getItem('google_drive_token');
    const tokenExpiry = localStorage.getItem('google_drive_token_expiry');
    console.log('Token localStorage:', savedToken ? `${savedToken.substring(0, 20)}...` : 'null');
    console.log('Token expiry:', tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'null');
    
    console.log('=== FIM DEBUG ===');
  };
  
  // Video preparation hook
  const { preparedVideos, isPreparingVideo, preparationLogs, manualPrepareVideo, clearLogs } = useVideoPreparation(schedules);

  // Função para baixar vídeo preparado
  const handleDownloadVideo = (video: any) => {
    if (!video.outputPath) return;
    
    // Se o outputPath é um blob URL (vídeo gerado pelo FFmpeg no backend)
    if (video.outputPath.startsWith('blob:') || video.outputPath.startsWith('http')) {
      // Cria elemento temporário para download
      const link = document.createElement('a');
      link.href = video.outputPath;
      link.download = `combined_video_${video.scheduleId}_${video.id}.mp4`; // MP4 format (real FFmpeg output)
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download do vídeo real FFmpeg iniciado:', video.outputPath);
    } else {
      console.warn('URL de download inválida:', video.outputPath);
    }
  };

  const handleSaveSchedule = () => {
    if (!isAutoEnabled) return;

    // Generate next run date based on frequency
    const getNextRun = () => {
      const now = new Date();
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      
      if (frequency === 'custom' && customDate) {
        const nextRun = new Date(customDate);
        nextRun.setHours(hours, minutes, 0, 0);
        return nextRun.toISOString();
      }
      
      if (frequency === 'daily') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes, 0, 0);
        return tomorrow.toISOString();
      }
      
      if (frequency === 'weekly') {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(hours, minutes, 0, 0);
        return nextWeek.toISOString();
      }
      
      // Default for other frequencies
      const nextRun = new Date(now);
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(hours, minutes, 0, 0);
      return nextRun.toISOString();
    };

    const newSchedule: ScheduleEntry = {
      id: Date.now().toString(),
      time: scheduleTime,
      frequency: frequency.charAt(0).toUpperCase() + frequency.slice(1),
      status: 'active',
      nextRun: getNextRun()
    };

    setSchedules([...schedules, newSchedule]);
    
    // Reset form to defaults
    setScheduleTime("09:00");
    setFrequency("daily");
    setCustomDate("");
    
    console.log("Schedule created:", newSchedule);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
    console.log("Schedule deleted:", id);
  };

  const toggleScheduleStatus = (id: string) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === id 
        ? { ...schedule, status: schedule.status === 'active' ? 'paused' : 'active' }
        : schedule
    ));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle className="w-4 h-4 text-success" />
      : <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
      : <Badge variant="outline">Paused</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Auto Generation Toggle */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Auto Generation Settings
          </CardTitle>
          <CardDescription>
            Configure automatic video generation schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Auto Generation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate videos based on your schedule
              </p>
            </div>
            <Switch
              checked={isAutoEnabled}
              onCheckedChange={setIsAutoEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {isAutoEnabled && (
            <div className="space-y-6 pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="time">Generation Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-secondary/20 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="bg-secondary/20 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {frequency === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customDate">Specific Date</Label>
                  <Input
                    id="customDate"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-secondary/20 border-border/50"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-muted-foreground">
                    Select a specific date for one-time generation
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              className="bg-gradient-primary hover:bg-gradient-primary/90"
              onClick={handleSaveSchedule}
              disabled={!isAutoEnabled || (frequency === 'custom' && !customDate)}
            >
              Save Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Schedules */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Active Schedules
          </CardTitle>
          <CardDescription>
            Manage your current generation schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const preparedVideo = preparedVideos.find(pv => pv.scheduleId === schedule.id);
              const isSchedulePreparing = isPreparingVideo && !preparedVideo;
              
              return (
                <div 
                  key={schedule.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(schedule.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{schedule.time} - {schedule.frequency}</span>
                        
                        {/* Status da preparação do vídeo */}
                        {isSchedulePreparing && (
                          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            <Loader className="w-3 h-3 animate-spin" />
                            Preparing
                          </Badge>
                        )}
                        {preparedVideo?.status === 'ready' && (
                          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                            <FileVideo className="w-3 h-3" />
                            Ready
                          </Badge>
                        )}
                        {preparedVideo?.status === 'error' && (
                          <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/30">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Next run: {formatDateTime(schedule.nextRun)}
                        {schedule.lastRun && (
                          <span className="ml-2">• Last: {formatDateTime(schedule.lastRun)}</span>
                        )}
                        {preparedVideo && (
                          <span className="ml-2">• Video: {preparedVideo.outputPath}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(schedule.status)}
                    
                    {/* Botão para baixar vídeo pronto */}
                    {preparedVideo?.status === 'ready' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                        onClick={() => handleDownloadVideo(preparedVideo)}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => manualPrepareVideo(schedule.id)}
                        disabled={isPreparingVideo}
                      >
                        <Video className="w-4 h-4" />
                        Prepare
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => toggleScheduleStatus(schedule.id)}
                    >
                      {schedule.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Google Drive Authentication Status */}
      {!isAuthenticated && (
        <Card className="bg-gradient-card border-border/50 shadow-card border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Google Drive Authentication Required
            </CardTitle>
            <CardDescription>
              You need to authenticate with Google Drive to prepare videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Video preparation requires access to your Google Drive videos
              </p>
              <Button onClick={signIn} className="bg-blue-600 hover:bg-blue-700">
                Sign in to Google Drive
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Preparation Status */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Video Preparation Logs
            {isAuthenticated ? (
              <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                <CheckCircle className="w-3 h-3" />
                Google Drive Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/30">
                <AlertCircle className="w-3 h-3" />
                Not Connected
              </Badge>
            )}
            {isPreparingVideo && (
              <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                <Loader className="w-3 h-3 animate-spin" />
                Processing
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time logs of video preparation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {preparationLogs.length} log entries
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={preparationLogs.length === 0}
              >
                Clear Logs
              </Button>
            </div>
            
            <div className="bg-secondary/10 rounded-lg p-4 max-h-64 overflow-y-auto">
              {preparationLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No preparation activity yet. Videos will be automatically prepared 1 hour before scheduled posting.
                </p>
              ) : (
                <div className="space-y-1">
                  {preparationLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prepared Videos Summary */}
            {preparedVideos.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium mb-3">Prepared Videos ({preparedVideos.length})</h4>
                <div className="space-y-2">
                  {preparedVideos.map((video) => (
                    <div 
                      key={video.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        {video.status === 'ready' && <FileVideo className="w-4 h-4 text-green-500" />}
                        {video.status === 'preparing' && <Loader className="w-4 h-4 animate-spin text-yellow-500" />}
                        {video.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        
                        <div>
                          <div className="text-sm font-medium">
                            Schedule {video.scheduleId} • {video.status}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {video.sourceVideos.length > 0 && (
                              <span>Sources: {video.sourceVideos.slice(0, 2).join(', ')}</span>
                            )}
                            {video.sourceVideos.length > 2 && (
                              <span> +{video.sourceVideos.length - 2} more</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(video.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {video.status === 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                          onClick={() => handleDownloadVideo(video)}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};