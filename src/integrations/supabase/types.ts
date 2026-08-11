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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      lesson_progress: {
        Row: {
          completed: boolean
          id: string
          lesson_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          lesson_id: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          lesson_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          id: string
          level: string
          quiz: Json
          slug: string
          sort_order: number
          summary: string
          title: string
        }
        Insert: {
          content: string
          id?: string
          level: string
          quiz?: Json
          slug: string
          sort_order?: number
          summary: string
          title: string
        }
        Update: {
          content?: string
          id?: string
          level?: string
          quiz?: Json
          slug?: string
          sort_order?: number
          summary?: string
          title?: string
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          avg_price: number
          id: string
          portfolio_id: string
          quantity: number
          ticker: string
          updated_at: string
        }
        Insert: {
          avg_price?: number
          id?: string
          portfolio_id: string
          quantity?: number
          ticker: string
          updated_at?: string
        }
        Update: {
          avg_price?: number
          id?: string
          portfolio_id?: string
          quantity?: number
          ticker?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_positions: {
        Row: {
          id: string
          portfolio_id: string
          stock_id: string
          weight: number
        }
        Insert: {
          id?: string
          portfolio_id: string
          stock_id: string
          weight?: number
        }
        Update: {
          id?: string
          portfolio_id?: string
          stock_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_positions_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          date: string
          id: string
          masi: number | null
          portfolio_id: string
          value: number
        }
        Insert: {
          date?: string
          id?: string
          masi?: number | null
          portfolio_id: string
          value: number
        }
        Update: {
          date?: string
          id?: string
          masi?: number | null
          portfolio_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_trades: {
        Row: {
          created_at: string
          id: string
          portfolio_id: string
          price: number
          quantity: number
          side: string
          ticker: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_id: string
          price: number
          quantity: number
          side: string
          ticker: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_id?: string
          price?: number
          quantity?: number
          side?: string
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_trades_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          capital: number
          cash: number
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          capital?: number
          cash?: number
          created_at?: string
          id?: string
          name?: string
          user_id: string
        }
        Update: {
          capital?: number
          cash?: number
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      stock_fundamentals: {
        Row: {
          as_of: string
          bpa_2025: number | null
          bpa_2026e: number | null
          dpa_2025: number | null
          dpa_2026e: number | null
          dy_2025: number | null
          dy_2026e: number | null
          name: string
          per_2025: number | null
          per_2026e: number | null
          shares_m: number
          ticker: string
        }
        Insert: {
          as_of?: string
          bpa_2025?: number | null
          bpa_2026e?: number | null
          dpa_2025?: number | null
          dpa_2026e?: number | null
          dy_2025?: number | null
          dy_2026e?: number | null
          name: string
          per_2025?: number | null
          per_2026e?: number | null
          shares_m: number
          ticker: string
        }
        Update: {
          as_of?: string
          bpa_2025?: number | null
          bpa_2026e?: number | null
          dpa_2025?: number | null
          dpa_2026e?: number | null
          dy_2025?: number | null
          dy_2026e?: number | null
          name?: string
          per_2025?: number | null
          per_2026e?: number | null
          shares_m?: number
          ticker?: string
        }
        Relationships: []
      }
      stock_prices: {
        Row: {
          close: number
          date: string
          id: number
          stock_id: string
        }
        Insert: {
          close: number
          date: string
          id?: number
          stock_id: string
        }
        Update: {
          close?: number
          date?: string
          id?: number
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          bpa: number | null
          change_pct: number
          description: string | null
          dividend_yield: number | null
          id: string
          market_cap: number
          name: string
          peg: number | null
          per: number | null
          price: number
          sector: string
          target_price: number | null
          ticker: string
          updated_at: string
        }
        Insert: {
          bpa?: number | null
          change_pct?: number
          description?: string | null
          dividend_yield?: number | null
          id?: string
          market_cap?: number
          name: string
          peg?: number | null
          per?: number | null
          price?: number
          sector: string
          target_price?: number | null
          ticker: string
          updated_at?: string
        }
        Update: {
          bpa?: number | null
          change_pct?: number
          description?: string | null
          dividend_yield?: number | null
          id?: string
          market_cap?: number
          name?: string
          peg?: number | null
          per?: number | null
          price?: number
          sector?: string
          target_price?: number | null
          ticker?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
