import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useScriptGenerator } from "@/hooks/useScriptGenerator";
import { useCredentials } from "@/hooks/useCredentials";
import { 
  Sparkles, 
  FileText, 
  Loader, 
  Copy, 
  Trash2,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap
} from "lucide-react";

export const ScriptGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("motivacional");
  const [selectedDuration, setSelectedDuration] = useState("60 segundos");
  const [selectedStyle, setSelectedStyle] = useState("casual e engajante");

  // Get OpenAI API key from user credentials
  const { getOpenAIKey } = useCredentials();

  const {
    isGenerating,
    generatedScripts,
    error,
    generateScript,
    clearScripts,
    clearError,
    themeOptions,
    durationOptions,
    styleOptions,
    totalScripts,
    totalTokensUsed,
    totalEstimatedCost
  } = useScriptGenerator();

  const handleGenerateScript = async () => {
    if (!prompt.trim()) return;

    const openaiApiKey = getOpenAIKey();
    if (!openaiApiKey) {
      // Handle missing API key
      console.error('OpenAI API key not found in credentials');
      return;
    }

    await generateScript(prompt, openaiApiKey, {
      theme: selectedTheme,
      duration: selectedDuration,
      style: selectedStyle,
      language: 'português brasileiro'
    });
  };

  const copyScriptToClipboard = (script: string) => {
    navigator.clipboard.writeText(script);
    // Você pode adicionar uma notificação aqui
  };

  const formatScript = (script: string) => {
    // Converte quebras de linha em parágrafos para melhor visualização
    return script.split('\n').map((line, index) => (
      <p key={index} className={`${line.trim() === '' ? 'mb-2' : 'mb-1'}`}>
        {line.trim() === '' ? '\u00A0' : line}
      </p>
    ));
  };

  return (
    <div className="space-y-8">
      {/* Gerador de Roteiro */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerador de Roteiros com GPT
          </CardTitle>
          <CardDescription>
            Crie roteiros personalizados para seus vídeos usando inteligência artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Principal */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Ideia ou Contexto do Vídeo</Label>
            <Textarea
              id="prompt"
              placeholder="Descreva a ideia principal do seu vídeo... Ex: 'Como acordar mais cedo e ser mais produtivo', 'Receita rápida de bolo de chocolate', 'Dicas para organizar o home office'..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-secondary/20 border-border/50 min-h-[100px]"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Seja específico para melhores resultados</span>
              <span>{prompt.length}/500</span>
            </div>
          </div>

          {/* Opções de Personalização */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="bg-secondary/20 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="bg-secondary/20 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="bg-secondary/20 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearError}
                className="ml-auto"
              >
                ✕
              </Button>
            </div>
          )}

          {/* Botão Gerar */}
          <div className="flex gap-3">
            <Button 
              className="bg-gradient-primary hover:bg-gradient-primary/90 flex-1"
              onClick={handleGenerateScript}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Roteiro...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Roteiro com GPT
                </>
              )}
            </Button>
            
            {generatedScripts.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearScripts}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {totalScripts > 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Estatísticas de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="font-semibold">{totalScripts}</div>
                  <div className="text-sm text-muted-foreground">Roteiros Gerados</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="font-semibold">{totalTokensUsed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Tokens Utilizados</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <div className="font-semibold">${totalEstimatedCost.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">Custo Estimado</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roteiros Gerados */}
      {generatedScripts.length > 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Roteiros Gerados ({generatedScripts.length})
            </CardTitle>
            <CardDescription>
              Seus roteiros criados com GPT estão prontos para usar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedScripts.map((scriptData, index) => (
                <div 
                  key={index}
                  className="border border-border/50 rounded-lg p-6 bg-secondary/10"
                >
                  {/* Cabeçalho do Roteiro */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {scriptData.options.duration}
                      </Badge>
                      <Badge variant="outline">
                        {scriptData.options.theme}
                      </Badge>
                      <Badge variant="outline">
                        {scriptData.options.style}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {scriptData.metadata.tokensUsed} tokens
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyScriptToClipboard(scriptData.script)}
                        className="gap-2"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </Button>
                    </div>
                  </div>

                  {/* Conteúdo do Roteiro */}
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {formatScript(scriptData.script)}
                      </div>
                    </div>
                  </div>

                  {/* Metadados */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Gerado em: {new Date(scriptData.metadata.generatedAt).toLocaleString()}</span>
                      <span>Custo: ${scriptData.metadata.estimatedCost.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-xs">Pronto para usar</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
