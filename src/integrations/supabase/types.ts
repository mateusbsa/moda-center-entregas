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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      carrier_location_reports: {
        Row: {
          carrier_id: string
          created_at: string
          id: string
          nova_latitude: number | null
          nova_longitude: number | null
          nova_vaga_texto: string | null
          user_id: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          id?: string
          nova_latitude?: number | null
          nova_longitude?: number | null
          nova_vaga_texto?: string | null
          user_id: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          id?: string
          nova_latitude?: number | null
          nova_longitude?: number | null
          nova_vaga_texto?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_location_reports_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_location_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          alerta_fila_ativo: boolean
          horario_saida_padrao: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          setor_vaga_texto: string | null
          tempo_medio_fila_minutos: number
          tipo: Database["public"]["Enums"]["carrier_tipo"]
        }
        Insert: {
          alerta_fila_ativo?: boolean
          horario_saida_padrao?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          setor_vaga_texto?: string | null
          tempo_medio_fila_minutos?: number
          tipo?: Database["public"]["Enums"]["carrier_tipo"]
        }
        Update: {
          alerta_fila_ativo?: boolean
          horario_saida_padrao?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          setor_vaga_texto?: string | null
          tempo_medio_fila_minutos?: number
          tipo?: Database["public"]["Enums"]["carrier_tipo"]
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          carrier_id: string | null
          cidade_destino: string
          courier_id: string | null
          created_at: string
          entregue_em: string | null
          foto_comprovante_url: string | null
          horario_limite: string | null
          id: string
          nome_cliente: string
          observacao: string | null
          ordem_rota: number | null
          qtd_volumes: number
          status: Database["public"]["Enums"]["delivery_status"]
          store_id: string
          tamanho_volume: Database["public"]["Enums"]["tamanho_volume"]
        }
        Insert: {
          carrier_id?: string | null
          cidade_destino: string
          courier_id?: string | null
          created_at?: string
          entregue_em?: string | null
          foto_comprovante_url?: string | null
          horario_limite?: string | null
          id?: string
          nome_cliente: string
          observacao?: string | null
          ordem_rota?: number | null
          qtd_volumes?: number
          status?: Database["public"]["Enums"]["delivery_status"]
          store_id: string
          tamanho_volume?: Database["public"]["Enums"]["tamanho_volume"]
        }
        Update: {
          carrier_id?: string | null
          cidade_destino?: string
          courier_id?: string | null
          created_at?: string
          entregue_em?: string | null
          foto_comprovante_url?: string | null
          horario_limite?: string | null
          id?: string
          nome_cliente?: string
          observacao?: string | null
          ordem_rota?: number | null
          qtd_volumes?: number
          status?: Database["public"]["Enums"]["delivery_status"]
          store_id?: string
          tamanho_volume?: Database["public"]["Enums"]["tamanho_volume"]
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_telemetry: {
        Row: {
          carrier_id: string
          chegada_em: string
          courier_id: string
          dia_semana: number | null
          duracao_segundos: number | null
          entrega_confirmada_em: string | null
          id: string
        }
        Insert: {
          carrier_id: string
          chegada_em?: string
          courier_id: string
          dia_semana?: number | null
          duracao_segundos?: number | null
          entrega_confirmada_em?: string | null
          id?: string
        }
        Update: {
          carrier_id?: string
          chegada_em?: string
          courier_id?: string
          dia_semana?: number | null
          duracao_segundos?: number | null
          entrega_confirmada_em?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_telemetry_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_telemetry_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          store_id: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          store_id: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirmar_entrega: {
        Args: {
          _carrier_id: string
          _chegada_em: string
          _foto_url: string
          _ids: string[]
        }
        Returns: number
      }
      current_store_id: { Args: never; Returns: string }
      dist_m: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      iniciar_rota: { Args: { _ids: string[] }; Returns: number }
      is_store_admin: { Args: never; Returns: boolean }
      register_profile: {
        Args: {
          _cnpj: string
          _nome: string
          _perfil: Database["public"]["Enums"]["user_role"]
          _store_nome?: string
          _telefone: string
        }
        Returns: string
      }
    }
    Enums: {
      carrier_tipo:
        | "excursao_interna"
        | "box_interno"
        | "transportadora_externa"
      delivery_status: "pendente_carga" | "em_rota" | "entregue" | "atrasado"
      tamanho_volume: "P" | "M" | "G"
      user_role: "admin" | "entregador"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      carrier_tipo: [
        "excursao_interna",
        "box_interno",
        "transportadora_externa",
      ],
      delivery_status: ["pendente_carga", "em_rota", "entregue", "atrasado"],
      tamanho_volume: ["P", "M", "G"],
      user_role: ["admin", "entregador"],
    },
  },
} as const
