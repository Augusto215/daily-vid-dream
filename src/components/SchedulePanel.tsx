import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings,
  CheckCircle,
  AlertCircle,
  Trash2
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
            {/* <Button variant="outline">
              Test Schedule
            </Button> */}
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
            {schedules.map((schedule) => (
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
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Next run: {formatDateTime(schedule.nextRun)}
                      {schedule.lastRun && (
                        <span className="ml-2">• Last: {formatDateTime(schedule.lastRun)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(schedule.status)}
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
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};