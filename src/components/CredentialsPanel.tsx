import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Youtube, 
  Mic, 
  Brain, 
  HardDrive,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save
} from "lucide-react";

interface CredentialStatus {
  service: string;
  status: 'connected' | 'disconnected' | 'error';
  lastUpdated?: string;
}

export const CredentialsPanel = () => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState({
    openai: '',
    elevenlabs: '',
    youtube: '',
    googleDrive: '',
    googleClientId: '',
    googleClientSecret: ''
  });

  const [statuses] = useState<CredentialStatus[]>([
    { service: 'OpenAI', status: 'connected', lastUpdated: '2024-01-15' },
    { service: 'ElevenLabs', status: 'connected', lastUpdated: '2024-01-15' },
    { service: 'YouTube', status: 'error', lastUpdated: '2024-01-14' },
    { service: 'Google Drive', status: 'disconnected' }
  ]);

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-success/20 text-success border-success/30">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  const credentialSections = [
    {
      title: "OpenAI Configuration",
      icon: Brain,
      description: "API key for generating motivational video scripts",
      fields: [
        { key: 'openai', label: 'OpenAI API Key', type: 'password' }
      ]
    },
    {
      title: "ElevenLabs Configuration",
      icon: Mic,
      description: "API key for text-to-speech audio generation",
      fields: [
        { key: 'elevenlabs', label: 'ElevenLabs API Key', type: 'password' }
      ]
    },
    {
      title: "YouTube Configuration",
      icon: Youtube,
      description: "Credentials for automatic video uploads",
      fields: [
        { key: 'youtube', label: 'YouTube API Key', type: 'password' }
      ]
    },
    {
      title: "Google Drive Configuration",
      icon: HardDrive,
      description: "Access to video assets folder",
      fields: [
        { key: 'googleClientId', label: 'Google Client ID', type: 'text' },
        { key: 'googleClientSecret', label: 'Google Client Secret', type: 'password' },
        { key: 'googleDrive', label: 'Google Drive API Key', type: 'password' }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Status Overview */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Service Status
          </CardTitle>
          <CardDescription>
            Current connection status for all integrated services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statuses.map((status) => (
              <div key={status.service} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.status)}
                  <span className="font-medium">{status.service}</span>
                </div>
                {getStatusBadge(status.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credential Forms */}
      <div className="grid gap-6">
        {credentialSections.map((section) => (
          <Card key={section.title} className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="w-5 h-5 text-primary" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                      value={credentials[field.key as keyof typeof credentials]}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                      className="bg-secondary/20 border-border/50 pr-10"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => togglePasswordVisibility(field.key)}
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button className="w-full bg-gradient-primary hover:bg-gradient-primary/90">
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};