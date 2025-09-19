import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState({
    openai: '',
    elevenlabs: '',
    youtube: '',
    googleDrive: '',
    googleClientId: '',
    googleClientSecret: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const [statuses, setStatuses] = useState<CredentialStatus[]>([
    { service: 'OpenAI', status: 'disconnected' },
    { service: 'ElevenLabs', status: 'disconnected' },
    { service: 'YouTube', status: 'disconnected' },
    { service: 'Google Drive', status: 'disconnected' }
  ]);

  // Load credentials on component mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to manage credentials",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const credentialMap: any = {};
        const newStatuses = [...statuses];

        data.forEach((cred) => {
          const serviceKey = cred.service_name.toLowerCase().replace(/\s+/g, '');
          credentialMap[serviceKey] = cred.api_key;
          
          // Update status to connected if we have credentials
          const statusIndex = newStatuses.findIndex(s => 
            s.service.toLowerCase().replace(/\s+/g, '') === serviceKey
          );
          if (statusIndex !== -1) {
            newStatuses[statusIndex] = {
              ...newStatuses[statusIndex],
              status: 'connected',
              lastUpdated: new Date(cred.updated_at).toLocaleDateString()
            };
          }
        });

        setCredentials(prev => ({ ...prev, ...credentialMap }));
        setStatuses(newStatuses);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const saveCredential = async (serviceName: string, apiKey: string) => {
    setSaving(prev => ({ ...prev, [serviceName]: true }));
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save credentials",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_credentials')
        .upsert({
          user_id: session.session.user.id,
          service_name: serviceName,
          api_key: apiKey
        }, { 
          onConflict: 'user_id,service_name' 
        });

      if (error) throw error;

      // Update status to connected
      setStatuses(prev => prev.map(status => {
        if (status.service.toLowerCase().replace(/\s+/g, '') === serviceName.toLowerCase().replace(/\s+/g, '')) {
          return {
            ...status,
            status: 'connected' as const,
            lastUpdated: new Date().toLocaleDateString()
          };
        }
        return status;
      }));

      toast({
        title: "Success",
        description: `${serviceName} credentials saved successfully`,
      });
    } catch (error) {
      console.error('Error saving credential:', error);
      toast({
        title: "Error",
        description: `Failed to save ${serviceName} credentials`,
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  const credentialSections = [
    {
      title: "OpenAI Configuration",
      icon: Brain,
      description: "API key for generating motivational video scripts",
      fields: [
        { key: 'openai', label: 'OpenAI API Key', type: 'password', serviceName: 'OpenAI' }
      ]
    },
    {
      title: "ElevenLabs Configuration",
      icon: Mic,
      description: "API key for text-to-speech audio generation",
      fields: [
        { key: 'elevenlabs', label: 'ElevenLabs API Key', type: 'password', serviceName: 'ElevenLabs' }
      ]
    },
    {
      title: "YouTube Configuration",
      icon: Youtube,
      description: "Credentials for automatic video uploads",
      fields: [
        { key: 'youtube', label: 'YouTube API Key', type: 'password', serviceName: 'YouTube' }
      ]
    },
    {
      title: "Google Drive Configuration",
      icon: HardDrive,
      description: "Access to video assets folder",
      fields: [
        { key: 'googleClientId', label: 'Google Client ID', type: 'text', serviceName: 'Google Drive Client ID' },
        { key: 'googleClientSecret', label: 'Google Client Secret', type: 'password', serviceName: 'Google Drive Client Secret' },
        { key: 'googleDrive', label: 'Google Drive API Key', type: 'password', serviceName: 'Google Drive' }
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
                      disabled={loading}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => togglePasswordVisibility(field.key)}
                        disabled={loading}
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={() => saveCredential(field.serviceName, credentials[field.key as keyof typeof credentials])}
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                    disabled={loading || saving[field.serviceName] || !credentials[field.key as keyof typeof credentials]}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving[field.serviceName] ? 'Saving...' : `Save ${field.label}`}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};