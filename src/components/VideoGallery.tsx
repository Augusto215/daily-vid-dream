import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleDrive } from "@/hooks/useGoogleDrive";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { 
  Video, 
  Play, 
  Download, 
  ExternalLink, 
  Search,
  Filter,
  Clock,
  Calendar,
  HardDrive,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export const VideoGallery = () => {
  // Usar hooks personalizados para persistir estados dos filtros
  const [searchQuery, setSearchQuery] = useLocalStorage('daily-dream-search-query', '');
  const [sortBy, setSortBy] = useLocalStorage('daily-dream-sort-by', 'newest');
  const [filterBy, setFilterBy] = useLocalStorage('daily-dream-filter-by', 'all');
  
  // Detectar se filtros foram restaurados do localStorage
  const hasRestoredFilters = searchQuery || sortBy !== 'newest' || filterBy !== 'all';

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setFilterBy('all');
  };
  
  const { 
    videos, 
    loading, 
    isAuthenticated, 
    credentials,
    signIn, 
    signOut,
    listVideos,
    formatFileSize,
    formatDuration,
    formatDate
  } = useGoogleDrive();

  // Debug logs para verificar estados
  useEffect(() => {
    console.log('VideoGallery Debug:', {
      isAuthenticated,
      credentials,
      videosCount: videos.length,
      loading
    });
  }, [isAuthenticated, credentials, videos.length, loading]);

  // Estado para controlar mensagem de reconexão
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Verificar se está tentando reconectar automaticamente
  useEffect(() => {
    if (credentials && !isAuthenticated && !loading) {
      const token = localStorage.getItem('google_drive_token');
      const expiry = localStorage.getItem('google_drive_token_expiry');
      
      if (token && expiry) {
        const now = Date.now();
        const tokenExpiry = parseInt(expiry);
        
        // Se token ainda válido, mostrar estado de reconexão
        if (now < tokenExpiry - 60000) { // 1 minuto de margem
          setIsReconnecting(true);
          
          // Limpar estado após alguns segundos
          setTimeout(() => {
            setIsReconnecting(false);
          }, 5000);
        }
      }
    }
  }, [credentials, isAuthenticated, loading]);

  // Limpar estado de reconexão quando autenticar
  useEffect(() => {
    if (isAuthenticated) {
      setIsReconnecting(false);
    }
  }, [isAuthenticated]);

  // Auto-fetch videos when authenticated
  useEffect(() => {
    if (isAuthenticated && videos.length === 0) {
      listVideos();
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    if (isAuthenticated) {
      listVideos();
    }
  };

  const getFilteredAndSortedVideos = () => {
    let filtered = [...videos];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(video => 
        video.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(video => {
        const mimeType = video.mimeType.toLowerCase();
        switch (filterBy) {
          case 'mp4':
            return mimeType.includes('mp4');
          case 'avi':
            return mimeType.includes('avi');
          case 'mov':
            return mimeType.includes('mov') || mimeType.includes('quicktime');
          case 'other':
            return !mimeType.includes('mp4') && !mimeType.includes('avi') && !mimeType.includes('mov') && !mimeType.includes('quicktime');
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return parseInt(b.size || '0') - parseInt(a.size || '0');
        case 'newest':
        default:
          return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
      }
    });
    
    return filtered;
  };

  const filteredVideos = getFilteredAndSortedVideos();

  return (
    <div className="space-y-6">
      {/* Authentication Alert */}
      {!credentials && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure suas credenciais do Google Drive nas configurações para visualizar seus vídeos.
          </AlertDescription>
        </Alert>
      )}

      {credentials && !isAuthenticated && !isReconnecting && (
        <Alert>
          <HardDrive className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Conecte-se ao Google Drive para visualizar seus vídeos.</span>
            <Button onClick={signIn} size="sm">
              <HardDrive className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isReconnecting && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription className="flex items-center justify-between">
            <span>Reconectando ao Google Drive automaticamente...</span>
            <Button 
              onClick={signOut} 
              size="sm" 
              variant="outline"
              title="Cancelar reconexão automática"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header and Controls - Only show when authenticated */}
      {isAuthenticated && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Galeria de Vídeos
                  <Badge variant="outline" className="ml-2">
                    <HardDrive className="w-3 h-3 mr-1" />
                    Google Drive
                  </Badge>
                  {hasRestoredFilters && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      Filtros Ativos
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {`${videos.length} vídeos encontrados no Google Drive`}
                </CardDescription>
              </div>
              
              {/* Área de botões */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleRefresh} 
                  size="sm" 
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                {hasRestoredFilters && (
                  <Button 
                    onClick={clearAllFilters} 
                    size="sm" 
                    variant="outline"
                    title="Limpar todos os filtros"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
                <Button 
                  onClick={signOut} 
                  size="sm" 
                  variant="destructive"
                  title="Desconectar do Google Drive"
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vídeos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/20 border-border/50"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 bg-secondary/20 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais Recente</SelectItem>
                  <SelectItem value="oldest">Mais Antigo</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="size">Tamanho</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full md:w-48 bg-secondary/20 border-border/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-gradient-card border-border/50">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Grid */}
      {isAuthenticated && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card 
              key={video.id} 
              className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow/20 transition-all duration-300 group"
            >
              <div className="relative">
                <div className="aspect-video bg-secondary/20 rounded-t-lg overflow-hidden flex items-center justify-center">
                  <Video className="w-12 h-12 text-muted-foreground/50" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button size="sm" className="bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild>
                      <a href={video.webViewLink} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {video.mimeType.split('/')[1]?.toUpperCase() || 'VIDEO'}
                  </Badge>
                </div>
                
                {video.videoMediaMetadata?.durationMillis && (
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    {formatDuration(video.videoMediaMetadata.durationMillis)}
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2" title={video.name}>
                  {video.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-4 h-4" />
                    {formatFileSize(video.size)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(video.modifiedTime)}
                  </div>
                </div>
                
                {video.videoMediaMetadata && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {video.videoMediaMetadata.width && video.videoMediaMetadata.height && (
                      <span>
                        {video.videoMediaMetadata.width} × {video.videoMediaMetadata.height}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={video.webViewLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visualizar
                    </a>
                  </Button>
                  
                  {video.webContentLink && (
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <a href={video.webContentLink} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {isAuthenticated && !loading && filteredVideos.length === 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardContent className="p-12 text-center">
            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchQuery || filterBy !== 'all' 
                ? 'Nenhum vídeo encontrado com os critérios de busca.' 
                : 'Nenhum vídeo encontrado no Google Drive.'
              }
            </p>
            {(searchQuery || filterBy !== 'all') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};