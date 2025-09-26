import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Download, Trash2, RefreshCw, HardDrive, FileVideo, FileAudio, Clock, Calendar } from 'lucide-react';

interface FileInfo {
  filename: string;
  downloadUrl: string;
  fileSize: number;
  fileSizeMB: number;
  fileType: string;
  category: string;
  createdAt: string;
  modifiedAt: string;
  ageInHours: number;
}

interface GroupedFiles {
  with_background_music: FileInfo[];
  with_narration: FileInfo[];
  concatenated: FileInfo[];
  audio: FileInfo[];
  video: FileInfo[];
  other: FileInfo[];
}

interface FileSummary {
  totalFiles: number;
  totalSizeMB: number;
  categories: {
    with_background_music: number;
    with_narration: number;
    concatenated: number;
    audio: number;
    video: number;
    other: number;
  };
}

const BACKEND_URL = 'http://localhost:3001/api';

export const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [groupedFiles, setGroupedFiles] = useState<GroupedFiles | null>(null);
  const [summary, setSummary] = useState<FileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch files from backend
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/files`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
        setGroupedFiles(data.grouped);
        setSummary(data.summary);
      } else {
        throw new Error(data.message || 'Failed to fetch files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a specific file
  const deleteFile = useCallback(async (filename: string) => {
    if (!confirm(`Tem certeza que deseja deletar o arquivo "${filename}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/files/${filename}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Arquivo "${filename}" deletado com sucesso!`);
        fetchFiles(); // Refresh the list
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to delete file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting file');
    }
  }, [fetchFiles]);

  // Clean up old files
  const cleanupOldFiles = useCallback(async (olderThanHours: number = 24) => {
    if (!confirm(`Tem certeza que deseja deletar todos os arquivos com mais de ${olderThanHours} horas?`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ olderThanHours })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Limpeza concluída: ${data.summary.filesDeleted} arquivos deletados (${data.summary.totalSizeDeletedMB}MB liberados)`);
        fetchFiles(); // Refresh the list
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error(data.message || 'Failed to cleanup files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during cleanup');
    }
  }, [fetchFiles]);

  // Download file
  const downloadFile = useCallback((filename: string) => {
    const downloadUrl = `${BACKEND_URL.replace('/api', '')}/api/download/${filename}`;
    window.open(downloadUrl, '_blank');
  }, []);

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Format file size
  const formatFileSize = (sizeMB: number) => {
    if (sizeMB < 1) {
      return `${Math.round(sizeMB * 1024)}KB`;
    }
    return `${sizeMB}MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'with_background_music':
      case 'with_narration':
      case 'concatenated':
      case 'video':
        return <FileVideo className="w-4 h-4" />;
      case 'audio':
        return <FileAudio className="w-4 h-4" />;
      default:
        return <HardDrive className="w-4 h-4" />;
    }
  };

  // Render file card
  const renderFileCard = (file: FileInfo) => (
    <Card key={file.filename} className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getCategoryIcon(file.category)}
              <h4 className="font-medium text-sm truncate" title={file.filename}>
                {file.filename}
              </h4>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formatFileSize(file.fileSizeMB)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {file.ageInHours.toFixed(1)}h
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(file.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadFile(file.filename)}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteFile(file.filename)}
              title="Deletar"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Gerenciador de Arquivos
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os vídeos e áudios gerados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFiles}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cleanupOldFiles(24)}
                className="text-orange-600 hover:text-orange-700"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Antigos (24h+)
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Summary */}
        {summary && (
          <CardContent className="border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{summary.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Arquivos Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{summary.totalSizeMB.toFixed(1)}MB</div>
                <div className="text-sm text-muted-foreground">Espaço Total</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* All Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              Todos os Arquivos ({files.length})
            </CardTitle>
            <CardDescription>
              Lista completa de vídeos e áudios gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map(renderFileCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <div>Carregando arquivos...</div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && files.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <HardDrive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
            <p className="text-muted-foreground">
              Gere alguns vídeos para ver os arquivos disponíveis aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileManager;
