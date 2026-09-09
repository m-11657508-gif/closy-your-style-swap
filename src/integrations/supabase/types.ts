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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          brand: string | null
          category: string
          colour: string | null
          condition: string
          created_at: string
          currency: string
          description: string | null
          fit_notes: Json
          id: string
          image_key: string | null
          image_url: string | null
          mode: string
          price_cents: number
          seller_id: string | null
          seller_name: string | null
          size_label: string | null
          status: string
          style_tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string
          colour?: string | null
          condition?: string
          created_at?: string
          currency?: string
          description?: string | null
          fit_notes?: Json
          id?: string
          image_key?: string | null
          image_url?: string | null
          mode?: string
          price_cents?: number
          seller_id?: string | null
          seller_name?: string | null
          size_label?: string | null
          status?: string
          style_tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          colour?: string | null
          condition?: string
          created_at?: string
          currency?: string
          description?: string | null
          fit_notes?: Json
          id?: string
          image_key?: string | null
          image_url?: string | null
          mode?: string
          price_cents?: number
          seller_id?: string | null
          seller_name?: string | null
          size_label?: string | null
          status?: string
          style_tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          body_shape: string | null
          bust_cm: number | null
          created_at: string
          height_cm: number | null
          hips_cm: number | null
          id: string
          inseam_cm: number | null
          method: string
          shoulder_cm: number | null
          updated_at: string
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          body_shape?: string | null
          bust_cm?: number | null
          created_at?: string
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          inseam_cm?: number | null
          method?: string
          shoulder_cm?: number | null
          updated_at?: string
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          body_shape?: string | null
          bust_cm?: number | null
          created_at?: string
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          inseam_cm?: number | null
          method?: string
          shoulder_cm?: number | null
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          buyer_id: string
          created_at: string
          currency: string
          id: string
          listing_id: string
          status: string
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          listing_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          listing_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          style_prefs: Json
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          style_prefs?: Json
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          style_prefs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      swap_requests: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          message: string | null
          offered_listing_id: string | null
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          offered_listing_id?: string | null
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          offered_listing_id?: string | null
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_offered_listing_id_fkey"
            columns: ["offered_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
