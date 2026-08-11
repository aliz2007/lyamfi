import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Stock = Tables<"stocks">;
export type StockPrice = Tables<"stock_prices">;
export type Lesson = Tables<"lessons">;
export type LessonProgress = Tables<"lesson_progress">;
export type StockFundamental = Tables<"stock_fundamentals">;

export const fundamentalsQuery = {
  queryKey: ["stock_fundamentals"],
  queryFn: async (): Promise<StockFundamental[]> => {
    const { data, error } = await supabase.from("stock_fundamentals").select("*");
    if (error) throw error;
    return data ?? [];
  },
};

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

/** Score minimum (en %) pour valider un module et débloquer son badge. */
export const PASS_SCORE = 80;

/**
 * Progression par niveau + déverrouillage progressif :
 * un niveau n'est accessible que si tous les modules du niveau précédent sont validés.
 */
export function buildLevelProgress(lessons: Lesson[], progress: LessonProgress[]) {
  const doneIds = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  let previousComplete = true;

  const levels = LEVELS.map((level) => {
    const items = lessons
      .filter((l) => l.level === level)
      .sort((a, b) => a.sort_order - b.sort_order);
    const done = items.filter((l) => doneIds.has(l.id)).length;
    const unlocked = previousComplete;
    const complete = items.length > 0 && done === items.length;
    previousComplete = previousComplete && complete;
    return { level, items, done, total: items.length, unlocked, complete };
  });

  const total = lessons.length;
  const done = doneIds.size;
  return {
    levels,
    doneIds,
    done,
    total,
    ratio: total ? Math.round((done / total) * 100) : 0,
  };
}
