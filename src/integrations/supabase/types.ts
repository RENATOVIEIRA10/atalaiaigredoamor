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
          code: string
          created_at: string | null
          expires_at: string | null
          failed_attempts: number | null
          id: string
          last_used_at: string | null
          scope_id: string | null
          scope_type: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_used_at?: string | null
          scope_id?: string | null
          scope_type: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_used_at?: string | null
          scope_id?: string | null
          scope_type?: string
        }
        Relationships: []
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
          address: string | null
          bairro: string | null
          cidade: string | null
          coordenacao_id: string
          created_at: string
          id: string
          instagram_celula: string | null
          instagram_lider1: string | null
          instagram_lider2: string | null
          leader_id: string | null
          leadership_couple_id: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          ordem: number | null
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bairro?: string | null
          cidade?: string | null
          coordenacao_id: string
          created_at?: string
          id?: string
          instagram_celula?: string | null
          instagram_lider1?: string | null
          instagram_lider2?: string | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          ordem?: number | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bairro?: string | null
          cidade?: string | null
          coordenacao_id?: string
          created_at?: string
          id?: string
          instagram_celula?: string | null
          instagram_lider1?: string | null
          instagram_lider2?: string | null
          leader_id?: string | null
          leadership_couple_id?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          ordem?: number | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
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
          created_at: string
          id: string
          leader_id: string | null
          leadership_couple_id: string | null
          name: string
          ordem: number | null
          rede_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_id?: string | null
          leadership_couple_id?: string | null
          name: string
          ordem?: number | null
          rede_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_id?: string | null
          leadership_couple_id?: string | null
          name?: string
          ordem?: number | null
          rede_id?: string
          updated_at?: string
        }
        Relationships: [
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
          celula_id: string
          curso_lidere: boolean | null
          encontro_com_deus: boolean | null
          encontro_de_casais: boolean | null
          id: string
          is_active: boolean
          is_discipulado: boolean | null
          is_lider_em_treinamento: boolean | null
          joined_at: string
          profile_id: string
          renovo: boolean | null
        }
        Insert: {
          batismo?: boolean | null
          celula_id: string
          curso_lidere?: boolean | null
          encontro_com_deus?: boolean | null
          encontro_de_casais?: boolean | null
          id?: string
          is_active?: boolean
          is_discipulado?: boolean | null
          is_lider_em_treinamento?: boolean | null
          joined_at?: string
          profile_id: string
          renovo?: boolean | null
        }
        Update: {
          batismo?: boolean | null
          celula_id?: string
          curso_lidere?: boolean | null
          encontro_com_deus?: boolean | null
          encontro_de_casais?: boolean | null
          id?: string
          is_active?: boolean
          is_discipulado?: boolean | null
          is_lider_em_treinamento?: boolean | null
          joined_at?: string
          profile_id?: string
          renovo?: boolean | null
        }
        Relationships: [
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
        ]
      }
      multiplicacoes: {
        Row: {
          celula_destino_id: string
          celula_origem_id: string
          created_at: string
          data_multiplicacao: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          celula_destino_id: string
          celula_origem_id: string
          created_at?: string
          data_multiplicacao: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          celula_destino_id?: string
          celula_origem_id?: string
          created_at?: string
          data_multiplicacao?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          joined_church_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          joined_church_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          joined_church_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redes: {
        Row: {
          created_at: string
          id: string
          leader_id: string | null
          leadership_couple_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_id?: string | null
          leadership_couple_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_id?: string | null
          leadership_couple_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      supervisoes: {
        Row: {
          apresentacao_visitantes: boolean | null
          avisos: boolean | null
          cadeira_amor: boolean | null
          celula_id: string
          celula_realizada: boolean
          comunhao: boolean | null
          created_at: string
          data_supervisao: string
          dinamica: boolean | null
          horario_inicio: string
          horario_termino: string
          id: string
          interatividade: boolean | null
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
          selfie: boolean | null
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          apresentacao_visitantes?: boolean | null
          avisos?: boolean | null
          cadeira_amor?: boolean | null
          celula_id: string
          celula_realizada?: boolean
          comunhao?: boolean | null
          created_at?: string
          data_supervisao: string
          dinamica?: boolean | null
          horario_inicio: string
          horario_termino: string
          id?: string
          interatividade?: boolean | null
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
          selfie?: boolean | null
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          apresentacao_visitantes?: boolean | null
          avisos?: boolean | null
          cadeira_amor?: boolean | null
          celula_id?: string
          celula_realizada?: boolean
          comunhao?: boolean | null
          created_at?: string
          data_supervisao?: string
          dinamica?: boolean | null
          horario_inicio?: string
          horario_termino?: string
          id?: string
          interatividade?: boolean | null
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
          selfie?: boolean | null
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisoes_celula_id_fkey"
            columns: ["celula_id"]
            isOneToOne: false
            referencedRelation: "celulas"
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
          coordenacao_id: string
          created_at: string
          id: string
          leadership_couple_id: string | null
          ordem: number | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          coordenacao_id: string
          created_at?: string
          id?: string
          leadership_couple_id?: string | null
          ordem?: number | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          coordenacao_id?: string
          created_at?: string
          id?: string
          leadership_couple_id?: string | null
          ordem?: number | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
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
        ]
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
          celula_id: string
          children: number
          created_at: string
          created_by: string | null
          cultura_whatsapp: string | null
          discipleships: number
          id: string
          leaders_in_training: number
          meeting_date: string | null
          members_present: number
          mensagem_whatsapp: string | null
          notes: string | null
          paixao_whatsapp: string | null
          photo_url: string | null
          updated_at: string
          visitors: number
          week_start: string
        }
        Insert: {
          celula_id: string
          children?: number
          created_at?: string
          created_by?: string | null
          cultura_whatsapp?: string | null
          discipleships?: number
          id?: string
          leaders_in_training?: number
          meeting_date?: string | null
          members_present?: number
          mensagem_whatsapp?: string | null
          notes?: string | null
          paixao_whatsapp?: string | null
          photo_url?: string | null
          updated_at?: string
          visitors?: number
          week_start: string
        }
        Update: {
          celula_id?: string
          children?: number
          created_at?: string
          created_by?: string | null
          cultura_whatsapp?: string | null
          discipleships?: number
          id?: string
          leaders_in_training?: number
          meeting_date?: string | null
          members_present?: number
          mensagem_whatsapp?: string | null
          notes?: string | null
          paixao_whatsapp?: string | null
          photo_url?: string | null
          updated_at?: string
          visitors?: number
          week_start?: string
        }
        Relationships: [
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
