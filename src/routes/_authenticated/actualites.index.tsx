import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInsight, newsFeedQuery, saveInsight, type NewsFeedItem } from "@/lib/newsfeed";
import { MacroBanner } from "@/components/MacroBanner";
import { NewsInsight } from "@/components/NewsInsight";
import { NewsInsightEditor } from "@/components/NewsInsightEditor";
import { myRoleQuery } from "@/lib/admin";
import { useFormat, type Formatter } from "@/lib/format";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites/")({
  head: () => ({
    meta: [
      { title: "Actualités de la Bourse de Casablanca | Lyamfi" },
      {
        name: "description",
        content:
          "Le fil Boursenews suivi par Lyamfi : marchés, actualité et décryptage de la Bourse de Casablanca, traduits en trois langues.",
      },
      { property: "og:title", content: "Actualités | Lyamfi" },
      { property: "og:description", content: "Le fil d'actualité boursière de Lyamfi." },
    ],
  }),
  component: NewsPage,
});

/**
 * Le fil Boursenews, moissonné côté serveur, mis en cache en base et traduit
 * à la volée. La publication manuelle d'articles a disparu : Lyamfi n'écrit
 * plus que le commentaire de rédaction (« l'œil »), par carte, réservé aux
 * administrateurs.
 */
function NewsPage() {
  const { t, lang } = useI18n();
  const f = useFormat();
  usePageTitle("news.title");

  const qc = useQueryClient();
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";
  const { data: items = [], isLoading, error } = useQuery(newsFeedQuery(lang));

  const [search, setSearch] = useState("");
  /** Guid de la carte dont le panneau d'insight est ouvert, null sinon. */
  const [editingInsight, setEditingInsight] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["bnews-feed"] });

  const save = useMutation({
    mutationFn: (v: { guid: string; body: string }) => saveInsight(v.guid, v.body, lang),
    onSuccess: () => {
      toast.success(t("newsfeed.insightSaved"));
      setEditingInsight(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInsight = useMutation({
    mutationFn: (guid: string) => deleteInsight(guid),
    onSuccess: () => {
      toast.success(t("newsfeed.insightDeleted"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Filtrage sur les titres, à la frappe. Aucun aller-retour réseau. */
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) => i.title.toLowerCase().includes(needle));
  }, [items, search]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* La macroéconomie avant la cote : ce qui cadre l'actualité passe en
          tête, au-dessus même de la recherche. */}
      <MacroBanner />

      <header className="rise">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-[var(--brand-yellow)]" />
          <h1 className="text-3xl font-bold sm:text-4xl">{t("news.title")}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("news.intro")}
        </p>
      </header>

      <div className="relative">
        <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("news.searchPlaceholder")}
          aria-label={t("news.searchPlaceholder")}
          className="w-full rounded-xl border border-input bg-card py-3 ps-11 pe-4 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {error ? (
        <div className="glass p-8 text-center">
          <p className="text-sm text-destructive">{t("newsfeed.fetchError")}</p>
        </div>
      ) : isLoading ? (
        <FeedSkeleton label={t("newsfeed.loadingFeed")} />
      ) : items.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm font-medium">{t("newsfeed.empty")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("news.noMatch", { q: search.trim() })}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <FeedCard
              key={item.guid}
              item={item}
              t={t}
              f={f}
              isAdmin={isAdmin}
              editingInsight={editingInsight === item.guid}
              saving={save.isPending && save.variables?.guid === item.guid}
              onToggleInsight={() =>
                setEditingInsight(editingInsight === item.guid ? null : item.guid)
              }
              onSaveInsight={(body) => save.mutate({ guid: item.guid, body })}
              onDeleteInsight={() => {
                // La suppression touche tous les membres : confirmation
                // explicite, comme partout où l'action est irréversible.
                if (window.confirm(t("newsfeed.insightDeleteConfirm"))) {
                  removeInsight.mutate(item.guid);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- carte */

const CATEGORY_KEY: Record<NewsFeedItem["category"], Key> = {
  marches: "newsfeed.catMarches",
  actualite: "newsfeed.catActualite",
  decryptage: "newsfeed.catDecryptage",
};

/**
 * Une carte du fil : image, chip catégorie, titre, extrait, source, et le
 * commentaire de rédaction quand il existe.
 *
 * L'image et le titre mènent à l'article ; les commandes d'administration
 * sont posées HORS des liens : imbriquer un bouton dans une ancre produit un
 * balisage invalide, et cliquer « Supprimer » ouvrirait l'article au passage.
 */
function FeedCard({
  item,
  t,
  f,
  isAdmin,
  editingInsight,
  saving,
  onToggleInsight,
  onSaveInsight,
  onDeleteInsight,
}: {
  item: NewsFeedItem;
  t: Translate;
  f: Formatter;
  isAdmin: boolean;
  editingInsight: boolean;
  saving: boolean;
  onToggleInsight: () => void;
  onSaveInsight: (body: string) => void;
  onDeleteInsight: () => void;
}) {
  return (
    <article className="surface-raised card-hover group flex flex-col overflow-hidden">
      <Link
        to="/actualites/$id"
        params={{ id: item.guid }}
        className="relative block h-40 overflow-hidden bg-[oklch(0.22_0.006_90)]"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="grid h-full w-full place-items-center">
            <Newspaper className="h-8 w-8 text-muted-foreground/40" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium text-brand-yellow">
            {t(CATEGORY_KEY[item.category])}
          </span>
          {item.publishedAt && (
            <span className="text-muted-foreground">{f.weekdayDate(item.publishedAt)}</span>
          )}
        </div>

        <Link to="/actualites/$id" params={{ id: item.guid }} className="mt-2.5 block">
          <h2 className="text-base font-bold leading-snug transition-colors group-hover:text-brand-yellow">
            {item.title}
          </h2>
        </Link>

        {/* Trois lignes, coupées par le CSS : l'article entier se lit sur sa
            page, pas dans le flux. */}
        {item.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.excerpt}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 transition-colors hover:text-brand-yellow hover:underline"
          >
            {t("newsfeed.source")}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          {item.machineTranslated && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
              {t("newsfeed.autoTranslated")}
            </span>
          )}
        </div>

        {item.insight && (
          <div className="mt-4">
            <NewsInsight insight={item.insight} />
          </div>
        )}

        {isAdmin && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <button
              onClick={onToggleInsight}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3.5 py-1.5 text-xs text-brand-yellow transition-colors hover:bg-accent"
            >
              {item.insight ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {t(item.insight ? "newsfeed.insightEdit" : "newsfeed.insightAdd")}
            </button>
            {item.insight && (
              <button
                onClick={onDeleteInsight}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 px-3.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("newsfeed.insightDelete")}
              </button>
            )}
          </div>
        )}

        {isAdmin && editingInsight && (
          <div className="mt-3">
            <NewsInsightEditor
              initialBody={item.insight?.body ?? ""}
              pending={saving}
              onSave={onSaveInsight}
              onCancel={onToggleInsight}
            />
          </div>
        )}
      </div>
    </article>
  );
}

/* ----------------------------------------------------------- squelettes */

/** Cartes fantômes pendant le premier chargement du fil. */
function FeedSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="surface-raised animate-pulse overflow-hidden">
            <div className="h-40 bg-accent/60" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 rounded-full bg-accent/60" />
              <div className="h-4 w-full rounded-full bg-accent/60" />
              <div className="h-4 w-3/4 rounded-full bg-accent/60" />
              <div className="h-3 w-full rounded-full bg-accent/40" />
              <div className="h-3 w-5/6 rounded-full bg-accent/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
