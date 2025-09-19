import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Download,
  Youtube,
  Activity
} from "lucide-react";

interface GenerationStatus {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  title: string;
  createdAt: string;
  duration?: string;
}

interface VideoGenerationCardProps {
  generation: GenerationStatus;
}

export const VideoGenerationCard = ({ generation }: VideoGenerationCardProps) => {
  const getStatusIcon = () => {
    switch (generation.status) {
      case 'generating':
        return <Activity className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (generation.status) {
      case 'generating':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Generating</Badge>;
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/30">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow/20 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg text-foreground">{generation.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(generation.createdAt)}
                {generation.duration && (
                  <span className="ml-2">• {generation.duration}</span>
                )}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {generation.status === 'generating' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-medium">{generation.progress}%</span>
            </div>
            <Progress value={generation.progress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Estimated time remaining: {Math.ceil((100 - generation.progress) / 10)} minutes
            </div>
          </div>
        )}

        {generation.status === 'completed' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" className="flex-1 bg-gradient-accent hover:bg-gradient-accent/90">
              <Youtube className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        )}

        {generation.status === 'failed' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              Retry Generation
            </Button>
            <Button size="sm" variant="ghost" className="flex-1">
              View Logs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};