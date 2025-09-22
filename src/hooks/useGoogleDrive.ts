import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriveVideo {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
  owners?: Array<{
    displayName: string;
  }>;
}

interface DriveCredentials {
  client_id: string;
  api_key: string;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const useGoogleDrive = () => {
  const [videos, setVideos] = useState<DriveVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<DriveCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isGapiInitialized, setIsGapiInitialized] = useState(false);
  const { toast } = useToast();

  // Carregar credenciais e verificar token salvo
  useEffect(() => {
    const initialize = async () => {
      await loadCredentials();
      await checkSavedToken();
    };
    initialize();
  }, []);

  // Auto-inicializar quando credenciais estiverem disponíveis
  useEffect(() => {
    if (credentials && !isGapiInitialized) {
      loadGoogleAPIs();
      initializeGoogleServices();
    }
  }, [credentials]);

  // Reconfigurar token se as credenciais chegarem depois do token
  useEffect(() => {
    if (credentials && accessToken && isGapiInitialized && window.gapi?.client) {
      console.log('Reconfigurando token com credenciais carregadas');
      window.gapi.client.setToken({ access_token: accessToken });
    }
  }, [credentials, accessToken, isGapiInitialized]);

  // Auto-reconectar quando as APIs estão prontas
  useEffect(() => {
    if (credentials && isGapiInitialized) {
      autoReconnect();
    }
  }, [credentials, isGapiInitialized]);

  // Função para verificar token salvo no localStorage
  const checkSavedToken = async () => {
    const savedToken = localStorage.getItem('google_drive_token');
    const tokenExpiry = localStorage.getItem('google_drive_token_expiry');
    
    if (savedToken && tokenExpiry) {
      const now = Date.now();
      const expiry = parseInt(tokenExpiry);
      
      // Verificar se o token ainda é válido (com margem de 1 minuto)
      if (now < expiry - 60000) { // 1 minuto = 60000ms
        console.log('Token válido encontrado no localStorage');
        setAccessToken(savedToken);
        setIsAuthenticated(true);
        
        // Tentar configurar o GAPI se já estiver disponível
        if (window.gapi && window.gapi.client) {
          try {
            window.gapi.client.setToken({ access_token: savedToken });
            console.log('Token configurado no GAPI');
          } catch (error) {
            console.warn('Erro ao configurar token no GAPI:', error);
          }
        }
        
        return true; // Token válido encontrado
      } else {
        console.log('Token expirado, removendo do localStorage');
        localStorage.removeItem('google_drive_token');
        localStorage.removeItem('google_drive_token_expiry');
        return false; // Token expirado
      }
    }
    
    return false; // Nenhum token encontrado
  };

  // Salvar token no localStorage com tempo de expiração
  const saveToken = (token: string, expiresIn: number = 3600) => {
    const expiryTime = Date.now() + (expiresIn * 1000); // expiresIn em segundos
    localStorage.setItem('google_drive_token', token);
    localStorage.setItem('google_drive_token_expiry', expiryTime.toString());
    console.log('Token salvo no localStorage, expira em:', new Date(expiryTime));
    
    // Salvar timestamp da última conexão bem-sucedida
    localStorage.setItem('google_drive_last_connection', Date.now().toString());
  };

  // Remover token do localStorage
  const removeToken = () => {
    localStorage.removeItem('google_drive_token');
    localStorage.removeItem('google_drive_token_expiry');
    console.log('Token removido do localStorage');
  };

  // Aguardar GAPI carregar
  const waitForGapi = () => {
    return new Promise<void>((resolve) => {
      const checkGapi = () => {
        if (window.gapi && window.gapi.client) {
          resolve();
        } else {
          setTimeout(checkGapi, 100);
        }
      };
      checkGapi();
    });
  };

  const loadCredentials = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('user_credentials')
        .select('drive_client_id, drive_api_key')
        .eq('user_id', session.session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.drive_client_id && data.drive_api_key) {
        setCredentials({
          client_id: data.drive_client_id,
          api_key: data.drive_api_key
        });
      }
    } catch (error) {
      console.error('Error loading Drive credentials:', error);
    }
  };

  const loadGoogleAPIs = () => {
    // Carregar Google Identity Services
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.async = true;
      document.head.appendChild(gsiScript);
    }

    // Carregar Google API
    if (!document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      document.head.appendChild(gapiScript);
    }
  };

  const initializeGoogleServices = async () => {
    if (!credentials || isGapiInitialized) return;

    try {
      console.log('Inicializando serviços Google...');
      
      // Aguardar APIs carregarem
      await new Promise<void>((resolve) => {
        const checkAPIs = () => {
          if (window.gapi && window.google) {
            resolve();
          } else {
            setTimeout(checkAPIs, 100);
          }
        };
        checkAPIs();
      });

      // Inicializar Google API
      await new Promise((resolve, reject) => {
        window.gapi.load('client', {
          callback: resolve,
          onerror: reject
        });
      });

      // Inicializar cliente GAPI
      await window.gapi.client.init({
        apiKey: credentials.api_key,
      });

      // Carregar Drive API
      await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');

      setIsGapiInitialized(true);

      // Se já temos um token salvo válido, configurá-lo imediatamente
      if (accessToken && isAuthenticated) {
        console.log('Configurando token salvo após inicialização do GAPI');
        window.gapi.client.setToken({
          access_token: accessToken
        });
        
        // Auto-carregar vídeos se ainda não foram carregados
        if (videos.length === 0) {
          setTimeout(() => {
            listVideos();
          }, 500);
        }
      }

      // Configurar Google Identity Services
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: credentials.client_id,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error) {
            console.error('Erro na autenticação:', response.error);
            toast({
              title: "Erro na Autenticação",
              description: response.error,
              variant: "destructive",
            });
            return;
          }
          
          setAccessToken(response.access_token);
          setIsAuthenticated(true);
          
          // Salvar token no localStorage (padrão Google: 1 hora = 3600 segundos)
          saveToken(response.access_token, response.expires_in || 3600);
          
          // Configurar token para as requisições
          window.gapi.client.setToken({
            access_token: response.access_token
          });

          toast({
            title: "Sucesso",
            description: "Conectado ao Google Drive com sucesso!",
          });

          // Auto-carregar vídeos
          setTimeout(() => {
            listVideos();
          }, 1000);
        },
      });

      setTokenClient(client);
      console.log('Serviços Google inicializados com sucesso');
      
    } catch (error) {
      console.error('Erro na inicialização:', error);
      toast({
        title: "Erro na Inicialização",
        description: "Falha ao inicializar serviços do Google",
        variant: "destructive",
      });
    }
  };

  const signIn = async () => {
    if (!isGapiInitialized || !tokenClient) {
      await initializeGoogleServices();
      if (!tokenClient) {
        toast({
          title: "Erro",
          description: "Serviços não foram inicializados corretamente",
          variant: "destructive",
        });
        return;
      }
    }

    if (tokenClient) {
      tokenClient.requestAccessToken({
        prompt: 'consent'
      });
    }
  };

  const signOut = () => {
    console.log('signOut called - current state:', { accessToken: !!accessToken, isAuthenticated });
    
    if (accessToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(accessToken);
        console.log('Token revogado do Google');
      } catch (error) {
        console.warn('Erro ao revogar token:', error);
      }
    }
    
    // Limpar estado local
    setAccessToken(null);
    setIsAuthenticated(false);
    setVideos([]);
    
    // Remover token do localStorage
    removeToken();
    
    // Limpar token do GAPI
    if (window.gapi?.client) {
      try {
        window.gapi.client.setToken(null);
        console.log('Token removido do GAPI');
      } catch (error) {
        console.warn('Erro ao limpar token do GAPI:', error);
      }
    }
    
    console.log('Logout completo');
    toast({
      title: "Desconectado",
      description: "Você foi desconectado do Google Drive com sucesso",
    });
  };

  const listVideos = async () => {
    if (!isAuthenticated || !accessToken) {
      toast({
        title: "Autenticação Necessária",
        description: "Faça login no Google Drive primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Buscando vídeos no Google Drive...');
      
      const response = await window.gapi.client.drive.files.list({
        q: "mimeType contains 'video/' and trashed=false",
        fields: 'files(id, name, size, createdTime, modifiedTime, mimeType, owners, webViewLink, webContentLink, videoMediaMetadata)',
        orderBy: 'modifiedTime desc',
        pageSize: 100
      });

      const files = response.result.files || [];
      setVideos(files);

      console.log(`Encontrados ${files.length} vídeos`);
      toast({
        title: "Sucesso",
        description: `${files.length} vídeos encontrados no Google Drive`,
      });
    } catch (error: any) {
      console.error('Erro ao listar vídeos:', error);
      
      // Se erro 401, token provavelmente expirou
      if (error.status === 401 || error.result?.error?.code === 401) {
        console.log('Token expirado, removendo do localStorage');
        removeToken();
        setAccessToken(null);
        setIsAuthenticated(false);
        
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Conecte-se novamente.",
          variant: "destructive",
        });
      } else if (error.status === 403) {
        toast({
          title: "Acesso Negado",
          description: "Verifique as permissões da API do Google Drive",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro de Conexão",
          description: "Falha ao listar vídeos. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para validar se o token ainda funciona
  const validateToken = async (): Promise<boolean> => {
    if (!accessToken || !window.gapi?.client) return false;
    
    try {
      // Tentar fazer uma requisição simples para validar o token
      const response = await window.gapi.client.drive.about.get({
        fields: 'user'
      });
      
      if (response.status === 200) {
        console.log('Token validado com sucesso');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.log('Token inválido ou expirado:', error);
      
      // Se erro 401, remover token
      if (error.status === 401) {
        removeToken();
        setAccessToken(null);
        setIsAuthenticated(false);
      }
      
      return false;
    }
  };

  // Função para verificar se usuário estava conectado recentemente (para tentar reconectar silenciosamente)
  const wasRecentlyConnected = (): boolean => {
    const lastConnection = localStorage.getItem('google_drive_last_connection');
    if (!lastConnection) return false;
    
    const lastTime = parseInt(lastConnection);
    const now = Date.now();
    const hoursSinceLastConnection = (now - lastTime) / (1000 * 60 * 60);
    
    // Se conectou nas últimas 24 horas, considerar "recente"
    return hoursSinceLastConnection < 24;
  };

  // Função para auto-reconectar quando possível
  const autoReconnect = async () => {
    if (!credentials || !isGapiInitialized) return;
    
    const tokenValid = await checkSavedToken();
    if (tokenValid && accessToken) {
      console.log('Auto-reconectando com token salvo...');
      
      // Aguardar um pouco e validar o token
      setTimeout(async () => {
        const isValid = await validateToken();
        if (isValid) {
          console.log('Auto-reconexão bem-sucedida');
          if (videos.length === 0) {
            listVideos();
          }
        }
      }, 1000);
    }
  };

  const formatFileSize = (bytes: string | number) => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(size) || size === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: string | number) => {
    const ms = typeof milliseconds === 'string' ? parseInt(milliseconds) : milliseconds;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return {
    videos,
    loading,
    credentials,
    isAuthenticated,
    isGapiInitialized,
    signIn,
    signOut,
    listVideos,
    formatFileSize,
    formatDuration,
    formatDate,
    loadCredentials
  };
};
