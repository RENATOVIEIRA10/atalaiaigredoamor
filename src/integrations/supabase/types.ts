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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_keys: {
        Row: {
          active: boolean | null
          campo_id: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          failed_attempts: number | null
          id: string
          last_used_at: string | null
          rede_id: string | null
          scope_id: string | null
          scope_type: string
        }
        Insert: {
          active?: boolean | null
          campo_id?: string | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_used_at?: string | null
          rede_id?: string | null
          scope_id?: string | null
          scope_type: string
        }
        Update: {
          active?: boolean | null
          campo_id?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_used_at?: string | null
          rede_id?: string | null
          scope_id?: string | null
          scope_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_keys_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_keys_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      access_logs: {
        Row: {
          access_key_id: string | null
          code_used: string
          created_at: string
          id: string
          ip_hint: string | null
          scope_id: string | null
          scope_type: string
          user_agent: string | null
        }
        Insert: {
          access_key_id?: string | null
          code_used: string
          created_at?: string
          id?: string
          ip_hint?: string | null
          scope_id?: string | null
          scope_type: string
          user_agent?: string | null
        }
        Update: {
          access_key_id?: string | null
          code_used?: string
          created_at?: string
          id?: string
          ip_hint?: string | null
          scope_id?: string | null
          scope_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_access_key_id_fkey"
            columns: ["access_key_id"]
            isOneToOne: false
            referencedRelation: "access_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          member_id: string
          present: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          member_id: string
          present?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          member_id?: string
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendances_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_pastores: {
        Row: {
          campo_id: string
          created_at: string
          id: string
          profile_id: string
          tipo: string
        }
        Insert: {
          campo_id: string
          created_at?: string
          id?: string
          profile_id: string
          tipo?: string
        }
        Update: {
          campo_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "campo_pastores_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campo_pastores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campos: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          endereco: string | null
          estado: string | null
          horarios_culto: string | null
          id: string
          nome: string
          pais: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          horarios_culto?: string | null
          id?: string
          nome: string
          pais?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          horarios_culto?: string | null
          id?: string
          nome?: string
          pais?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      casais: {
        Row: {
          celula_id: string
          created_at: string
          id: string
          member1_id: string
          member2_id: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          celula_id: string
          created_at?: string
          id?: string
          member1_id: string
          member2_id: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          celula_id?: string
          created_at?: string
          id?: string
          member1_id?: string
          member2_id?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "casais_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casais_member1_id_fkey"
            columns: ["member1_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casais_member2_id_fkey"
            columns: ["member2_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      celulas: {
        Row: {
          aceita_novas_vidas: boolean | null
          address: string | null
          bairro: string | null
          bairros_atendidos: string[] | null
          campo_id: string
          cidade: string | null
          coordenacao_id: string
          created_at: string
          faixa_etaria_predominante: string | null
          id: string
          instagram_celula: string | null
          instagram_lider1: string | null
          instagram_lider2: string | null
          is_test_data: boolean | null
          leader_id: string | null
          leadership_couple_id: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          ordem: number | null
          perfil_ambiente: string | null
          rede_id: string
          seed_run_id: string | null
          supervisor_id: string | null
          tipo_celula: string | null
          updated_at: string
        }
        Insert: {
          aceita_novas_vidas?: boolean | null
          address?: string | null
          bairro?: string | null
          bairros_atendidos?: string[] | null
          campo_id: string
          cidade?: string | null
          coordenacao_id: string
          created_at?: string
          faixa_etaria_predominante?: string | null
          id?: string
          instagram_celula?: string | null
          instagram_lider1?: string | null
          instagram_lider2?: string | null
          is_test_data?: boolean | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          ordem?: number | null
          perfil_ambiente?: string | null
          rede_id: string
          seed_run_id?: string | null
          supervisor_id?: string | null
          tipo_celula?: string | null
          updated_at?: string
        }
        Update: {
          aceita_novas_vidas?: boolean | null
          address?: string | null
          bairro?: string | null
          bairros_atendidos?: string[] | null
          campo_id?: string
          cidade?: string | null
          coordenacao_id?: string
          created_at?: string
          faixa_etaria_predominante?: string | null
          id?: string
          instagram_celula?: string | null
          instagram_lider1?: string | null
          instagram_lider2?: string | null
          is_test_data?: boolean | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          ordem?: number | null
          perfil_ambiente?: string | null
          rede_id?: string
          seed_run_id?: string | null
          supervisor_id?: string | null
          tipo_celula?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "celulas_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celulas_coordenacao_id_fkey"
            columns: ["coordenacao_id"]
            isOneToOne: false
            referencedRelation: "coordenacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celulas_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celulas_leadership_couple_id_fkey"
            columns: ["leadership_couple_id"]
            isOneToOne: false
            referencedRelation: "leadership_couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celulas_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celulas_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celulas_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisores"
            referencedColumns: ["id"]
          },
        ]
      }
      coordenacoes: {
        Row: {
          campo_id: string
          created_at: string
          id: string
          is_test_data: boolean | null
          leader_id: string | null
          leadership_couple_id: string | null
          name: string
          ordem: number | null
          rede_id: string
          seed_run_id: string | null
          updated_at: string
        }
        Insert: {
          campo_id: string
          created_at?: string
          id?: string
          is_test_data?: boolean | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          name: string
          ordem?: number | null
          rede_id: string
          seed_run_id?: string | null
          updated_at?: string
        }
        Update: {
          campo_id?: string
          created_at?: string
          id?: string
          is_test_data?: boolean | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          name?: string
          ordem?: number | null
          rede_id?: string
          seed_run_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordenacoes_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenacoes_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenacoes_leadership_couple_id_fkey"
            columns: ["leadership_couple_id"]
            isOneToOne: false
            referencedRelation: "leadership_couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenacoes_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenacoes_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      discipulado_encontros: {
        Row: {
          campo_id: string
          celula_id: string | null
          coordenacao_id: string | null
          created_at: string
          created_by: string | null
          data_encontro: string
          id: string
          nivel: string
          observacao: string | null
          realizado: boolean
          rede_id: string | null
          updated_at: string
        }
        Insert: {
          campo_id: string
          celula_id?: string | null
          coordenacao_id?: string | null
          created_at?: string
          created_by?: string | null
          data_encontro: string
          id?: string
          nivel?: string
          observacao?: string | null
          realizado?: boolean
          rede_id?: string | null
          updated_at?: string
        }
        Update: {
          campo_id?: string
          celula_id?: string | null
          coordenacao_id?: string | null
          created_at?: string
          created_by?: string | null
          data_encontro?: string
          id?: string
          nivel?: string
          observacao?: string | null
          realizado?: boolean
          rede_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipulado_encontros_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipulado_encontros_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipulado_encontros_coordenacao_id_fkey"
            columns: ["coordenacao_id"]
            isOneToOne: false
            referencedRelation: "coordenacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipulado_encontros_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      discipulado_presencas: {
        Row: {
          campo_id: string
          created_at: string
          encontro_id: string
          id: string
          member_id: string | null
          presente: boolean
          profile_id: string | null
        }
        Insert: {
          campo_id: string
          created_at?: string
          encontro_id: string
          id?: string
          member_id?: string | null
          presente?: boolean
          profile_id?: string | null
        }
        Update: {
          campo_id?: string
          created_at?: string
          encontro_id?: string
          id?: string
          member_id?: string | null
          presente?: boolean
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipulado_presencas_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipulado_presencas_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "discipulado_encontros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipulado_presencas_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipulado_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encaminhamentos_recomeco: {
        Row: {
          campo_id: string
          celula_id: string
          contatado_at: string | null
          created_at: string
          created_by_user_id: string | null
          data_encaminhamento: string
          encaminhado_por: string | null
          id: string
          integrado_at: string | null
          is_test_data: boolean | null
          membro_id: string | null
          notas: string | null
          nova_vida_id: string
          promovido_membro_at: string | null
          rede_id: string | null
          seed_run_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campo_id: string
          celula_id: string
          contatado_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          data_encaminhamento?: string
          encaminhado_por?: string | null
          id?: string
          integrado_at?: string | null
          is_test_data?: boolean | null
          membro_id?: string | null
          notas?: string | null
          nova_vida_id: string
          promovido_membro_at?: string | null
          rede_id?: string | null
          seed_run_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campo_id?: string
          celula_id?: string
          contatado_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          data_encaminhamento?: string
          encaminhado_por?: string | null
          id?: string
          integrado_at?: string | null
          is_test_data?: boolean | null
          membro_id?: string | null
          notas?: string | null
          nova_vida_id?: string
          promovido_membro_at?: string | null
          rede_id?: string | null
          seed_run_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaminhamentos_recomeco_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_recomeco_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_recomeco_nova_vida_id_fkey"
            columns: ["nova_vida_id"]
            isOneToOne: false
            referencedRelation: "novas_vidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_recomeco_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_recomeco_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          campo_id: string
          celula_id: string | null
          coordenacao_id: string | null
          created_at: string
          created_by_name: string | null
          created_by_user_id: string | null
          event_id: string
          full_name: string
          id: string
          membro_id: string | null
          notes: string | null
          person_type: string
          rede_id: string | null
          status: string
          vida_id: string | null
          whatsapp: string | null
        }
        Insert: {
          campo_id: string
          celula_id?: string | null
          coordenacao_id?: string | null
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          event_id: string
          full_name: string
          id?: string
          membro_id?: string | null
          notes?: string | null
          person_type: string
          rede_id?: string | null
          status?: string
          vida_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          campo_id?: string
          celula_id?: string | null
          coordenacao_id?: string | null
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          event_id?: string
          full_name?: string
          id?: string
          membro_id?: string | null
          notes?: string | null
          person_type?: string
          rede_id?: string | null
          status?: string
          vida_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_coordenacao_id_fkey"
            columns: ["coordenacao_id"]
            isOneToOne: false
            referencedRelation: "coordenacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_spiritual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_vida_id_fkey"
            columns: ["vida_id"]
            isOneToOne: false
            referencedRelation: "novas_vidas"
            referencedColumns: ["id"]
          },
        ]
      }
      events_spiritual: {
        Row: {
          campo_id: string
          created_at: string
          event_date: string
          id: string
          is_active: boolean
          location: string | null
          start_time: string | null
          title: string
          type: string
        }
        Insert: {
          campo_id: string
          created_at?: string
          event_date: string
          id?: string
          is_active?: boolean
          location?: string | null
          start_time?: string | null
          title: string
          type: string
        }
        Update: {
          campo_id?: string
          created_at?: string
          event_date?: string
          id?: string
          is_active?: boolean
          location?: string | null
          start_time?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_spiritual_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_couples: {
        Row: {
          created_at: string
          id: string
          spouse1_id: string
          spouse2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          spouse1_id: string
          spouse2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          spouse1_id?: string
          spouse2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_couples_spouse1_id_fkey"
            columns: ["spouse1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_couples_spouse2_id_fkey"
            columns: ["spouse2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_functions: {
        Row: {
          active: boolean
          campo_id: string | null
          created_at: string
          function_type: string
          id: string
          leadership_couple_id: string | null
          profile_id: string | null
          rede_id: string | null
          scope_entity_id: string | null
          scope_entity_type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          campo_id?: string | null
          created_at?: string
          function_type: string
          id?: string
          leadership_couple_id?: string | null
          profile_id?: string | null
          rede_id?: string | null
          scope_entity_id?: string | null
          scope_entity_type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          campo_id?: string | null
          created_at?: string
          function_type?: string
          id?: string
          leadership_couple_id?: string | null
          profile_id?: string | null
          rede_id?: string | null
          scope_entity_id?: string | null
          scope_entity_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_functions_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_functions_leadership_couple_id_fkey"
            columns: ["leadership_couple_id"]
            isOneToOne: false
            referencedRelation: "leadership_couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_functions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_functions_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_recommendations: {
        Row: {
          campo_id: string
          created_at: string
          highlights_json: Json | null
          id: string
          justification_text: string
          recommendation_type: string
          recommended_celula_id: string | null
          recommended_current_role: string
          recommended_member_id: string | null
          recommended_profile_id: string | null
          rede_id: string
          requested_by_profile_id: string | null
          requested_by_scope_type: string
          requested_by_user_id: string
          reviewer_notes: string | null
          reviewer_user_id: string | null
          status: string
          target_reviewer_scope_type: string
          updated_at: string
        }
        Insert: {
          campo_id: string
          created_at?: string
          highlights_json?: Json | null
          id?: string
          justification_text?: string
          recommendation_type: string
          recommended_celula_id?: string | null
          recommended_current_role?: string
          recommended_member_id?: string | null
          recommended_profile_id?: string | null
          rede_id: string
          requested_by_profile_id?: string | null
          requested_by_scope_type?: string
          requested_by_user_id: string
          reviewer_notes?: string | null
          reviewer_user_id?: string | null
          status?: string
          target_reviewer_scope_type?: string
          updated_at?: string
        }
        Update: {
          campo_id?: string
          created_at?: string
          highlights_json?: Json | null
          id?: string
          justification_text?: string
          recommendation_type?: string
          recommended_celula_id?: string | null
          recommended_current_role?: string
          recommended_member_id?: string | null
          recommended_profile_id?: string | null
          rede_id?: string
          requested_by_profile_id?: string | null
          requested_by_scope_type?: string
          requested_by_user_id?: string
          reviewer_notes?: string | null
          reviewer_user_id?: string | null
          status?: string
          target_reviewer_scope_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_recommendations_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_recommendations_recommended_celula_id_fkey"
            columns: ["recommended_celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_recommendations_recommended_member_id_fkey"
            columns: ["recommended_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_recommendations_recommended_profile_id_fkey"
            columns: ["recommended_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_recommendations_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_recommendations_requested_by_profile_id_fkey"
            columns: ["requested_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          celula_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
        }
        Insert: {
          celula_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
        }
        Update: {
          celula_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          batismo: boolean | null
          campo_id: string
          celula_id: string
          curso_lidere: boolean | null
          disponivel_para_servir: boolean
          encontro_com_deus: boolean | null
          encontro_de_casais: boolean | null
          id: string
          is_active: boolean
          is_discipulado: boolean | null
          is_lider_em_treinamento: boolean | null
          is_test_data: boolean | null
          joined_at: string
          ministerios: string[] | null
          observacao_servico: string | null
          profile_id: string
          rede_id: string
          renovo: boolean | null
          seed_run_id: string | null
          serve_ministerio: boolean
          whatsapp: string | null
        }
        Insert: {
          batismo?: boolean | null
          campo_id: string
          celula_id: string
          curso_lidere?: boolean | null
          disponivel_para_servir?: boolean
          encontro_com_deus?: boolean | null
          encontro_de_casais?: boolean | null
          id?: string
          is_active?: boolean
          is_discipulado?: boolean | null
          is_lider_em_treinamento?: boolean | null
          is_test_data?: boolean | null
          joined_at?: string
          ministerios?: string[] | null
          observacao_servico?: string | null
          profile_id: string
          rede_id: string
          renovo?: boolean | null
          seed_run_id?: string | null
          serve_ministerio?: boolean
          whatsapp?: string | null
        }
        Update: {
          batismo?: boolean | null
          campo_id?: string
          celula_id?: string
          curso_lidere?: boolean | null
          disponivel_para_servir?: boolean
          encontro_com_deus?: boolean | null
          encontro_de_casais?: boolean | null
          id?: string
          is_active?: boolean
          is_discipulado?: boolean | null
          is_lider_em_treinamento?: boolean | null
          is_test_data?: boolean | null
          joined_at?: string
          ministerios?: string[] | null
          observacao_servico?: string | null
          profile_id?: string
          rede_id?: string
          renovo?: boolean | null
          seed_run_id?: string | null
          serve_ministerio?: boolean
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplicacoes: {
        Row: {
          campo_id: string
          celula_destino_id: string
          celula_origem_id: string
          created_at: string
          data_multiplicacao: string
          id: string
          is_test_data: boolean | null
          notes: string | null
          rede_id: string | null
          seed_run_id: string | null
          updated_at: string
        }
        Insert: {
          campo_id: string
          celula_destino_id: string
          celula_origem_id: string
          created_at?: string
          data_multiplicacao: string
          id?: string
          is_test_data?: boolean | null
          notes?: string | null
          rede_id?: string | null
          seed_run_id?: string | null
          updated_at?: string
        }
        Update: {
          campo_id?: string
          celula_destino_id?: string
          celula_origem_id?: string
          created_at?: string
          data_multiplicacao?: string
          id?: string
          is_test_data?: boolean | null
          notes?: string | null
          rede_id?: string | null
          seed_run_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplicacoes_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplicacoes_celula_destino_id_fkey"
            columns: ["celula_destino_id"]
            isOneToOne: true
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplicacoes_celula_origem_id_fkey"
            columns: ["celula_origem_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplicacoes_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplicacoes_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      novas_vidas: {
        Row: {
          assigned_cell_id: string | null
          assigned_to_user_id: string | null
          bairro: string | null
          campo_id: string
          cidade: string | null
          created_at: string
          created_by_user_id: string | null
          dias_disponiveis: string[] | null
          estado_civil: string | null
          faixa_etaria: string | null
          horario_preferido: string | null
          id: string
          idade: number | null
          is_test_data: boolean | null
          ja_participou_celula: boolean | null
          nome: string
          observacao: string | null
          primeira_vez_igreja: boolean | null
          rua: string | null
          seed_run_id: string | null
          status: string
          tem_filhos: boolean | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_cell_id?: string | null
          assigned_to_user_id?: string | null
          bairro?: string | null
          campo_id: string
          cidade?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dias_disponiveis?: string[] | null
          estado_civil?: string | null
          faixa_etaria?: string | null
          horario_preferido?: string | null
          id?: string
          idade?: number | null
          is_test_data?: boolean | null
          ja_participou_celula?: boolean | null
          nome: string
          observacao?: string | null
          primeira_vez_igreja?: boolean | null
          rua?: string | null
          seed_run_id?: string | null
          status?: string
          tem_filhos?: boolean | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_cell_id?: string | null
          assigned_to_user_id?: string | null
          bairro?: string | null
          campo_id?: string
          cidade?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dias_disponiveis?: string[] | null
          estado_civil?: string | null
          faixa_etaria?: string | null
          horario_preferido?: string | null
          id?: string
          idade?: number | null
          is_test_data?: boolean | null
          ja_participou_celula?: boolean | null
          nome?: string
          observacao?: string | null
          primeira_vez_igreja?: boolean | null
          rua?: string | null
          seed_run_id?: string | null
          status?: string
          tem_filhos?: boolean | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "novas_vidas_assigned_cell_id_fkey"
            columns: ["assigned_cell_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novas_vidas_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novas_vidas_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      novas_vidas_events: {
        Row: {
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          vida_id: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          vida_id: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          vida_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "novas_vidas_events_vida_id_fkey"
            columns: ["vida_id"]
            isOneToOne: false
            referencedRelation: "novas_vidas"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          access_key_id: string
          created_at: string
          id: string
          policy_version: string
        }
        Insert: {
          accepted_at?: string
          access_key_id: string
          created_at?: string
          id?: string
          policy_version: string
        }
        Update: {
          accepted_at?: string
          access_key_id?: string
          created_at?: string
          id?: string
          policy_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_acceptances_access_key_id_fkey"
            columns: ["access_key_id"]
            isOneToOne: false
            referencedRelation: "access_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          is_test_data: boolean | null
          joined_church_at: string | null
          name: string
          seed_run_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_test_data?: boolean | null
          joined_church_at?: string | null
          name: string
          seed_run_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_test_data?: boolean | null
          joined_church_at?: string | null
          name?: string
          seed_run_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      recomeco_agents: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          id: string
          mensagem_assinatura: string | null
          nome: string
          telefone_whatsapp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          id?: string
          mensagem_assinatura?: string | null
          nome: string
          telefone_whatsapp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          id?: string
          mensagem_assinatura?: string | null
          nome?: string
          telefone_whatsapp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recomeco_message_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      recomeco_messages: {
        Row: {
          agent_user_id: string
          channel: string
          created_at: string
          id: string
          message_preview: string | null
          status: string
          template_id: string | null
          updated_at: string
          vida_id: string
        }
        Insert: {
          agent_user_id: string
          channel?: string
          created_at?: string
          id?: string
          message_preview?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          vida_id: string
        }
        Update: {
          agent_user_id?: string
          channel?: string
          created_at?: string
          id?: string
          message_preview?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          vida_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomeco_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recomeco_message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recomeco_messages_vida_id_fkey"
            columns: ["vida_id"]
            isOneToOne: false
            referencedRelation: "novas_vidas"
            referencedColumns: ["id"]
          },
        ]
      }
      redes: {
        Row: {
          ativa: boolean
          branding: Json | null
          campo_id: string
          created_at: string
          id: string
          is_test_data: boolean | null
          leader_id: string | null
          leadership_couple_id: string | null
          name: string
          seed_run_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          branding?: Json | null
          campo_id: string
          created_at?: string
          id?: string
          is_test_data?: boolean | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          name: string
          seed_run_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          branding?: Json | null
          campo_id?: string
          created_at?: string
          id?: string
          is_test_data?: boolean | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          name?: string
          seed_run_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redes_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redes_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redes_leadership_couple_id_fkey"
            columns: ["leadership_couple_id"]
            isOneToOne: false
            referencedRelation: "leadership_couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redes_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiro_itens: {
        Row: {
          created_at: string
          id: string
          observacao: string | null
          responsavel_membro_id: string | null
          responsavel_nome: string | null
          roteiro_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacao?: string | null
          responsavel_membro_id?: string | null
          responsavel_nome?: string | null
          roteiro_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          observacao?: string | null
          responsavel_membro_id?: string | null
          responsavel_nome?: string | null
          roteiro_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_itens_responsavel_membro_id_fkey"
            columns: ["responsavel_membro_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_itens_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros_celula"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros_celula: {
        Row: {
          campo_id: string
          celula_id: string
          created_at: string
          criado_por: string | null
          data_reuniao: string
          id: string
          rede_id: string | null
          semana_inicio: string
          status: string
          updated_at: string
        }
        Insert: {
          campo_id: string
          celula_id: string
          created_at?: string
          criado_por?: string | null
          data_reuniao: string
          id?: string
          rede_id?: string | null
          semana_inicio: string
          status?: string
          updated_at?: string
        }
        Update: {
          campo_id?: string
          celula_id?: string
          created_at?: string
          criado_por?: string | null
          data_reuniao?: string
          id?: string
          rede_id?: string | null
          semana_inicio?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiros_celula_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiros_celula_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiros_celula_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiros_celula_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_runs: {
        Row: {
          cleaned_at: string | null
          cleaned_by: string | null
          config: Json | null
          created_at: string
          created_by: string | null
          environment: string
          id: string
          name: string
          notes: string | null
          status: string
          totals: Json | null
        }
        Insert: {
          cleaned_at?: string | null
          cleaned_by?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          totals?: Json | null
        }
        Update: {
          cleaned_at?: string | null
          cleaned_by?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          totals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seed_runs_cleaned_by_fkey"
            columns: ["cleaned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seed_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_swaps: {
        Row: {
          bimestre_start: string
          created_at: string
          id: string
          proposer_celula_id: string
          proposer_supervisor_id: string
          responded_at: string | null
          status: string
          target_celula_id: string
          target_supervisor_id: string
        }
        Insert: {
          bimestre_start: string
          created_at?: string
          id?: string
          proposer_celula_id: string
          proposer_supervisor_id: string
          responded_at?: string | null
          status?: string
          target_celula_id: string
          target_supervisor_id: string
        }
        Update: {
          bimestre_start?: string
          created_at?: string
          id?: string
          proposer_celula_id?: string
          proposer_supervisor_id?: string
          responded_at?: string | null
          status?: string
          target_celula_id?: string
          target_supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_swaps_proposer_celula_id_fkey"
            columns: ["proposer_celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_swaps_proposer_supervisor_id_fkey"
            columns: ["proposer_supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_swaps_target_celula_id_fkey"
            columns: ["target_celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_swaps_target_supervisor_id_fkey"
            columns: ["target_supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisores"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisoes: {
        Row: {
          apresentacao_visitantes: boolean | null
          avisos: boolean | null
          cadeira_amor: boolean | null
          campo_id: string
          celula_id: string
          celula_realizada: boolean
          comunhao: boolean | null
          created_at: string
          created_by: string | null
          data_supervisao: string
          dinamica: boolean | null
          horario_inicio: string
          horario_termino: string
          id: string
          interatividade: boolean | null
          is_test_data: boolean | null
          licao: boolean | null
          louvor: boolean | null
          momento_visao_triade: boolean | null
          motivo_cancelamento: string | null
          oracao_final: boolean | null
          oracao_inicial: boolean | null
          organizacao: boolean | null
          pontos_alinhar: string | null
          pontos_positivos: string | null
          pontualidade: boolean | null
          quebra_gelo: boolean | null
          rede_id: string | null
          seed_run_id: string | null
          selfie: boolean | null
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          apresentacao_visitantes?: boolean | null
          avisos?: boolean | null
          cadeira_amor?: boolean | null
          campo_id: string
          celula_id: string
          celula_realizada?: boolean
          comunhao?: boolean | null
          created_at?: string
          created_by?: string | null
          data_supervisao: string
          dinamica?: boolean | null
          horario_inicio: string
          horario_termino: string
          id?: string
          interatividade?: boolean | null
          is_test_data?: boolean | null
          licao?: boolean | null
          louvor?: boolean | null
          momento_visao_triade?: boolean | null
          motivo_cancelamento?: string | null
          oracao_final?: boolean | null
          oracao_inicial?: boolean | null
          organizacao?: boolean | null
          pontos_alinhar?: string | null
          pontos_positivos?: string | null
          pontualidade?: boolean | null
          quebra_gelo?: boolean | null
          rede_id?: string | null
          seed_run_id?: string | null
          selfie?: boolean | null
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          apresentacao_visitantes?: boolean | null
          avisos?: boolean | null
          cadeira_amor?: boolean | null
          campo_id?: string
          celula_id?: string
          celula_realizada?: boolean
          comunhao?: boolean | null
          created_at?: string
          created_by?: string | null
          data_supervisao?: string
          dinamica?: boolean | null
          horario_inicio?: string
          horario_termino?: string
          id?: string
          interatividade?: boolean | null
          is_test_data?: boolean | null
          licao?: boolean | null
          louvor?: boolean | null
          momento_visao_triade?: boolean | null
          motivo_cancelamento?: string | null
          oracao_final?: boolean | null
          oracao_inicial?: boolean | null
          organizacao?: boolean | null
          pontos_alinhar?: string | null
          pontos_positivos?: string | null
          pontualidade?: boolean | null
          quebra_gelo?: boolean | null
          rede_id?: string | null
          seed_run_id?: string | null
          selfie?: boolean | null
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisoes_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisoes_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisoes_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisoes_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisoes_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisores"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisores: {
        Row: {
          campo_id: string | null
          coordenacao_id: string
          created_at: string
          id: string
          is_test_data: boolean | null
          leadership_couple_id: string | null
          ordem: number | null
          profile_id: string
          rede_id: string | null
          seed_run_id: string | null
          updated_at: string
        }
        Insert: {
          campo_id?: string | null
          coordenacao_id: string
          created_at?: string
          id?: string
          is_test_data?: boolean | null
          leadership_couple_id?: string | null
          ordem?: number | null
          profile_id: string
          rede_id?: string | null
          seed_run_id?: string | null
          updated_at?: string
        }
        Update: {
          campo_id?: string | null
          coordenacao_id?: string
          created_at?: string
          id?: string
          is_test_data?: boolean | null
          leadership_couple_id?: string | null
          ordem?: number | null
          profile_id?: string
          rede_id?: string | null
          seed_run_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisores_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisores_coordenacao_id_fkey"
            columns: ["coordenacao_id"]
            isOneToOne: false
            referencedRelation: "coordenacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisores_leadership_couple_id_fkey"
            columns: ["leadership_couple_id"]
            isOneToOne: false
            referencedRelation: "leadership_couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisores_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisores_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_links: {
        Row: {
          access_key_id: string
          active: boolean
          campo_id: string | null
          created_at: string
          id: string
          label: string
          rede_id: string | null
          scope_id: string | null
          scope_type: string
          user_id: string
        }
        Insert: {
          access_key_id: string
          active?: boolean
          campo_id?: string | null
          created_at?: string
          id?: string
          label?: string
          rede_id?: string | null
          scope_id?: string | null
          scope_type: string
          user_id: string
        }
        Update: {
          access_key_id?: string
          active?: boolean
          campo_id?: string | null
          created_at?: string
          id?: string
          label?: string
          rede_id?: string | null
          scope_id?: string | null
          scope_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_links_access_key_id_fkey"
            columns: ["access_key_id"]
            isOneToOne: false
            referencedRelation: "access_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_links_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_state: {
        Row: {
          completed_steps: Json
          created_at: string
          dismissed: boolean
          id: string
          last_seen_at: string
          scope_type: string
          updated_at: string
          user_id: string
          visits_count: number
        }
        Insert: {
          completed_steps?: Json
          created_at?: string
          dismissed?: boolean
          id?: string
          last_seen_at?: string
          scope_type: string
          updated_at?: string
          user_id: string
          visits_count?: number
        }
        Update: {
          completed_steps?: Json
          created_at?: string
          dismissed?: boolean
          id?: string
          last_seen_at?: string
          scope_type?: string
          updated_at?: string
          user_id?: string
          visits_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      visitors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          meeting_id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          meeting_id: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          meeting_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          campo_id: string
          celula_id: string
          children: number
          created_at: string
          created_by: string | null
          cultura_whatsapp: string | null
          discipleships: number
          id: string
          is_test_data: boolean | null
          leaders_in_training: number
          meeting_date: string | null
          members_present: number
          mensagem_whatsapp: string | null
          notes: string | null
          paixao_whatsapp: string | null
          photo_url: string | null
          rede_id: string | null
          seed_run_id: string | null
          updated_at: string
          visitors: number
          week_start: string
        }
        Insert: {
          campo_id: string
          celula_id: string
          children?: number
          created_at?: string
          created_by?: string | null
          cultura_whatsapp?: string | null
          discipleships?: number
          id?: string
          is_test_data?: boolean | null
          leaders_in_training?: number
          meeting_date?: string | null
          members_present?: number
          mensagem_whatsapp?: string | null
          notes?: string | null
          paixao_whatsapp?: string | null
          photo_url?: string | null
          rede_id?: string | null
          seed_run_id?: string | null
          updated_at?: string
          visitors?: number
          week_start: string
        }
        Update: {
          campo_id?: string
          celula_id?: string
          children?: number
          created_at?: string
          created_by?: string | null
          cultura_whatsapp?: string | null
          discipleships?: number
          id?: string
          is_test_data?: boolean | null
          leaders_in_training?: number
          meeting_date?: string | null
          members_present?: number
          mensagem_whatsapp?: string | null
          notes?: string | null
          paixao_whatsapp?: string | null
          photo_url?: string | null
          rede_id?: string | null
          seed_run_id?: string | null
          updated_at?: string
          visitors?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reports_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reports_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reports_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "seed_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_celula: {
        Args: { _celula_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_coordenacao: {
        Args: { _coordenacao_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_rede: {
        Args: { _rede_id: string; _user_id: string }
        Returns: boolean
      }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_campo_id: { Args: { _user_id: string }; Returns: string }
      has_access_scope: {
        Args: { _scope_type: string; _user_id: string }
        Returns: boolean
      }
      has_any_active_scope: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_leadership_couple_member: {
        Args: { _couple_id: string; _profile_id: string }
        Returns: boolean
      }
      user_belongs_to_campo: {
        Args: { _campo_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "rede_leader"
        | "coordenador"
        | "celula_leader"
        | "supervisor"
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
    Enums: {
      app_role: [
        "admin",
        "rede_leader",
        "coordenador",
        "celula_leader",
        "supervisor",
      ],
    },
  },
} as const
