export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      Agent_AntiReembolso: {
        Row: {
          created_at: string
          email: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          sessionId: string | null
          status_conversa: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          sessionId?: string | null
          status_conversa?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          sessionId?: string | null
          status_conversa?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      Agent_Avaliador: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          sessionId: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          sessionId?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          sessionId?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      Agent_Suplemento: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          financialDetails: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          proposalId: string | null
          sessionId: string | null
          status_ia: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      avaliacao: {
        Row: {
          cliente_id: number
          content_type_id: number
          created_at: string
          descricao: string | null
          id: number
          object_id: number
          rating: number
        }
        Insert: {
          cliente_id: number
          content_type_id: number
          created_at?: string
          descricao?: string | null
          id?: number
          object_id: number
          rating: number
        }
        Update: {
          cliente_id?: number
          content_type_id?: number
          created_at?: string
          descricao?: string | null
          id?: number
          object_id?: number
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
        ]
      }
      bairro: {
        Row: {
          cidade_id: number
          id: number
          nome: string
        }
        Insert: {
          cidade_id: number
          id?: number
          nome: string
        }
        Update: {
          cidade_id?: number
          id?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "bairro_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidade"
            referencedColumns: ["id"]
          },
        ]
      }
      banner: {
        Row: {
          foto: string
          id: number
          nome: string
        }
        Insert: {
          foto?: string
          id?: number
          nome: string
        }
        Update: {
          foto?: string
          id?: number
          nome?: string
        }
        Relationships: []
      }
      casas: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          sessionId: string | null
          status_ia: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      casas_rn: {
        Row: {
          bathrooms: string | null
          bedrooms: string | null
          full_address: string | null
          id: number
          images: string | null
          listing_title: string
          phone: string | null
          price: string | null
          property_description: string | null
          property_type: string | null
          whatsapp: string | null
        }
        Insert: {
          bathrooms?: string | null
          bedrooms?: string | null
          full_address?: string | null
          id?: number
          images?: string | null
          listing_title: string
          phone?: string | null
          price?: string | null
          property_description?: string | null
          property_type?: string | null
          whatsapp?: string | null
        }
        Update: {
          bathrooms?: string | null
          bedrooms?: string | null
          full_address?: string | null
          id?: number
          images?: string | null
          listing_title?: string
          phone?: string | null
          price?: string | null
          property_description?: string | null
          property_type?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      cep: {
        Row: {
          codigo: string
          id: number
        }
        Insert: {
          codigo: string
          id?: number
        }
        Update: {
          codigo?: string
          id?: number
        }
        Relationships: []
      }
      cidade: {
        Row: {
          estado_id: number
          id: number
          nome: string
        }
        Insert: {
          estado_id: number
          id?: number
          nome: string
        }
        Update: {
          estado_id?: number
          id?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "cidade_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estado"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente: {
        Row: {
          bairro_id: number | null
          cep: string | null
          cidade_id: number | null
          custom_user_ptr_id: number
          estado_id: number | null
          foto: string | null
          gender: string | null
          is_active: boolean
          numero: string | null
          rua: string | null
        }
        Insert: {
          bairro_id?: number | null
          cep?: string | null
          cidade_id?: number | null
          custom_user_ptr_id: number
          estado_id?: number | null
          foto?: string | null
          gender?: string | null
          is_active?: boolean
          numero?: string | null
          rua?: string | null
        }
        Update: {
          bairro_id?: number | null
          cep?: string | null
          cidade_id?: number | null
          custom_user_ptr_id?: number
          estado_id?: number | null
          foto?: string | null
          gender?: string | null
          is_active?: boolean
          numero?: string | null
          rua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_custom_user_ptr_id_fkey"
            columns: ["custom_user_ptr_id"]
            isOneToOne: true
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estado"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      clinica: {
        Row: {
          custom_user_ptr_id: number
          descricao: string | null
          foto: string | null
          is_active: boolean
        }
        Insert: {
          custom_user_ptr_id: number
          descricao?: string | null
          foto?: string | null
          is_active?: boolean
        }
        Update: {
          custom_user_ptr_id?: number
          descricao?: string | null
          foto?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "clinica_custom_user_ptr_id_fkey"
            columns: ["custom_user_ptr_id"]
            isOneToOne: true
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_bairros: {
        Row: {
          bairro_id: number
          clinica_id: number
        }
        Insert: {
          bairro_id: number
          clinica_id: number
        }
        Update: {
          bairro_id?: number
          clinica_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_bairros_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinica_bairros_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      clinica_ceps: {
        Row: {
          cep_id: number
          clinica_id: number
        }
        Insert: {
          cep_id: number
          clinica_id: number
        }
        Update: {
          cep_id?: number
          clinica_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_ceps_cep_id_fkey"
            columns: ["cep_id"]
            isOneToOne: false
            referencedRelation: "cep"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinica_ceps_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      clinica_cidades: {
        Row: {
          cidade_id: number
          clinica_id: number
        }
        Insert: {
          cidade_id: number
          clinica_id: number
        }
        Update: {
          cidade_id?: number
          clinica_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_cidades_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinica_cidades_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      clinica_convenios: {
        Row: {
          clinica_id: number
          convenio_id: number
        }
        Insert: {
          clinica_id: number
          convenio_id: number
        }
        Update: {
          clinica_id?: number
          convenio_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_convenios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_convenios_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenio"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_enderecos: {
        Row: {
          clinica_id: number
          endereco_id: number
        }
        Insert: {
          clinica_id: number
          endereco_id: number
        }
        Update: {
          clinica_id?: number
          endereco_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_enderecos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_enderecos_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "endereco"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_especialidades: {
        Row: {
          clinica_id: number
          especialidade_id: number
        }
        Insert: {
          clinica_id: number
          especialidade_id: number
        }
        Update: {
          clinica_id?: number
          especialidade_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_especialidades_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_especialidades_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidade"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_estados: {
        Row: {
          clinica_id: number
          estado_id: number
        }
        Insert: {
          clinica_id: number
          estado_id: number
        }
        Update: {
          clinica_id?: number
          estado_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_estados_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_estados_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estado"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_galeria: {
        Row: {
          clinica_id: number
          foto_id: number
        }
        Insert: {
          clinica_id: number
          foto_id: number
        }
        Update: {
          clinica_id?: number
          foto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_galeria_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_galeria_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "foto"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_idiomas: {
        Row: {
          clinica_id: number
          idioma_id: number
        }
        Insert: {
          clinica_id: number
          idioma_id: number
        }
        Update: {
          clinica_id?: number
          idioma_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_idiomas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_idiomas_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idioma"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_perguntas: {
        Row: {
          clinica_id: number
          pergunta_resposta_id: number
        }
        Insert: {
          clinica_id: number
          pergunta_resposta_id: number
        }
        Update: {
          clinica_id?: number
          pergunta_resposta_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_perguntas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_perguntas_pergunta_resposta_id_fkey"
            columns: ["pergunta_resposta_id"]
            isOneToOne: false
            referencedRelation: "pergunta_resposta"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_servicos: {
        Row: {
          clinica_id: number
          servico_id: number
        }
        Insert: {
          clinica_id: number
          servico_id: number
        }
        Update: {
          clinica_id?: number
          servico_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_servicos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servico"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_tipo_clinica: {
        Row: {
          clinica_id: number
          tipo_clinica_id: number
        }
        Insert: {
          clinica_id: number
          tipo_clinica_id: number
        }
        Update: {
          clinica_id?: number
          tipo_clinica_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_tipo_clinica_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_tipo_clinica_tipo_clinica_id_fkey"
            columns: ["tipo_clinica_id"]
            isOneToOne: false
            referencedRelation: "tipo_clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_tipo_profissional: {
        Row: {
          clinica_id: number
          tipo_profissional_id: number
        }
        Insert: {
          clinica_id: number
          tipo_profissional_id: number
        }
        Update: {
          clinica_id?: number
          tipo_profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinica_tipo_profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "clinica_tipo_profissional_tipo_profissional_id_fkey"
            columns: ["tipo_profissional_id"]
            isOneToOne: false
            referencedRelation: "tipo_profissional"
            referencedColumns: ["id"]
          },
        ]
      }
      convenio: {
        Row: {
          id: number
          nome: string
          tipo_profissional: string | null
        }
        Insert: {
          id?: number
          nome: string
          tipo_profissional?: string | null
        }
        Update: {
          id?: number
          nome?: string
          tipo_profissional?: string | null
        }
        Relationships: []
      }
      custom_user: {
        Row: {
          date_joined: string
          email: string
          email_verification_token: string
          email_verified: boolean
          id: number
          is_staff: boolean
          is_superuser: boolean
          last_login: string | null
          nome: string | null
          password: string
          sobrenome: string | null
          stripe_customer_id: string | null
          username: string
        }
        Insert: {
          date_joined?: string
          email: string
          email_verification_token?: string
          email_verified?: boolean
          id?: number
          is_staff?: boolean
          is_superuser?: boolean
          last_login?: string | null
          nome?: string | null
          password: string
          sobrenome?: string | null
          stripe_customer_id?: string | null
          username: string
        }
        Update: {
          date_joined?: string
          email?: string
          email_verification_token?: string
          email_verified?: boolean
          id?: number
          is_staff?: boolean
          is_superuser?: boolean
          last_login?: string | null
          nome?: string | null
          password?: string
          sobrenome?: string | null
          stripe_customer_id?: string | null
          username?: string
        }
        Relationships: []
      }
      daily_meals: {
        Row: {
          created_at: string | null
          id: string
          meal_type: string | null
          recipe_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meal_type?: string | null
          recipe_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meal_type?: string | null
          recipe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      depoimento: {
        Row: {
          descricao: string
          id: number
          profissional_id: number | null
          rating: number
        }
        Insert: {
          descricao: string
          id?: number
          profissional_id?: number | null
          rating: number
        }
        Update: {
          descricao?: string
          id?: number
          profissional_id?: number | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "depoimento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      endereco: {
        Row: {
          bairro_id: number
          cep_id: number
          cidade_id: number
          complemento: string | null
          estado_id: number
          id: number
          latitude: number | null
          longitude: number | null
          numero: number | null
          rua: string
        }
        Insert: {
          bairro_id: number
          cep_id: number
          cidade_id: number
          complemento?: string | null
          estado_id: number
          id?: number
          latitude?: number | null
          longitude?: number | null
          numero?: number | null
          rua: string
        }
        Update: {
          bairro_id?: number
          cep_id?: number
          cidade_id?: number
          complemento?: string | null
          estado_id?: number
          id?: number
          latitude?: number | null
          longitude?: number | null
          numero?: number | null
          rua?: string
        }
        Relationships: [
          {
            foreignKeyName: "endereco_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endereco_cep_id_fkey"
            columns: ["cep_id"]
            isOneToOne: false
            referencedRelation: "cep"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endereco_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endereco_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estado"
            referencedColumns: ["id"]
          },
        ]
      }
      engie_depoimentos: {
        Row: {
          depoimento_1: string
          depoimento_2: string | null
          depoimento_3: string | null
          depoimento_4: string | null
          depoimento_5: string | null
          depoimento_6: string | null
          id: number
        }
        Insert: {
          depoimento_1: string
          depoimento_2?: string | null
          depoimento_3?: string | null
          depoimento_4?: string | null
          depoimento_5?: string | null
          depoimento_6?: string | null
          id?: number
        }
        Update: {
          depoimento_1?: string
          depoimento_2?: string | null
          depoimento_3?: string | null
          depoimento_4?: string | null
          depoimento_5?: string | null
          depoimento_6?: string | null
          id?: number
        }
        Relationships: []
      }
      engie_diferenciais: {
        Row: {
          id: number
          subtitulo_1: string | null
          subtitulo_2: string | null
          subtitulo_3: string | null
          texto_1: string | null
          texto_2: string | null
          texto_3: string | null
          titulo: string | null
        }
        Insert: {
          id?: number
          subtitulo_1?: string | null
          subtitulo_2?: string | null
          subtitulo_3?: string | null
          texto_1?: string | null
          texto_2?: string | null
          texto_3?: string | null
          titulo?: string | null
        }
        Update: {
          id?: number
          subtitulo_1?: string | null
          subtitulo_2?: string | null
          subtitulo_3?: string | null
          texto_1?: string | null
          texto_2?: string | null
          texto_3?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      engie_estatisticas: {
        Row: {
          co2_evitado_sufixo: string | null
          co2_evitado_titulo: string | null
          co2_evitado_valor: string | null
          created_at: string
          id: number
          potencia_instalada_sufixo: string | null
          potencia_instalada_titulo: string | null
          potencia_instalada_valor: string | null
          projetos_instalados_sufixo: string | null
          projetos_instalados_titulo: string | null
          projetos_instalados_valor: string | null
        }
        Insert: {
          co2_evitado_sufixo?: string | null
          co2_evitado_titulo?: string | null
          co2_evitado_valor?: string | null
          created_at?: string
          id?: number
          potencia_instalada_sufixo?: string | null
          potencia_instalada_titulo?: string | null
          potencia_instalada_valor?: string | null
          projetos_instalados_sufixo?: string | null
          projetos_instalados_titulo?: string | null
          projetos_instalados_valor?: string | null
        }
        Update: {
          co2_evitado_sufixo?: string | null
          co2_evitado_titulo?: string | null
          co2_evitado_valor?: string | null
          created_at?: string
          id?: number
          potencia_instalada_sufixo?: string | null
          potencia_instalada_titulo?: string | null
          potencia_instalada_valor?: string | null
          projetos_instalados_sufixo?: string | null
          projetos_instalados_titulo?: string | null
          projetos_instalados_valor?: string | null
        }
        Relationships: []
      }
      engie_footer: {
        Row: {
          contato_telefone: string | null
          copyright_texto: string | null
          created_at: string
          descricao: string | null
          id: number
          link_facebook: string | null
          link_instagram: string | null
          link_linkedin: string | null
          link_privacidade_texto: string | null
          link_privacidade_url: string | null
          link_termos_texto: string | null
          link_termos_url: string | null
          link_youtube: string | null
          logo_url: string | null
          newsletter_texto: string | null
          newsletter_titulo: string | null
          servico_1_texto: string | null
          servico_2_texto: string | null
          servico_3_texto: string | null
          servico_4_texto: string | null
          servico_5_texto: string | null
        }
        Insert: {
          contato_telefone?: string | null
          copyright_texto?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_facebook?: string | null
          link_instagram?: string | null
          link_linkedin?: string | null
          link_privacidade_texto?: string | null
          link_privacidade_url?: string | null
          link_termos_texto?: string | null
          link_termos_url?: string | null
          link_youtube?: string | null
          logo_url?: string | null
          newsletter_texto?: string | null
          newsletter_titulo?: string | null
          servico_1_texto?: string | null
          servico_2_texto?: string | null
          servico_3_texto?: string | null
          servico_4_texto?: string | null
          servico_5_texto?: string | null
        }
        Update: {
          contato_telefone?: string | null
          copyright_texto?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_facebook?: string | null
          link_instagram?: string | null
          link_linkedin?: string | null
          link_privacidade_texto?: string | null
          link_privacidade_url?: string | null
          link_termos_texto?: string | null
          link_termos_url?: string | null
          link_youtube?: string | null
          logo_url?: string | null
          newsletter_texto?: string | null
          newsletter_titulo?: string | null
          servico_1_texto?: string | null
          servico_2_texto?: string | null
          servico_3_texto?: string | null
          servico_4_texto?: string | null
          servico_5_texto?: string | null
        }
        Relationships: []
      }
      engie_header: {
        Row: {
          botao_texto: string | null
          botao_url: string | null
          created_at: string
          id: number
          link_1_texto: string | null
          link_1_url: string | null
          link_2_texto: string | null
          link_2_url: string | null
          link_3_texto: string | null
          link_3_url: string | null
          link_4_texto: string | null
          link_4_url: string | null
          link_5_texto: string | null
          link_5_url: string | null
          logo_url: string | null
        }
        Insert: {
          botao_texto?: string | null
          botao_url?: string | null
          created_at?: string
          id?: number
          link_1_texto?: string | null
          link_1_url?: string | null
          link_2_texto?: string | null
          link_2_url?: string | null
          link_3_texto?: string | null
          link_3_url?: string | null
          link_4_texto?: string | null
          link_4_url?: string | null
          link_5_texto?: string | null
          link_5_url?: string | null
          logo_url?: string | null
        }
        Update: {
          botao_texto?: string | null
          botao_url?: string | null
          created_at?: string
          id?: number
          link_1_texto?: string | null
          link_1_url?: string | null
          link_2_texto?: string | null
          link_2_url?: string | null
          link_3_texto?: string | null
          link_3_url?: string | null
          link_4_texto?: string | null
          link_4_url?: string | null
          link_5_texto?: string | null
          link_5_url?: string | null
          logo_url?: string | null
        }
        Relationships: []
      }
      engie_hero: {
        Row: {
          background_image_url: string | null
          botao_principal_texto: string | null
          botao_principal_url: string | null
          botao_secundario_texto: string | null
          botao_secundario_url: string | null
          created_at: string
          descricao_1: string | null
          descricao_2: string | null
          descricao_3: string | null
          descricao_4: string | null
          descricao_5: string | null
          descricao_6: string | null
          id: number
          titulo: string | null
        }
        Insert: {
          background_image_url?: string | null
          botao_principal_texto?: string | null
          botao_principal_url?: string | null
          botao_secundario_texto?: string | null
          botao_secundario_url?: string | null
          created_at?: string
          descricao_1?: string | null
          descricao_2?: string | null
          descricao_3?: string | null
          descricao_4?: string | null
          descricao_5?: string | null
          descricao_6?: string | null
          id?: number
          titulo?: string | null
        }
        Update: {
          background_image_url?: string | null
          botao_principal_texto?: string | null
          botao_principal_url?: string | null
          botao_secundario_texto?: string | null
          botao_secundario_url?: string | null
          created_at?: string
          descricao_1?: string | null
          descricao_2?: string | null
          descricao_3?: string | null
          descricao_4?: string | null
          descricao_5?: string | null
          descricao_6?: string | null
          id?: number
          titulo?: string | null
        }
        Relationships: []
      }
      engie_projetos: {
        Row: {
          id: number
          imagem_1: string
          imagem_2: string | null
          imagem_3: string | null
          imagem_4: string | null
          imagem_5: string | null
          imagem_6: string | null
        }
        Insert: {
          id?: number
          imagem_1: string
          imagem_2?: string | null
          imagem_3?: string | null
          imagem_4?: string | null
          imagem_5?: string | null
          imagem_6?: string | null
        }
        Update: {
          id?: number
          imagem_1?: string
          imagem_2?: string | null
          imagem_3?: string | null
          imagem_4?: string | null
          imagem_5?: string | null
          imagem_6?: string | null
        }
        Relationships: []
      }
      engie_solucoes: {
        Row: {
          descricao_1: string | null
          descricao_2: string | null
          descricao_3: string | null
          id: number
          subtitulo_frente1: string | null
          subtitulo_frente2: string | null
          subtitulo_frente3: string | null
          subtitulo_tras1: string | null
          subtitulo_tras2: string | null
          subtitulo_tras3: string | null
          titulo: string
        }
        Insert: {
          descricao_1?: string | null
          descricao_2?: string | null
          descricao_3?: string | null
          id?: number
          subtitulo_frente1?: string | null
          subtitulo_frente2?: string | null
          subtitulo_frente3?: string | null
          subtitulo_tras1?: string | null
          subtitulo_tras2?: string | null
          subtitulo_tras3?: string | null
          titulo: string
        }
        Update: {
          descricao_1?: string | null
          descricao_2?: string | null
          descricao_3?: string | null
          id?: number
          subtitulo_frente1?: string | null
          subtitulo_frente2?: string | null
          subtitulo_frente3?: string | null
          subtitulo_tras1?: string | null
          subtitulo_tras2?: string | null
          subtitulo_tras3?: string | null
          titulo?: string
        }
        Relationships: []
      }
      engie_visao: {
        Row: {
          id: number
          imagem: string | null
          texto: string | null
          titulo: string
        }
        Insert: {
          id?: number
          imagem?: string | null
          texto?: string | null
          titulo: string
        }
        Update: {
          id?: number
          imagem?: string | null
          texto?: string | null
          titulo?: string
        }
        Relationships: []
      }
      especialidade: {
        Row: {
          id: number
          nome: string
          tipo_profissional: string | null
        }
        Insert: {
          id?: number
          nome: string
          tipo_profissional?: string | null
        }
        Update: {
          id?: number
          nome?: string
          tipo_profissional?: string | null
        }
        Relationships: []
      }
      estado: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      foto: {
        Row: {
          clinica_id: number | null
          descricao: string | null
          id: number
          imagem: string | null
          profissional_id: number | null
        }
        Insert: {
          clinica_id?: number | null
          descricao?: string | null
          id?: number
          imagem?: string | null
          profissional_id?: number | null
        }
        Update: {
          clinica_id?: number | null
          descricao?: string | null
          id?: number
          imagem?: string | null
          profissional_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foto_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foto_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_alfredo1: {
        Row: {
          categoria: string | null
          conta_bancaria: string | null
          data: string
          forma_pagamento: string | null
          id: number
          nome_gasto: string | null
          valor_R$: string | null
        }
        Insert: {
          categoria?: string | null
          conta_bancaria?: string | null
          data?: string
          forma_pagamento?: string | null
          id?: number
          nome_gasto?: string | null
          valor_R$?: string | null
        }
        Update: {
          categoria?: string | null
          conta_bancaria?: string | null
          data?: string
          forma_pagamento?: string | null
          id?: number
          nome_gasto?: string | null
          valor_R$?: string | null
        }
        Relationships: []
      }
      giacomo: {
        Row: {
          aluguel: string | null
          data: string | null
          fast_food: string | null
          forma_pagamento: string | null
          id: number
          observacoes: string | null
          outros: string | null
          qual_cartao: string | null
          salario: string | null
          tipo: string | null
          valor: string | null
        }
        Insert: {
          aluguel?: string | null
          data?: string | null
          fast_food?: string | null
          forma_pagamento?: string | null
          id?: number
          observacoes?: string | null
          outros?: string | null
          qual_cartao?: string | null
          salario?: string | null
          tipo?: string | null
          valor?: string | null
        }
        Update: {
          aluguel?: string | null
          data?: string | null
          fast_food?: string | null
          forma_pagamento?: string | null
          id?: number
          observacoes?: string | null
          outros?: string | null
          qual_cartao?: string | null
          salario?: string | null
          tipo?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      Giacomo_Assistente_Financeiro: {
        Row: {
          created_at: string
          gasto_delivery: string | null
          gasto_essencial: string | null
          gasto_mensal: string | null
          gasto_semanal: string | null
          id: number
          nome: string | null
          renda: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          gasto_delivery?: string | null
          gasto_essencial?: string | null
          gasto_mensal?: string | null
          gasto_semanal?: string | null
          id?: number
          nome?: string | null
          renda?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          gasto_delivery?: string | null
          gasto_essencial?: string | null
          gasto_mensal?: string | null
          gasto_semanal?: string | null
          id?: number
          nome?: string | null
          renda?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      giacomo_ia_financeiro: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          gasto_delivery: string | null
          gasto_essencial: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          renda: string | null
          sessionId: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          gasto_delivery?: string | null
          gasto_essencial?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          renda?: string | null
          sessionId?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          gasto_delivery?: string | null
          gasto_essencial?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          renda?: string | null
          sessionId?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      glucose_walk: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          references_text: string | null
          text: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          references_text?: string | null
          text: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          references_text?: string | null
          text?: string
          title?: string
        }
        Relationships: []
      }
      IA_nutricionista: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          financialDetails: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          proposalId: string | null
          sessionId: string | null
          status_ia: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      idioma: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      iwannasleep: {
        Row: {
          id: number
          link_imagem: string | null
          nome_produto: string | null
          preco_produto: number | null
          tipos_produtos: string | null
        }
        Insert: {
          id: number
          link_imagem?: string | null
          nome_produto?: string | null
          preco_produto?: number | null
          tipos_produtos?: string | null
        }
        Update: {
          id?: number
          link_imagem?: string | null
          nome_produto?: string | null
          preco_produto?: number | null
          tipos_produtos?: string | null
        }
        Relationships: []
      }
      "landing page": {
        Row: {
          data: string
          id: number
          nome: string | null
          pergunta_4: string | null
          pergunta1: string | null
          pergunta2: string | null
          pergunta3: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          data?: string
          id?: number
          nome?: string | null
          pergunta_4?: string | null
          pergunta1?: string | null
          pergunta2?: string | null
          pergunta3?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          data?: string
          id?: number
          nome?: string | null
          pergunta_4?: string | null
          pergunta1?: string | null
          pergunta2?: string | null
          pergunta3?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      light_activation: {
        Row: {
          best_time: string | null
          created_at: string | null
          duration: string | null
          goal: string | null
          id: string
          image_url: string | null
          steps: string | null
          title: string
        }
        Insert: {
          best_time?: string | null
          created_at?: string | null
          duration?: string | null
          goal?: string | null
          id?: string
          image_url?: string | null
          steps?: string | null
          title: string
        }
        Update: {
          best_time?: string | null
          created_at?: string | null
          duration?: string | null
          goal?: string | null
          id?: string
          image_url?: string | null
          steps?: string | null
          title?: string
        }
        Relationships: []
      }
      paulo_ia: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          financialDetails: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          proposalId: string | null
          sessionId: string | null
          status_ia: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      pergunta_resposta: {
        Row: {
          cliente_id: number | null
          created_at: string
          id: number
          pergunta: string | null
          resposta: string | null
        }
        Insert: {
          cliente_id?: number | null
          created_at?: string
          id?: number
          pergunta?: string | null
          resposta?: string | null
        }
        Update: {
          cliente_id?: number | null
          created_at?: string
          id?: number
          pergunta?: string | null
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pergunta_resposta_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
        ]
      }
      piscinas: {
        Row: {
          id: number
          nome: string | null
          numero: string | null
          pergunta_1: string | null
          pergunta_2: string | null
        }
        Insert: {
          id?: number
          nome?: string | null
          numero?: string | null
          pergunta_1?: string | null
          pergunta_2?: string | null
        }
        Update: {
          id?: number
          nome?: string | null
          numero?: string | null
          pergunta_1?: string | null
          pergunta_2?: string | null
        }
        Relationships: []
      }
      processos_advocaticios: {
        Row: {
          cpf: string | null
          created_at: string
          id: number
          link_processo: string | null
          nome: string | null
          remotJid: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          id?: number
          link_processo?: string | null
          nome?: string | null
          remotJid?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          id?: number
          link_processo?: string | null
          nome?: string | null
          remotJid?: string | null
        }
        Relationships: []
      }
      produtos_apple: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          imagem: string | null
          preco: string
          produto: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          imagem?: string | null
          preco: string
          produto: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          imagem?: string | null
          preco?: string
          produto?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          password: string | null
        }
        Insert: {
          created_at: string
          email?: string | null
          full_name?: string | null
          id: string
          password?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          password?: string | null
        }
        Relationships: []
      }
      profissional: {
        Row: {
          codigo: string | null
          custom_user_ptr_id: number
          descricao: string | null
          foto: string | null
          is_active: boolean
          preco: string | null
          tipo_profissional: string | null
        }
        Insert: {
          codigo?: string | null
          custom_user_ptr_id: number
          descricao?: string | null
          foto?: string | null
          is_active?: boolean
          preco?: string | null
          tipo_profissional?: string | null
        }
        Update: {
          codigo?: string | null
          custom_user_ptr_id?: number
          descricao?: string | null
          foto?: string | null
          is_active?: boolean
          preco?: string | null
          tipo_profissional?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissional_custom_user_ptr_id_fkey"
            columns: ["custom_user_ptr_id"]
            isOneToOne: true
            referencedRelation: "custom_user"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_bairros: {
        Row: {
          bairro_id: number
          profissional_id: number
        }
        Insert: {
          bairro_id: number
          profissional_id: number
        }
        Update: {
          bairro_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_bairros_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_bairros_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_ceps: {
        Row: {
          cep_id: number
          profissional_id: number
        }
        Insert: {
          cep_id: number
          profissional_id: number
        }
        Update: {
          cep_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_ceps_cep_id_fkey"
            columns: ["cep_id"]
            isOneToOne: false
            referencedRelation: "cep"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_ceps_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_cidades: {
        Row: {
          cidade_id: number
          profissional_id: number
        }
        Insert: {
          cidade_id: number
          profissional_id: number
        }
        Update: {
          cidade_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_cidades_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_cidades_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_convenios: {
        Row: {
          convenio_id: number
          profissional_id: number
        }
        Insert: {
          convenio_id: number
          profissional_id: number
        }
        Update: {
          convenio_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_convenios_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_convenios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_enderecos: {
        Row: {
          endereco_id: number
          profissional_id: number
        }
        Insert: {
          endereco_id: number
          profissional_id: number
        }
        Update: {
          endereco_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_enderecos_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "endereco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_enderecos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_especialidades: {
        Row: {
          especialidade_id: number
          profissional_id: number
        }
        Insert: {
          especialidade_id: number
          profissional_id: number
        }
        Update: {
          especialidade_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_especialidades_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_especialidades_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_estados: {
        Row: {
          estado_id: number
          profissional_id: number
        }
        Insert: {
          estado_id: number
          profissional_id: number
        }
        Update: {
          estado_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_estados_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_estados_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_galeria: {
        Row: {
          foto_id: number
          profissional_id: number
        }
        Insert: {
          foto_id: number
          profissional_id: number
        }
        Update: {
          foto_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_galeria_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "foto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_galeria_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_idiomas: {
        Row: {
          idioma_id: number
          profissional_id: number
        }
        Insert: {
          idioma_id: number
          profissional_id: number
        }
        Update: {
          idioma_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_idiomas_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idioma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_idiomas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_perguntas: {
        Row: {
          pergunta_resposta_id: number
          profissional_id: number
        }
        Insert: {
          pergunta_resposta_id: number
          profissional_id: number
        }
        Update: {
          pergunta_resposta_id?: number
          profissional_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_perguntas_pergunta_resposta_id_fkey"
            columns: ["pergunta_resposta_id"]
            isOneToOne: false
            referencedRelation: "pergunta_resposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_perguntas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      profissional_servicos: {
        Row: {
          profissional_id: number
          servico_id: number
        }
        Insert: {
          profissional_id: number
          servico_id: number
        }
        Update: {
          profissional_id?: number
          servico_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissional_servicos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "profissional_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servico"
            referencedColumns: ["id"]
          },
        ]
      }
      prototipo_maven: {
        Row: {
          atendimento: string | null
          created_at: string
          id: number
          nome: string | null
          remotJid: string | null
          responsavel: string | null
          status: string | null
        }
        Insert: {
          atendimento?: string | null
          created_at?: string
          id?: number
          nome?: string | null
          remotJid?: string | null
          responsavel?: string | null
          status?: string | null
        }
        Update: {
          atendimento?: string | null
          created_at?: string
          id?: number
          nome?: string | null
          remotJid?: string | null
          responsavel?: string | null
          status?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number | null
          category: string
          created_at: string | null
          id: string
          image_url: string | null
          ingredients: string
          instructions: string
          meal_type: string
          prep_time: number | null
          published: boolean | null
          title: string
        }
        Insert: {
          calories?: number | null
          category: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          ingredients: string
          instructions: string
          meal_type: string
          prep_time?: number | null
          published?: boolean | null
          title: string
        }
        Update: {
          calories?: number | null
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string
          instructions?: string
          meal_type?: string
          prep_time?: number | null
          published?: boolean | null
          title?: string
        }
        Relationships: []
      }
      samuel_contabilidade: {
        Row: {
          atendido: string | null
          fup: string | null
          horario: string | null
          id: number
          idMensagem: string | null
          nome: string | null
          resumo_anterior: string | null
          resumo_cliente: string | null
          resumo_completo: string | null
          resumo_empresa: string | null
          sessionId: string | null
          telefone: string | null
          ultima_msg: string | null
        }
        Insert: {
          atendido?: string | null
          fup?: string | null
          horario?: string | null
          id?: number
          idMensagem?: string | null
          nome?: string | null
          resumo_anterior?: string | null
          resumo_cliente?: string | null
          resumo_completo?: string | null
          resumo_empresa?: string | null
          sessionId?: string | null
          telefone?: string | null
          ultima_msg?: string | null
        }
        Update: {
          atendido?: string | null
          fup?: string | null
          horario?: string | null
          id?: number
          idMensagem?: string | null
          nome?: string | null
          resumo_anterior?: string | null
          resumo_cliente?: string | null
          resumo_completo?: string | null
          resumo_empresa?: string | null
          sessionId?: string | null
          telefone?: string | null
          ultima_msg?: string | null
        }
        Relationships: []
      }
      SDR_Celulares: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          financialDetails: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          proposalId: string | null
          sessionId: string | null
          status_ia: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      servico: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      shopping_list: {
        Row: {
          created_at: string | null
          date: string
          id: string
          items: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          items: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          items?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription: {
        Row: {
          active: boolean
          clinica_id: number | null
          id: number
          last_payment_date: string | null
          profissional_id: number | null
          stripe_subscription_id: string
        }
        Insert: {
          active?: boolean
          clinica_id?: number | null
          id?: number
          last_payment_date?: string | null
          profissional_id?: number | null
          stripe_subscription_id: string
        }
        Update: {
          active?: boolean
          clinica_id?: number | null
          id?: number
          last_payment_date?: string | null
          profissional_id?: number | null
          stripe_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: true
            referencedRelation: "clinica"
            referencedColumns: ["custom_user_ptr_id"]
          },
          {
            foreignKeyName: "subscription_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: true
            referencedRelation: "profissional"
            referencedColumns: ["custom_user_ptr_id"]
          },
        ]
      }
      suplemento_messages: {
        Row: {
          id: number
          message: Json | null
          session_id: string | null
        }
        Insert: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Update: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Relationships: []
      }
      suplementos: {
        Row: {
          id: number
          link_imagem: string | null
          nome_produto: string | null
          preco_produto: string | null
          tipos_produtos: string | null
        }
        Insert: {
          id?: number
          link_imagem?: string | null
          nome_produto?: string | null
          preco_produto?: string | null
          tipos_produtos?: string | null
        }
        Update: {
          id?: number
          link_imagem?: string | null
          nome_produto?: string | null
          preco_produto?: string | null
          tipos_produtos?: string | null
        }
        Relationships: []
      }
      tipo_clinica: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      tipo_profissional: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      token: {
        Row: {
          id: number
          token: string | null
        }
        Insert: {
          id?: number
          token?: string | null
        }
        Update: {
          id?: number
          token?: string | null
        }
        Relationships: []
      }
      Vendas_Celulares: {
        Row: {
          created_at: string
          email: string | null
          endereco_entrega: string | null
          financialDetails: string | null
          id: number
          idMensagem: string | null
          nomeCliente: string | null
          pgto_aprovado: string | null
          proposalId: string | null
          sessionId: string | null
          status_ia: string | null
          telefoneCliente: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco_entrega?: string | null
          financialDetails?: string | null
          id?: number
          idMensagem?: string | null
          nomeCliente?: string | null
          pgto_aprovado?: string | null
          proposalId?: string | null
          sessionId?: string | null
          status_ia?: string | null
          telefoneCliente?: string | null
        }
        Relationships: []
      }
      vinhos: {
        Row: {
          created_at: string | null
          id: number
          imagem: string
          valor: string
          vinho: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          imagem: string
          valor: string
          vinho: string
        }
        Update: {
          created_at?: string | null
          id?: number
          imagem?: string
          valor?: string
          vinho?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
