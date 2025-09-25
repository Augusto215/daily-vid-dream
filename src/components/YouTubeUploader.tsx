import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useYouTubeUpload } from "@/hooks/useYouTubeUpload";
import { useCredentials } from "@/hooks/useCredentials";
import { 
  Youtube, 
  Upload, 
  Loader, 
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Settings,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface YouTubeUploaderProps {
  videoFilename?: string;
  videoTitle?: string;
  videoDescription?: string;
  onUploadComplete?: (result: any) => void;
}

export const YouTubeUploader = ({ 
  videoFilename, 
  videoTitle = "",
  videoDescription = "",
  onUploadComplete 
}: YouTubeUploaderProps) => {
  // Get credentials from the credentials panel
  const { getYouTubeKey } = useCredentials();
  
  // YouTube credentials state
  const [youtubeCredentials, setYoutubeCredentials] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:3001/auth/youtube/callback',
    accessToken: '',
    refreshToken: ''
  });

  // Auto-populate YouTube credentials from the credentials panel when available
  useEffect(() => {
    const youtubeKey = getYouTubeKey();
    if (youtubeKey) {
      setYoutubeCredentials(prev => ({
        ...prev,
        accessToken: youtubeKey
      }));
    }
  }, [getYouTubeKey]);

  // Upload metadata state
  const [uploadMetadata, setUploadMetadata] = useState({
    title: videoTitle,
    description: videoDescription,
    tags: '',
    privacyStatus: 'private' as 'private' | 'unlisted' | 'public',
    categoryId: '22' // People & Blogs
  });

  const [showCredentials, setShowCredentials] = useState(false);

  const { isUploading, uploadLogs, lastUploadResult, uploadToYouTube, clearLogs } = useYouTubeUpload();

  const handleUpload = async () => {
    if (!videoFilename) {
      alert('Nenhum vídeo selecionado para upload');
      return;
    }

    if (!uploadMetadata.title.trim()) {
      alert('Título do vídeo é obrigatório');
      return;
    }

    if (!youtubeCredentials.accessToken.trim()) {
      alert('Token de acesso do YouTube é obrigatório');
      return;
    }

    const result = await uploadToYouTube(
      videoFilename,
      {
        title: uploadMetadata.title,
        description: uploadMetadata.description,
        tags: uploadMetadata.tags ? uploadMetadata.tags.split(',').map(t => t.trim()) : [],
        privacyStatus: uploadMetadata.privacyStatus,
        categoryId: uploadMetadata.categoryId
      },
      youtubeCredentials
    );

    if (result && onUploadComplete) {
      onUploadComplete(result);
    }
  };

  const getPrivacyIcon = (status: string) => {
    switch (status) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'unlisted': return <EyeOff className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getPrivacyColor = (status: string) => {
    switch (status) {
      case 'public': return 'text-red-600 bg-red-50 border-red-200';
      case 'unlisted': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'private': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* YouTube Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Credenciais do YouTube
          </CardTitle>
          <CardDescription>
            Configure suas credenciais da API do YouTube para fazer upload automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showCredentials ? 'Ocultar' : 'Configurar'} Credenciais
            </Button>
            {youtubeCredentials.accessToken && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Token configurado
              </Badge>
            )}
          </div>

          {showCredentials && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    type="text"
                    placeholder="Google OAuth Client ID"
                    value={youtubeCredentials.clientId}
                    onChange={(e) => setYoutubeCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Google OAuth Client Secret"
                    value={youtubeCredentials.clientSecret}
                    onChange={(e) => setYoutubeCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Token de acesso do YouTube"
                  value={youtubeCredentials.accessToken}
                  onChange={(e) => setYoutubeCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Obtenha em: <a href="https://developers.google.com/youtube/v3/getting-started" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">YouTube API Console</a>
                </p>
              </div>

              <div>
                <Label htmlFor="refreshToken">Refresh Token (opcional)</Label>
                <Input
                  id="refreshToken"
                  type="password"
                  placeholder="Token de renovação (opcional)"
                  value={youtubeCredentials.refreshToken}
                  onChange={(e) => setYoutubeCredentials(prev => ({ ...prev, refreshToken: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Dados do Vídeo
          </CardTitle>
          <CardDescription>
            Configure os metadados do vídeo para upload no YouTube
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {videoFilename && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Arquivo: {videoFilename}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="title">Título do Vídeo *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Digite o título do seu vídeo"
              value={uploadMetadata.title}
              onChange={(e) => setUploadMetadata(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {uploadMetadata.title.length}/100 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva seu vídeo (opcional)"
              value={uploadMetadata.description}
              onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              maxLength={5000}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {uploadMetadata.description.length}/5000 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              type="text"
              placeholder="tag1, tag2, tag3"
              value={uploadMetadata.tags}
              onChange={(e) => setUploadMetadata(prev => ({ ...prev, tags: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Separe as tags com vírgulas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="privacy">Privacidade</Label>
              <Select 
                value={uploadMetadata.privacyStatus} 
                onValueChange={(value: 'private' | 'unlisted' | 'public') => 
                  setUploadMetadata(prev => ({ ...prev, privacyStatus: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a privacidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Privado
                    </div>
                  </SelectItem>
                  <SelectItem value="unlisted">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Não listado
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Público
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={uploadMetadata.categoryId} 
                onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="22">People & Blogs</SelectItem>
                  <SelectItem value="23">Comedy</SelectItem>
                  <SelectItem value="24">Entertainment</SelectItem>
                  <SelectItem value="25">News & Politics</SelectItem>
                  <SelectItem value="26">Howto & Style</SelectItem>
                  <SelectItem value="27">Education</SelectItem>
                  <SelectItem value="28">Science & Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Badge 
              variant="outline" 
              className={`${getPrivacyColor(uploadMetadata.privacyStatus)} px-3 py-1`}
            >
              {getPrivacyIcon(uploadMetadata.privacyStatus)}
              <span className="ml-2">
                {uploadMetadata.privacyStatus === 'private' && 'Privado'}
                {uploadMetadata.privacyStatus === 'unlisted' && 'Não listado'}
                {uploadMetadata.privacyStatus === 'public' && 'Público'}
              </span>
            </Badge>

            <Button 
              onClick={handleUpload}
              disabled={isUploading || !videoFilename || !uploadMetadata.title || !youtubeCredentials.accessToken}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Fazendo Upload...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Upload para YouTube
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Result Card */}
      {lastUploadResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Upload Concluído!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <strong>Título:</strong> {lastUploadResult.youtube.title}
              </div>
              <div>
                <strong>Video ID:</strong> {lastUploadResult.youtube.videoId}
              </div>
              <div>
                <strong>Status:</strong> 
                <Badge variant="outline" className={`ml-2 ${getPrivacyColor(lastUploadResult.youtube.privacyStatus)}`}>
                  {getPrivacyIcon(lastUploadResult.youtube.privacyStatus)}
                  <span className="ml-1">{lastUploadResult.youtube.privacyStatus}</span>
                </Badge>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <a 
                    href={lastUploadResult.youtube.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver no YouTube
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Logs */}
      {uploadLogs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Logs do Upload
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Limpar Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {uploadLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
