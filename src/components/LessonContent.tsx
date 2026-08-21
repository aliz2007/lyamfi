import { Fragment, useMemo } from "react";

/**
 * Rendu du contenu des leçons.
 *
 * Les leçons sont stockées en markdown allégé, le seul sous-ensemble que
 * les auteurs utilisent : titres `## `, listes `- `, **gras**. L'ancien
 * rendu se contentait de découper sur les doubles sauts de ligne et de
 * SUPPRIMER les `**`, ce qui aplatissait des cours de 700 mots en un mur
 * de texte. Pas de dépendance markdown ajoutée pour si peu.
 */

type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string };

function parse(content: string): Block[] {
  const blocks: Block[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "heading", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2).trim());
    } else {
      flush();
      const previous = blocks[blocks.length - 1];
      // Une ligne simple qui suit un paragraphe le continue : les leçons sont
      // écrites avec un saut de ligne entre blocs, pas au milieu d'une phrase.
      if (previous?.kind === "para") previous.text += " " + line;
      else blocks.push({ kind: "para", text: line });
    }
  }
  flush();
  return blocks;
}

/** Rend **gras** sans passer par dangerouslySetInnerHTML. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function LessonContent({ content }: { content: string }) {
  const blocks = useMemo(() => parse(content), [content]);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h2 key={i} className="pt-3 text-base font-semibold text-foreground first:pt-0">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                  />
                  <span>
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            <RichText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
