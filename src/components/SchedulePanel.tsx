import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings,
  CheckCircle,
  AlertCircle
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
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [frequency, setFrequency] = useState("daily");
  
  const [schedules] = useState<ScheduleEntry[]>([
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
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
          )}

          <div className="flex gap-3">
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
              Save Schedule
            </Button>
            <Button variant="outline">
              Test Schedule
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Immediate generation controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 h-16">
              <div className="text-center">
                <Play className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Generate Now</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Calendar className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Schedule Custom</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">View Queue</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};