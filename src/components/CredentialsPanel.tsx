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

interface UserCredential {
  id: string;
  user_id: string;
  open_ai_api_key: string | null;
  eleven_labs_api_key: string | null;
  youtube_api_key: string | null;
  drive_client_id: string | null;
  drive_client_secret: string | null;
  drive_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export const CredentialsPanel = () => {
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState({
    open_ai_api_key: '',
    eleven_labs_api_key: '',
    youtube_api_key: '',
    drive_api_key: '',
    drive_client_id: ''
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
        .eq('user_id', session.session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const credData = data as UserCredential;
        setCredentials({
          open_ai_api_key: credData.open_ai_api_key || '',
          eleven_labs_api_key: credData.eleven_labs_api_key || '',
          youtube_api_key: credData.youtube_api_key || '',
          drive_api_key: credData.drive_api_key || '',
          drive_client_id: credData.drive_client_id || ''
        });

        // Update status to connected for fields that have values
        const newStatuses = statuses.map(status => {
          let hasCredential = false;
          switch (status.service) {
            case 'OpenAI':
              hasCredential = !!credData.open_ai_api_key;
              break;
            case 'ElevenLabs':
              hasCredential = !!credData.eleven_labs_api_key;
              break;
            case 'YouTube':
              hasCredential = !!credData.youtube_api_key;
              break;
            case 'Google Drive':
              hasCredential = !!(credData.drive_api_key && credData.drive_client_id);
              break;
          }

          return {
            ...status,
            status: hasCredential ? 'connected' as const : 'disconnected' as const,
            lastUpdated: hasCredential ? new Date(credData.updated_at).toLocaleDateString() : undefined
          };
        });

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

  const saveCredential = async (fieldKey: string, apiKey: string) => {
    setSaving(prev => ({ ...prev, [fieldKey]: true }));
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

      // Prepare the update object
      const updateData = {
        user_id: session.session.user.id,
        [fieldKey]: apiKey
      };

      const { error } = await supabase
        .from('user_credentials')
        .upsert(updateData as any, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;

      // Update local status
      const serviceName = getServiceNameFromField(fieldKey);
      setStatuses(prev => prev.map(status => {
        if (status.service === serviceName) {
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
        description: `Failed to save credentials`,
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const getServiceNameFromField = (fieldKey: string): string => {
    switch (fieldKey) {
      case 'open_ai_api_key':
        return 'OpenAI';
      case 'eleven_labs_api_key':
        return 'ElevenLabs';
      case 'youtube_api_key':
        return 'YouTube';
      case 'drive_api_key':
      case 'drive_client_id':
        return 'Google Drive';
      default:
        return 'Unknown';
    }
  };

  const credentialSections = [
    {
      title: "OpenAI Configuration",
      icon: Brain,
      description: "API key for generating motivational video scripts",
      fields: [
        { key: 'open_ai_api_key', label: 'OpenAI API Key', type: 'password' }
      ]
    },
    {
      title: "ElevenLabs Configuration",
      icon: Mic,
      description: "API key for text-to-speech audio generation",
      fields: [
        { key: 'eleven_labs_api_key', label: 'ElevenLabs API Key', type: 'password' }
      ]
    },
    {
      title: "YouTube Configuration",
      icon: Youtube,
      description: "OAuth Access Token para upload automático no YouTube. Obtenha em: Google Cloud Console → APIs → YouTube Data API v3 → Credenciais → OAuth 2.0",
      fields: [
        { key: 'youtube_api_key', label: 'YouTube OAuth Access Token', type: 'password' }
      ]
    },
    {
      title: "Google Drive Configuration",
      icon: HardDrive,
      description: "Access to video assets folder",
      fields: [
        { key: 'drive_client_id', label: 'Google Client ID', type: 'text' },
        { key: 'drive_api_key', label: 'Google Drive API Key', type: 'password' }
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

      {/* YouTube OAuth Instructions */}
      <Card className="bg-gradient-card border-border/50 shadow-card border-blue-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-blue-600" />
            Como Obter YouTube Access Token
          </CardTitle>
          <CardDescription>
            Siga estes passos para configurar o upload automático para YouTube
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50/50 p-4 rounded-lg space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>1. Google Cloud Console:</strong></p>
              <p className="ml-4">• Acesse: <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 hover:underline">console.cloud.google.com</a></p>
              <p className="ml-4">• Crie um projeto ou selecione existente</p>
              
              <p><strong>2. Ativar YouTube Data API v3:</strong></p>
              <p className="ml-4">• APIs e Serviços → Biblioteca</p>
              <p className="ml-4">• Busque "YouTube Data API v3" → Ativar</p>
              
              <p><strong>3. Criar Credenciais OAuth 2.0:</strong></p>
              <p className="ml-4">• APIs e Serviços → Credenciais</p>
              <p className="ml-4">• Criar Credenciais → ID do cliente OAuth 2.0</p>
              <p className="ml-4">• Tipo: Aplicação da Web</p>
              <p className="ml-4">• URIs de redirecionamento: <code className="bg-gray-200 px-1 rounded">http://localhost:3001/auth/youtube/callback</code></p>
              
              <p><strong>4. Obter Access Token:</strong></p>
              <p className="ml-4">• Use OAuth 2.0 Playground: <a href="https://developers.google.com/oauthplayground" target="_blank" className="text-blue-600 hover:underline">developers.google.com/oauthplayground</a></p>
              <p className="ml-4">• Scope: <code className="bg-gray-200 px-1 rounded">https://www.googleapis.com/auth/youtube.upload</code></p>
              <p className="ml-4">• Autorize e obtenha o Access Token</p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong> Access Tokens expiram (geralmente 1 hora). 
                Para produção, implemente refresh token ou use Service Account.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => window.open('https://developers.google.com/oauthplayground/', '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🚀 Obter Access Token (OAuth Playground)
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
              >
                ⚙️ Google Cloud Console
              </Button>
            </div>
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
                    onClick={() => saveCredential(field.key, credentials[field.key as keyof typeof credentials])}
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                    disabled={loading || saving[field.key] || !credentials[field.key as keyof typeof credentials]}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving[field.key] ? 'Saving...' : `Save ${field.label}`}
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