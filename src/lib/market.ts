import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Stock = Tables<"stocks">;
export type StockPrice = Tables<"stock_prices">;
export type Lesson = Tables<"lessons">;
export type LessonProgress = Tables<"lesson_progress">;

export type QuizQuestion = { q: string; options: string[]; answer: number };

export const stocksQuery = {
  queryKey: ["stocks"],
  queryFn: async (): Promise<Stock[]> => {
    const { data, error } = await supabase.from("stocks").select("*").order("market_cap", {
      ascending: false,
    });
    if (error) throw error;
    return data ?? [];
  },
};

export const stockQuery = (ticker: string) => ({
  queryKey: ["stock", ticker],
  queryFn: async (): Promise<{ stock: Stock | null; prices: StockPrice[] }> => {
    const { data: stock, error } = await supabase
      .from("stocks")
      .select("*")
      .eq("ticker", ticker)
      .maybeSingle();
    if (error) throw error;
    if (!stock) return { stock: null, prices: [] };
    const { data: prices, error: pErr } = await supabase
      .from("stock_prices")
      .select("*")
      .eq("stock_id", stock.id)
      .order("date", { ascending: true });
    if (pErr) throw pErr;
    return { stock, prices: prices ?? [] };
  },
});

export const lessonsQuery = {
  queryKey: ["lessons"],
  queryFn: async (): Promise<Lesson[]> => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};

export const progressQuery = {
  queryKey: ["lesson_progress"],
  queryFn: async (): Promise<LessonProgress[]> => {
    const { data, error } = await supabase.from("lesson_progress").select("*");
    if (error) throw error;
    return data ?? [];
  },
};

export const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;
