import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Newspaper, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createNews,
  deleteNews,
  MAX_IMAGE_BYTES,
  NewsUploadError,
  newsQuery,
  updateNews,
  uploadNewsImage,
  type NewsDraft,
  type NewsPost,
} from "@/lib/news";
import { myRoleQuery } from "@/lib/admin";
import { useFormat, type Formatter } from "@/lib/format";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites")({
  head: () => ({
    meta: [
      { title: "Actualités de la Bourse de Casablanca | Lyamfi" },
      {
        name: "description",
        content:
          "Les actualités de la Bourse de Casablanca publiées par Lyamfi : résultats, opérations et mouvements de la cote.",
      },
      { property: "og:title", content: "Actualités | Lyamfi" },
      {
        property: "og:description",
        content: "Le fil d'actualité boursière de Lyamfi.",
      },
    ],
  }),
  component: NewsPage,
});

const EMPTY_DRAFT: NewsDraft = { title: "", body: "", imageUrl: "" };

function NewsPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("news.title");

  const qc = useQueryClient();
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";
  const { data: posts = [], isLoading, error } = useQuery(newsQuery);

  /** `null` : le formulaire publie. Sinon il corrige l'article de cet identifiant. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsDraft>(EMPTY_DRAFT);
  const formRef = useRef<HTMLDivElement>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["news"] });

  const reset = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  };

  const publish = useMutation({
    mutationFn: (v: NewsDraft) => createNews(v),
    onSuccess: () => {
      toast.success(t("news.published"));
      reset();
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: (v: { id: string; draft: NewsDraft }) => updateNews(v.id, v.draft),
    onSuccess: () => {
      toast.success(t("news.updated"));
      reset();
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: (_d, id) => {
      toast.success(t("news.deleted"));
      // L'article corrigé vient de disparaître : le formulaire ne doit pas
      // rester ouvert sur une cible qui n'existe plus.
      if (editing === id) reset();
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (post: NewsPost) => {
    setEditing(post.id);
    setDraft({ title: post.title, body: post.body, imageUrl: post.imageUrl ?? "" });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-8">
      <header className="rise">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-[var(--brand-yellow)]" />
          <h1 className="text-3xl font-bold sm:text-4xl">{t("news.title")}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("news.intro")}
        </p>
      </header>

      {/* Le formulaire n'est rendu que pour un administrateur. La barrière
          réelle est côté base : les trois RPC revérifient is_admin(), et
          `authenticated` n'a que le SELECT sur la table. */}
      {isAdmin && (
        <div ref={formRef}>
          <Editor
            t={t}
            draft={draft}
            editing={editing !== null}
            pending={publish.isPending || save.isPending}
            onChange={setDraft}
            onCancel={reset}
            onSubmit={() => (editing ? save.mutate({ id: editing, draft }) : publish.mutate(draft))}
          />
        </div>
      )}

      {error && (
        <p className="glass p-5 text-sm text-destructive">
          {t("news.error", { reason: (error as Error).message })}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("news.loading")}</p>
      ) : posts.length === 0 ? (
        <div className="glass space-y-2 p-8 text-center">
          <p className="text-sm font-medium">{t("news.empty")}</p>
          <p className="text-xs text-muted-foreground">
            {t(isAdmin ? "news.emptyAdmin" : "news.emptyHint")}
          </p>
        </div>
      ) : (
        // `items-start` : chaque carte garde sa hauteur propre, sinon la plus
        // longue de la rangée étirerait les autres et creuserait des blancs.
        <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <Article
              key={post.id}
              post={post}
              t={t}
              f={f}
              isAdmin={isAdmin}
              editing={editing === post.id}
              onEdit={() => startEdit(post)}
              onDelete={() => remove.mutate(post.id)}
              deleting={remove.isPending && remove.variables === post.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ article */

function Article({
  post,
  t,
  f,
  isAdmin,
  editing,
  onEdit,
  onDelete,
  deleting,
}: {
  post: NewsPost;
  t: Translate;
  f: Formatter;
  isAdmin: boolean;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  // Une suppression demandée puis laissée en suspens ne doit pas rester armée :
  // la carte revient d'elle-même à son état normal.
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 6000);
    return () => clearTimeout(id);
  }, [confirming]);

  return (
    <article
      className={`surface-raised overflow-hidden ${
        editing ? "border-primary/60 ring-1 ring-primary/30" : ""
      }`}
    >
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
          // Une URL saisie à la main peut être morte : la vignette disparaît
          // plutôt que de laisser l'icône d'image cassée du navigateur.
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold leading-snug text-brand-yellow">{post.title}</h2>
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          {f.numericDate(post.publishedAt)}
        </p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {post.body}
        </p>

        {isAdmin && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3.5 py-1.5 text-xs text-brand-yellow transition-colors hover:bg-accent"
            >
              <Pencil className="h-3.5 w-3.5" /> {t("news.edit")}
            </button>
            {confirming ? (
              <>
                <button
                  disabled={deleting}
                  onClick={onDelete}
                  className="rounded-full bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
                >
                  {deleting ? t("news.deleting") : t("news.deleteConfirm")}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground"
                >
                  {t("common.cancel")}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 px-3.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("news.delete")}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------- éditeur */

function Editor({
  t,
  draft,
  editing,
  pending,
  onChange,
  onCancel,
  onSubmit,
}: {
  t: Translate;
  draft: NewsDraft;
  editing: boolean;
  pending: boolean;
  onChange: (d: NewsDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const ready = draft.title.trim().length > 0 && draft.body.trim().length > 0;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      set("imageUrl", await uploadNewsImage(file));
      toast.success(t("news.uploadDone"));
    } catch (e) {
      const kind = e instanceof NewsUploadError ? e.kind : "other";
      const key: Key = (
        {
          type: "news.uploadType",
          size: "news.uploadSize",
          bucket: "news.uploadNoBucket",
          denied: "news.uploadDenied",
          other: "news.uploadFailed",
        } as const
      )[kind];
      toast.error(t(key, { mb: Math.round(MAX_IMAGE_BYTES / 1024 / 1024) }));
    } finally {
      setUploading(false);
      // Le même fichier doit pouvoir être resélectionné après un échec.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <section className="surface-raised p-5 sm:p-7">
      <h2 className="text-sm font-semibold">{t(editing ? "news.formEdit" : "news.formNew")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("news.formHint")}</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="news-image">
            {t("news.fieldImage")}
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              id="news-image"
              value={draft.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…"
              inputMode="url"
              maxLength={2000}
              className="min-w-0 flex-1 rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-4 py-2.5 text-xs text-brand-yellow transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? t("news.uploading") : t("news.upload")}
            </button>
          </div>
          {draft.imageUrl ? (
            <div className="mt-3 flex items-start gap-3">
              <img
                src={draft.imageUrl}
                alt=""
                className="h-20 w-32 shrink-0 rounded-lg border border-border object-cover"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
              >
                {t("news.removeImage")}
              </button>
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" /> {t("news.imageOptional")}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="news-title">
            {t("news.fieldTitle")}
          </label>
          <input
            id="news-title"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
            placeholder={t("news.titlePlaceholder")}
            className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="news-body">
            {t("news.fieldBody")}
          </label>
          <textarea
            id="news-body"
            value={draft.body}
            onChange={(e) => set("body", e.target.value)}
            rows={8}
            maxLength={20000}
            placeholder={t("news.bodyPlaceholder")}
            className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background/60 px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!ready || pending || uploading}
          onClick={onSubmit}
          className="rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? t("common.saving") : t(editing ? "news.save" : "news.publish")}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </section>
  );
}
