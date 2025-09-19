-- Criação da tabela user_credentials
-- Data: 2025-09-19
-- Descrição: Tabela para armazenar credenciais de APIs dos usuários

-- 1. Criar a tabela user_credentials
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
    open_ai_api_key TEXT,
    eleven_labs_api_key TEXT,
    youtube_api_key TEXT,
    drive_client_id TEXT,
    drive_client_secret TEXT,
    drive_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança
-- Política para leitura: usuários podem ver apenas suas próprias credenciais
CREATE POLICY "Users can view own credentials" ON public.user_credentials
    FOR SELECT USING (auth.uid() = user_id);

-- Política para inserção: usuários podem criar apenas suas próprias credenciais
CREATE POLICY "Users can insert own credentials" ON public.user_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualização: usuários podem atualizar apenas suas próprias credenciais
CREATE POLICY "Users can update own credentials" ON public.user_credentials
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para exclusão: usuários podem deletar apenas suas próprias credenciais
CREATE POLICY "Users can delete own credentials" ON public.user_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Criar trigger para atualizar updated_at automaticamente (reutilizar a função existente)
CREATE TRIGGER on_user_credentials_updated
    BEFORE UPDATE ON public.user_credentials
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS user_credentials_user_id_idx ON public.user_credentials(user_id);
