import { useState, useCallback } from 'react';

interface ScriptOptions {
  theme?: string;
  duration?: string;
  style?: string;
  language?: string;
}

interface GeneratedScript {
  script: string;
  options: ScriptOptions;
  metadata: {
    tokensUsed: number;
    generatedAt: string;
    estimatedCost: number;
  };
}

interface ScriptGenerationResponse {
  success: boolean;
  requestId: string;
  script: string;
  options: ScriptOptions;
  metadata: {
    tokensUsed: number;
    generatedAt: string;
    estimatedCost: number;
  };
}

const BACKEND_URL = 'http://localhost:3001/api';

export const useScriptGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateScript = useCallback(async (
    prompt: string, 
    openaiApiKey: string,
    options: ScriptOptions = {}
  ): Promise<GeneratedScript | null> => {
    if (!prompt || prompt.trim().length === 0) {
      setError('Prompt é obrigatório');
      return null;
    }

    if (!openaiApiKey || openaiApiKey.trim().length === 0) {
      setError('Chave da API OpenAI é obrigatória');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🤖 Gerando roteiro com GPT...');
      console.log('📝 Prompt:', prompt.substring(0, 100) + '...');
      console.log('⚙️ Opções:', options);

      const response = await fetch(`${BACKEND_URL}/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          openaiApiKey,
          ...options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result: ScriptGenerationResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.script || 'Falha na geração do roteiro');
      }

      console.log('✅ Roteiro gerado com sucesso!');
      console.log('📊 Tokens utilizados:', result.metadata.tokensUsed);
      console.log('💰 Custo estimado: $', result.metadata.estimatedCost);

      const generatedScript: GeneratedScript = {
        script: result.script,
        options: result.options,
        metadata: result.metadata
      };

      // Adiciona à lista de roteiros gerados
      setGeneratedScripts(prev => [generatedScript, ...prev]);

      return generatedScript;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro na geração do roteiro:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearScripts = useCallback(() => {
    setGeneratedScripts([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Opções pré-definidas
  const themeOptions = [
    'motivacional',
    'educativo',
    'entretenimento',
    'lifestyle',
    'tecnologia',
    'saúde e bem-estar',
    'negócios',
    'viagem',
    'culinária',
    'moda',
    'humor',
    'inspiracional'
  ];

  const durationOptions = [
    '15 segundos',
    '30 segundos',
    '60 segundos',
    '90 segundos',
    '2 minutos',
    '3 minutos'
  ];

  const styleOptions = [
    'casual e engajante',
    'profissional e sério',
    'divertido e descontraído',
    'educativo e informativo',
    'inspiracional e motivacional',
    'misterioso e intrigante',
    'urgente e chamativo',
    'íntimo e pessoal'
  ];

  return {
    // Estado
    isGenerating,
    generatedScripts,
    error,
    
    // Ações
    generateScript,
    clearScripts,
    clearError,
    
    // Opções disponíveis
    themeOptions,
    durationOptions,
    styleOptions,
    
    // Estatísticas
    totalScripts: generatedScripts.length,
    totalTokensUsed: generatedScripts.reduce((sum, script) => sum + script.metadata.tokensUsed, 0),
    totalEstimatedCost: generatedScripts.reduce((sum, script) => sum + script.metadata.estimatedCost, 0)
  };
};
