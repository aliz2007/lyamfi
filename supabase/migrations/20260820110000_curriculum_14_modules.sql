-- Remplace le programme pédagogique par les 14 modules du support officiel.
--
-- Le contenu provient de « Educ_Lyamfi_FINAL.pdf » : 14 modules répartis en
-- 3 niveaux (4 Débutant, 4 Intermédiaire, 6 Avancé), chacun avec un quiz de
-- 10 questions à 4 propositions et une explication par réponse.
--
-- Remplace les 6 leçons de démonstration initiales. Leur `lesson_progress`
-- disparaît avec elles (ON DELETE CASCADE) : le programme est entièrement
-- différent, aucune correspondance n'aurait eu de sens.
--
-- Idempotent : upsert sur `slug`, puis suppression de tout ce qui ne fait pas
-- partie du programme courant.

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$actions-et-obligations-la-difference$lyamfi$,
  $lyamfi$Débutant$lyamfi$,
  $lyamfi$Actions et Obligations, c'est quoi la différence ?$lyamfi$,
  $lyamfi$Distinguer une action d'une obligation, comprendre le rôle du marché des capitaux et le vocabulaire de base de la bourse.$lyamfi$,
  $lyamfi$## Le grand marché des capitaux

Avant de parler d'actions ou d'obligations, il faut comprendre où ces échanges ont lieu.

Le **marché des capitaux** est un marché financier, qui peut être physique ou virtuel. C'est là que les entreprises, les gouvernements et d'autres grandes institutions viennent chercher de l'argent pour financer leurs projets et leurs activités à long terme.

Pour obtenir cet argent, ces entités **émettent** (créent) des titres. En tant qu'investisseur, c'est sur ce marché que tu vas pouvoir acheter et vendre ces fameux titres financiers, qui sont conçus pour des investissements à moyen ou long terme.

## Qu'est-ce qu'un « titre » ?

Dans le jargon financier, un **titre** n'est rien d'autre qu'un document financier. Ce document est une preuve légale qui représente l'une de ces deux choses :

- soit un **droit de propriété** : tu possèdes un morceau de l'entreprise
- soit une **dette** : quelqu'un te doit de l'argent

Toute la suite du module découle de cette distinction : d'un côté les titres de capital, de l'autre les titres de créance.

## Le titre de capital : l'action

L'**action** est le titre de capital par excellence. Concrètement, elle représente une part de propriété dans une entreprise.

Un exemple simple : si une entreprise est divisée en 100 parts égales et que tu achètes 5 actions, tu es littéralement propriétaire de 5 % de cette entreprise.

Ton objectif, en tant qu'actionnaire, sera de profiter de la croissance et des bénéfices futurs de cette société.

## Le titre de créance : l'obligation

À l'inverse de l'action, le **titre de créance** (aussi appelé titre de dette) ne te donne aucun droit de propriété. C'est un document financier qui représente une promesse de remboursement d'un emprunt à une date future, avec des intérêts.

L'**obligation** est un titre de dette émis par des entreprises ou des gouvernements. Le mécanisme est simple : en achetant une obligation, tu prêtes de l'argent à l'émetteur.

C'est exactement comme un crédit classique, mais au lieu que ce soit une banque qui accorde le prêt, ce sont des investisseurs comme toi qui prêtent l'argent. En retour de ce prêt, l'émetteur s'engage à te verser des paiements d'intérêts réguliers, que l'on appelle des **coupons**.

## Le bon du Trésor

Le **bon du Trésor** est un type d'obligation très spécifique, émis directement par le gouvernement pour financer ses propres dépenses.

Ce sont donc des particuliers, des banques ou d'autres États qui prêtent de l'argent au gouvernement, en échange d'une promesse de remboursement avec intérêts.

L'avantage ? Les bons du Trésor sont considérés comme des placements très sûrs.

## Aller un peu plus loin : les options

Sur le marché, il existe d'autres instruments, comme les **options**. Ce sont des contrats financiers un peu particuliers :

- ils donnent le **droit** d'acheter ou de vendre un actif
- mais absolument pas l'**obligation** de le faire
- à un prix fixé à l'avance, pour une date future

Par exemple, lors de certaines opérations sur le marché marocain (comme avec les actions **Akdital**), les investisseurs peuvent se retrouver avec ce type d'option rattachée à leur investissement.

## Ne pas confondre « souscrire » et « acheter »

Pour finir, le vocabulaire a son importance en bourse. Deux mots qui semblent proches désignent en réalité deux moments très différents de la vie d'un titre.

- La **souscription** : elle se produit lors de l'émission initiale du titre, c'est-à-dire quand il est vendu pour la toute première fois. À ce moment-là, tu souscris à ce qu'on appelle la **valeur nominale**, le prix de base inscrit sur le titre.
- L'**achat** : il intervient plus tard, sur le **marché secondaire**, le marché d'occasion. Le titre a déjà été émis, et tu l'achètes à un autre investisseur. Cette fois, tu ne payes plus la valeur nominale, mais le **prix de bourse**, qui fluctue selon l'offre et la demande.

## L'essentiel à retenir

- Le marché des capitaux sert à lever de l'argent à long terme, via l'émission de titres.
- Un titre représente soit un droit de propriété, soit une dette.
- L'action = une part de propriété dans l'entreprise.
- L'obligation = un prêt, rémunéré par des coupons ; le bon du Trésor en est la version émise par le gouvernement, réputée très sûre.
- L'option donne un droit, jamais une obligation.
- On souscrit à la valeur nominale à l'émission ; on achète au prix de bourse sur le marché secondaire.$lyamfi$,
  1,
  $lyamfi$[{"q": "À quoi sert avant tout le marché des capitaux pour les entreprises et les gouvernements ?", "options": ["À échanger des devises étrangères au jour le jour", "À lever des fonds pour financer des projets et des activités à long terme", "À accorder des crédits à la consommation aux ménages", "À payer les salaires des employés chaque mois"], "answer": 1, "explanation": "Le marché des capitaux est l'endroit où les entreprises, les gouvernements et les grandes institutions viennent chercher de l'argent pour financer leurs projets à long terme."}, {"q": "En finance, un « titre » est un document financier qui prouve légalement :", "options": ["Un impôt dû à l'État", "L'ouverture d'un compte bancaire", "Soit un droit de propriété, soit une dette", "Une assurance contre la faillite de l'émetteur"], "answer": 2, "explanation": "Un titre est une preuve légale qui représente soit un droit de propriété sur l'entreprise, soit une dette dont on te doit le remboursement."}, {"q": "Quand tu achètes une action, tu achètes :", "options": ["Un titre de capital", "Un titre de créance", "Un bon du Trésor", "Un contrat d'option"], "answer": 0, "explanation": "L'action est le titre de capital par excellence, puisqu'elle représente une part de propriété dans l'entreprise."}, {"q": "Une entreprise est divisée en 100 parts égales et tu achètes 5 actions. Que peux-tu en conclure ?", "options": ["Tu as prêté de l'argent à l'entreprise pour 5 ans", "Tu détiens 5 obligations de cette entreprise", "Tu ne possèdes rien tant qu'aucun coupon n'est versé", "Tu es propriétaire de 5 % de cette entreprise"], "answer": 3, "explanation": "Avec 5 actions sur 100 parts égales, tu es littéralement propriétaire de 5 % de l'entreprise."}, {"q": "Comment appelle-t-on les paiements d'intérêts réguliers versés au détenteur d'une obligation ?", "options": ["Les dividendes", "Les coupons", "Les plus-values", "Les primes de risque"], "answer": 1, "explanation": "L'émetteur d'une obligation s'engage à verser des paiements d'intérêts réguliers appelés coupons."}, {"q": "Dans le mécanisme d'une obligation, qui joue le rôle habituellement tenu par la banque dans un crédit classique ?", "options": ["L'entreprise qui émet le titre", "Le gouvernement, dans tous les cas", "Les investisseurs, qui prêtent leur argent à l'émetteur", "Les agences de notation"], "answer": 2, "explanation": "Une obligation fonctionne comme un crédit, sauf que ce sont les investisseurs, et non une banque, qui prêtent l'argent à l'émetteur."}, {"q": "Laquelle de ces affirmations décrit correctement un bon du Trésor ?", "options": ["Il est émis par le gouvernement et considéré comme un placement très sûr", "Il s'agit d'une action d'entreprise publique", "C'est un titre de capital émis par les banques", "C'est un placement spéculatif à très haut risque"], "answer": 0, "explanation": "Le bon du Trésor est une obligation émise directement par le gouvernement pour financer ses dépenses, et il est considéré comme un placement très sûr."}, {"q": "Que donne exactement une option à son détenteur ?", "options": ["L'obligation d'acheter un actif à une date future", "Un droit de propriété sur l'entreprise émettrice", "Une garantie de remboursement du capital investi", "Le droit, mais pas l'obligation, d'acheter ou de vendre un actif à un prix fixé à l'avance"], "answer": 3, "explanation": "Une option est un contrat qui donne le droit, et absolument pas l'obligation, d'acheter ou de vendre un actif à un prix fixé à l'avance pour une date future."}, {"q": "On parle de « souscription » :", "options": ["Lors de la revente d'un titre entre deux investisseurs", "Lors de l'émission initiale du titre, à la valeur nominale", "Lors du calcul de la valeur d'un indice boursier", "Lors de la faillite de l'émetteur"], "answer": 1, "explanation": "La souscription correspond à l'émission initiale du titre, vendu pour la première fois à sa valeur nominale."}, {"q": "Tu achètes un titre déjà émis à un autre investisseur sur le marché secondaire. Quel prix payes-tu ?", "options": ["La valeur nominale inscrite sur le titre", "Un prix fixé une fois pour toutes par l'émetteur", "Le prix de bourse, qui fluctue selon l'offre et la demande", "Rien, le titre est simplement transféré"], "answer": 2, "explanation": "Sur le marché secondaire, tu ne payes plus la valeur nominale mais le prix de bourse, qui varie selon l'offre et la demande."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$bourse-de-casablanca-et-ses-acteurs$lyamfi$,
  $lyamfi$Débutant$lyamfi$,
  $lyamfi$À la découverte de la Bourse de Casablanca et de ses acteurs$lyamfi$,
  $lyamfi$Identifier les acteurs du marche boursier marocain (AMMC, Bourse de Casablanca, Maroclear, intermediaires) et le role de chacun.$lyamfi$,
  $lyamfi$## Ce que tu vas comprendre

Le marché boursier marocain n'est pas géré par une seule entité. C'est un écosystème dans lequel chaque acteur a un rôle bien précis : un arbitre, un organisateur, un coffre-fort et des intermédiaires. Voici comment tout cela s'articule.

## De la corbeille au numérique : l'histoire des titres

Il fut un temps, au Maroc **avant 1998**, où acheter une action signifiait recevoir un **titre physique**, c'est-à-dire un véritable bout de papier que l'on te remettait.

Cette époque est révolue. L'image des traders qui hurlent avec des papiers à la main n'existe plus.

- Depuis **1998**, le marché marocain a connu des réformes majeures.
- Les titres ont été totalement **dématérialisés** : ils n'existent plus sous forme papier.
- Ils prennent désormais une forme **scripturale**, c'est-à-dire informatique.
- Le marché est devenu électronique et décentralisé.

Retiens ce mot : aujourd'hui, la forme des titres financiers est scripturale, et non plus matérielle ou physique.

## L'AMMC : le gendarme de la Bourse

Dans un marché 100 % numérique, il faut un arbitre pour garantir la confiance. C'est le rôle de l'**AMMC**, l'Autorité Marocaine du Marché des Capitaux.

- C'est une **institution publique indépendante**.
- Sa mission principale : **protéger l'épargne** que les investisseurs placent en bourse.
- Elle veille à l'**égalité de traitement** des épargnants.
- Elle veille à la **transparence de l'information**.
- Elle exerce un **contrôle strict** sur tous les professionnels qui opèrent sur le marché.

En clair, l'AMMC ne fixe pas les prix et ne t'achète pas d'actions : elle surveille, contrôle et protège.

## La Bourse de Casablanca : l'organisateur

Contrairement à ce que l'on pourrait penser, la **Bourse de Casablanca** n'est pas un ministère. C'est une **société de droit privé** à qui l'État a concédé la gestion du marché boursier.

Concrètement, c'est elle qui :

- prononce l'**admission à la cote** des entreprises, lorsqu'elles entrent en bourse ;
- prononce leur **radiation**, lorsqu'elles en sortent ;
- assure l'**enregistrement** et la **publicité** de toutes les transactions qui s'y déroulent.

Elle organise donc le marché et le rend visible, mais elle ne conserve pas tes titres.

## Maroclear : le coffre-fort central

Puisque les titres n'existent plus en papier, où sont-ils stockés ? C'est ici qu'intervient **Maroclear**, le **Dépositaire Central** du Maroc, créé lors des réformes de 1998.

- C'est la **seule institution habilitée** à conserver les titres dématérialisés.
- C'est Maroclear qui surveille la comptabilité des titres et **enregistre officiellement qui possède quoi**.
- Ce rôle facilite la circulation des titres entre les acheteurs et les vendeurs.

Sans Maroclear, personne ne pourrait prouver qu'il est bien propriétaire de ses actions.

## Tes intermédiaires obligatoires

En tant que particulier, la loi ne t'autorise pas à aller frapper à la porte de la Bourse de Casablanca pour acheter directement une action. Le marché des capitaux est **intermédié** : l'accès passe nécessairement par un professionnel agréé.

Deux familles d'intermédiaires t'accompagnent.

- Les **Sociétés de Bourse (SDB)** : créées après **1993**, ces entreprises ont pour activité principale d'acheminer tes ordres de bourse vers le système de cotation et de les exécuter. Elles jouent les entremetteurs entre les acheteurs et les vendeurs.
- Les **Teneurs de comptes** : ce sont généralement des banques ou des sociétés de bourse ayant reçu une habilitation spéciale pour garder ton compte. Ils conservent tes titres dématérialisés et gèrent ton argent, c'est-à-dire les espèces liées à tes investissements en bourse.

## À retenir

- Avant 1998, les titres étaient des bouts de papier ; depuis, ils sont scripturaux.
- L'AMMC contrôle et protège l'épargne investie.
- La Bourse de Casablanca, société de droit privé concessionnaire, admet, radie et enregistre.
- Maroclear conserve les titres dématérialisés et tient le registre des propriétaires.
- Les sociétés de bourse exécutent tes ordres, les teneurs de comptes gardent tes titres et tes espèces.
- Tu ne peux pas intervenir seul sur le marché : tu passes obligatoirement par un professionnel agréé.$lyamfi$,
  2,
  $lyamfi$[{"q": "Au Maroc, sous quelle forme se présentaient les actions avant 1998 ?", "options": ["Sous forme de lingots d'or conservés dans les coffres de la banque", "Sous forme de cryptomonnaies", "Sous forme de titres physiques, de véritables bouts de papier", "Sous forme d'e-mails envoyés par la Bourse"], "answer": 2, "explanation": "Avant 1998, acheter une action signifiait recevoir un titre physique, c'est-à-dire un véritable bout de papier."}, {"q": "Aujourd'hui, comment qualifie-t-on la forme des titres financiers au Maroc ?", "options": ["Scripturale", "Matérielle", "Physique", "Provisoire"], "answer": 0, "explanation": "Depuis la dématérialisation, les titres n'existent plus en papier mais sous forme scripturale, c'est-à-dire informatique."}, {"q": "Que signifie le sigle AMMC ?", "options": ["Agence Marocaine de la Monnaie et du Crédit", "Association Marocaine des Marchés Commerciaux", "Autorité Mondiale des Marchés Centralisés", "Autorité Marocaine du Marché des Capitaux"], "answer": 3, "explanation": "L'AMMC est l'Autorité Marocaine du Marché des Capitaux."}, {"q": "Quelle est la mission principale de l'AMMC ?", "options": ["Fixer chaque jour le prix de toutes les actions cotées", "Prêter de l'argent aux investisseurs débutants qui le demandent", "Protéger l'épargne investie et veiller à la transparence de l'information", "Racheter les actions des entreprises en difficulté financière"], "answer": 2, "explanation": "L'AMMC a pour mission principale de protéger l'épargne placée en bourse et d'assurer la transparence de l'information ainsi que le contrôle des professionnels."}, {"q": "Quel est le statut juridique de la Bourse de Casablanca ?", "options": ["Un ministère rattaché au gouvernement marocain", "Une société de droit privé à qui l'État a concédé la gestion du marché", "Une association à but non lucratif financée par les banques cotées", "La banque centrale chargée d'émettre la monnaie nationale"], "answer": 1, "explanation": "La Bourse de Casablanca n'est pas un ministère : c'est une société de droit privé qui gère le marché boursier dans le cadre d'une concession de l'État."}, {"q": "Qui prononce l'admission d'une entreprise à la cote ou sa radiation ?", "options": ["La Bourse de Casablanca, société gestionnaire du marché", "Maroclear, le dépositaire central des titres", "L'ensemble des investisseurs particuliers, par un vote", "Le teneur de compte de l'entreprise concernée"], "answer": 0, "explanation": "C'est la Bourse de Casablanca qui prononce l'admission à la cote et la radiation des entreprises."}, {"q": "Quelle est la mission principale de Maroclear ?", "options": ["Acheminer les ordres de bourse vers le système de cotation", "Contrôler les professionnels du marché et protéger l'épargne", "Prononcer l'admission des entreprises à la cote", "Conserver les titres dématérialisés et enregistrer qui possède quoi"], "answer": 3, "explanation": "Maroclear, le dépositaire central créé en 1998, est la seule institution habilitée à conserver les titres dématérialisés et à enregistrer officiellement leurs propriétaires."}, {"q": "Le marché des capitaux marocain est dit « intermédié ». Cela signifie que :", "options": ["n'importe qui peut acheter ses actions directement à la Bourse", "tu dois obligatoirement passer par un professionnel agréé", "le marché est réservé aux seules entreprises internationales", "les prix sont négociés uniquement par l'État marocain"], "answer": 1, "explanation": "Un marché intermédié signifie que l'accès passe nécessairement par un professionnel agréé, un particulier ne pouvant pas intervenir seul."}, {"q": "Quelle est l'activité principale d'une société de bourse (SDB) ?", "options": ["Enregistrer et assurer la publicité de toutes les transactions", "Conserver les anciens titres papier dans des coffres sécurisés", "Acheminer les ordres de ses clients vers le système de cotation et les exécuter", "Contrôler la transparence de l'information financière"], "answer": 2, "explanation": "Les sociétés de bourse, créées après 1993, acheminent les ordres des clients vers le système de cotation et les exécutent."}, {"q": "Quel est le rôle d'un teneur de compte ?", "options": ["Il conserve tes titres dématérialisés et gère les espèces liées à tes investissements", "Il gère la Bourse des valeurs pour le compte de l'État", "Il surveille les transactions douteuses sur le marché", "Il évalue la solvabilité des États emprunteurs"], "answer": 0, "explanation": "Le teneur de compte, généralement une banque ou une société de bourse habilitée, conserve les titres dématérialisés de ses clients et gère les espèces associées."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$prix-valeur-et-capitalisation$lyamfi$,
  $lyamfi$Débutant$lyamfi$,
  $lyamfi$Prix, valeur et capitalisation$lyamfi$,
  $lyamfi$Distinguer valeur nominale et prix de bourse, calculer une capitalisation, comprendre le flottant, le split et le MASI.$lyamfi$,
  $lyamfi$## Ce que tu vas apprendre

Une action a plusieurs "prix" et plusieurs façons d'être mesurée. Dans ce module, tu vas apprendre à distinguer la valeur nominale du prix de bourse, à mesurer la vraie taille d'une entreprise cotée, à comprendre ce qui est réellement disponible à l'achat, et à lire le thermomètre du marché marocain : le MASI.

## Valeur nominale ou prix de marché : ne confonds plus

Quand on parle d'une action, il y a deux prix très différents à comprendre.

- La **valeur nominale** : c'est le prix "de fabrication" de l'action. C'est le montant de base inscrit sur le titre lors de son émission initiale. Cette valeur est fixe et ne change pas tous les jours.
- Au Maroc, la loi interdit d'émettre une action à une valeur nominale inférieure à **10 dirhams**.
- Le **prix de bourse** (ou prix de marché) : c'est le prix auquel l'action s'achète et se vend tous les jours sur le **marché secondaire**. Ce prix fluctue en permanence selon l'offre et la demande.

Retiens bien la conséquence : le prix d'une action en bourse ne reflète pas nécessairement sa valeur nominale de départ. Une action émise à 10 dirhams peut s'échanger beaucoup plus cher, ou beaucoup moins cher, des années plus tard.

## La capitalisation boursière : la "taille" de l'entreprise

Si tu veux savoir combien "pèse" une entreprise en bourse, ne regarde surtout pas le prix d'une seule action. Ce prix indique juste en combien de parts le capital a été divisé : il ne dit rien, à lui seul, de la taille de la société.

Ce qu'il faut regarder, c'est la **capitalisation boursière**.

- C'est la valeur totale de toutes les actions de l'entreprise sur le marché.
- La formule est simple : prix de l'action multiplié par le nombre d'actions en circulation.
- Exemple : si une entreprise possède 1 million d'actions et que chaque action vaut 50 euros en bourse, sa capitalisation boursière est de 50 millions d'euros.
- Concrètement, si tu voulais racheter toute l'entreprise cotée, c'est ce prix-là qu'il faudrait payer.

## Le flottant : ce qui est vraiment disponible

Toutes les actions d'une entreprise ne sont pas forcément en vente sur le marché. La **capitalisation flottante** (ou **free float**) correspond à la part des actions qui est effectivement disponible à l'achat et à la vente par le public.

- On exclut de ce calcul les actions détenues par les fondateurs, l'État ou les actionnaires majoritaires.
- Pourquoi ? Parce que ces actionnaires gardent leurs parts stratégiquement et ne les vendent pas au quotidien.
- L'importance du flottant : généralement, plus une entreprise a un flottant élevé, plus il y a d'acheteurs et de vendeurs, et plus son action est **liquide**, c'est-à-dire facile à acheter et à revendre.

## Le split : couper la part de gâteau en deux

Parfois, le prix d'une action devient trop élevé et décourage les petits investisseurs. L'entreprise peut alors faire un **split**.

- Cela consiste à diviser les actions existantes en plusieurs nouvelles actions.
- Exemple : si tu avais une action à 1 000 DH et que l'entreprise la divise par 10, tu te retrouves avec 10 actions à 100 DH.
- Le résultat : la valeur nominale de chaque action baisse, mais ton investissement total et la capitalisation boursière de l'entreprise restent exactement les mêmes.

Un split ne t'enrichit donc pas et n'appauvrit personne : il rend simplement l'action plus accessible.

## Les indices boursiers : le MASI

Pour savoir si la Bourse de Casablanca est "en hausse" ou "en baisse" globalement, on utilise un **indice boursier**, une sorte de thermomètre du marché : le **MASI**.

- Le MASI est un indice calculé à partir de la capitalisation flottante des entreprises.
- Les entreprises n'ont pas toutes le même poids dans l'indice : une très grande entreprise influencera beaucoup plus le MASI qu'une petite PME.
- Il existe aussi des indices plus resserrés, comme le **MASI 20**, qui regroupe uniquement les 20 entreprises ayant la plus forte capitalisation de la Bourse.

## À retenir

- Valeur nominale = prix d'émission fixe, minimum 10 dirhams au Maroc ; prix de bourse = prix quotidien qui fluctue.
- Capitalisation boursière = prix de l'action × nombre d'actions en circulation.
- Flottant = la part réellement échangeable ; plus il est élevé, plus l'action est liquide.
- Split = plus d'actions, moins chères, même capitalisation et même investissement total.
- MASI = indice de tendance du marché, basé sur la capitalisation flottante ; MASI 20 = les 20 plus fortes capitalisations.$lyamfi$,
  3,
  $lyamfi$[{"q": "Qu'est-ce que la valeur nominale d'une action ?", "options": ["Le prix auquel l'action s'échange chaque jour en bourse", "La valeur totale de l'entreprise sur le marché", "Le montant de base inscrit sur le titre lors de son émission initiale", "Le montant des dividendes versés chaque année"], "answer": 2, "explanation": "La valeur nominale est le prix \"de fabrication\" de l'action, inscrit sur le titre au moment de son émission initiale."}, {"q": "Au Maroc, en dessous de quelle valeur nominale la loi interdit-elle d'émettre une action ?", "options": ["1 dirham", "10 dirhams", "50 dirhams", "100 dirhams"], "answer": 1, "explanation": "La loi marocaine interdit d'émettre une action à une valeur nominale inférieure à 10 dirhams."}, {"q": "Le prix de bourse d'une action est-il nécessairement égal à sa valeur nominale ?", "options": ["Non, il fluctue en permanence selon l'offre et la demande", "Oui, la loi impose l'égalité entre les deux", "Oui, sauf en période de crise économique", "Non, il vaut toujours exactement le double"], "answer": 0, "explanation": "Le prix de marché varie chaque jour selon l'offre et la demande et ne reflète donc pas nécessairement la valeur nominale de départ."}, {"q": "Comment calcule-t-on la capitalisation boursière d'une entreprise ?", "options": ["Valeur nominale multipliée par le flottant", "Prix de l'action divisé par le nombre d'actionnaires", "Total des dettes ajouté au capital social", "Prix de l'action multiplié par le nombre d'actions en circulation"], "answer": 3, "explanation": "La capitalisation boursière est la valeur totale des actions, soit le prix de l'action multiplié par le nombre d'actions en circulation."}, {"q": "Une société possède 1 million d'actions et chaque action vaut 50 euros en bourse. Quelle est sa capitalisation boursière ?", "options": ["50 millions d'euros", "5 millions d'euros", "1 million d'euros", "500 000 euros"], "answer": 0, "explanation": "1 million d'actions multiplié par 50 euros donne une capitalisation boursière de 50 millions d'euros."}, {"q": "Que désigne la capitalisation flottante, ou free float ?", "options": ["Les actions qui n'ont pas encore été créées par l'entreprise", "La part des actions effectivement disponible à l'achat et à la vente par le public", "Les actions détenues par les fondateurs et l'État", "Les actions des entreprises en difficulté financière"], "answer": 1, "explanation": "Le flottant correspond à la part des actions réellement disponible pour le public, en excluant notamment les parts des fondateurs, de l'État et des actionnaires majoritaires."}, {"q": "Quel est généralement l'avantage d'un flottant élevé pour une action ?", "options": ["Elle devient automatiquement plus chère", "Elle ne peut plus jamais baisser", "Elle échappe à toute fluctuation du marché", "Elle est plus liquide, donc plus facile à acheter et à revendre"], "answer": 3, "explanation": "Un flottant élevé signifie davantage d'acheteurs et de vendeurs, ce qui rend l'action plus liquide."}, {"q": "Lors d'un split, qu'arrive-t-il à la valeur nominale de chaque action et à la capitalisation boursière de l'entreprise ?", "options": ["Les deux augmentent proportionnellement", "La valeur nominale baisse et la capitalisation boursière reste exactement la même", "La valeur nominale reste inchangée et la capitalisation boursière est divisée", "Les deux sont divisées par deux"], "answer": 1, "explanation": "Le split divise les actions existantes : la valeur nominale de chaque action baisse, mais l'investissement total et la capitalisation boursière restent identiques."}, {"q": "Sur quelle base le MASI est-il calculé ?", "options": ["Le nombre de salariés des entreprises cotées", "Le nombre total d'actions émises depuis la création de la Bourse", "La capitalisation flottante des entreprises", "Le chiffre d'affaires cumulé des sociétés cotées"], "answer": 2, "explanation": "Le MASI est un indice calculé à partir de la capitalisation flottante des entreprises."}, {"q": "Que regroupe le MASI 20 ?", "options": ["Les 20 entreprises ayant la plus forte capitalisation de la Bourse", "Les 20 entreprises introduites en bourse le plus récemment", "Les actions dont le cours est fixé à 20 dirhams", "Les 20 entreprises les plus anciennes de la place"], "answer": 0, "explanation": "Le MASI 20 est un indice plus resserré qui regroupe uniquement les 20 entreprises ayant la plus forte capitalisation boursière."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$pourquoi-investir-et-gerer-le-niveau-de-risque$lyamfi$,
  $lyamfi$Débutant$lyamfi$,
  $lyamfi$Pourquoi investir et gérer le niveau de risque$lyamfi$,
  $lyamfi$Comprendre le rapport risque/rendement, les trois grands risques boursiers, la faillite et le rôle des OPCVM.$lyamfi$,
  $lyamfi$## Épargner ou investir : le grand dilemme

Laisser ton argent dormir sur un compte courant ou un carnet d'**épargne** est très rassurant. C'est très **liquide** : tu peux y accéder à tout moment, et il y a moins de risque de perdre ton capital. Le problème ? Cela rapporte très peu.

À l'inverse, l'**investissement** en bourse t'expose à plus de risques, mais il est associé à un rendement potentiellement beaucoup plus élevé.

C'est ce qu'on appelle en finance le fameux rapport **Risque / Rendement** : il n'y a pas de rendement élevé sans accepter une certaine dose de risque.

## Les 3 grands risques en Bourse

En bourse, il est essentiel de garder à l'esprit qu'il n'y a pas d'investissement sans risque. Voici les trois principaux à connaître.

- Le **risque émetteur** (ou risque spécifique) : c'est le risque lié à la santé de l'entreprise elle-même. Si tu es actionnaire et que l'entreprise va mal (pertes, déclin industriel), son cours va baisser et tu ne toucheras pas de dividendes. Si tu as acheté une obligation, le risque est que l'entreprise ne puisse tout simplement plus te rembourser.
- Le **risque de marché** : c'est le risque que tout le marché baisse en même temps (par exemple lors d'une crise mondiale comme le COVID), peu importe si ton entreprise est en bonne santé ou non. Le cours varie sous l'effet de l'offre et de la demande globale.
- Le **risque de liquidité** : c'est l'incapacité de vendre tes actions rapidement sans faire chuter leur prix. Cela arrive quand une action est très peu demandée, c'est-à-dire quand il y a peu d'acheteurs en face de toi.

Retiens que tous les actifs n'ont pas le même niveau de liquidité : certains titres sont beaucoup moins demandés que d'autres, donc beaucoup plus difficiles à revendre au bon prix.

## Santé de l'entreprise : solvabilité et liquidité

Pour évaluer le risque émetteur, tu dois regarder deux indicateurs clés de l'entreprise.

- La **solvabilité** : c'est la capacité de l'entreprise à payer ses dettes à long terme. Elle mesure la viabilité et la santé financière de l'entreprise sur la durée.
- La **liquidité** : c'est la capacité de l'entreprise à convertir rapidement ses actifs en espèces pour payer ce qu'elle doit à court terme.

Les deux ne disent pas la même chose : une entreprise peut être solide sur le long terme mais manquer d'argent disponible tout de suite, et inversement.

## Le scénario catastrophe : la faillite et la liquidation

Que se passe-t-il si l'entreprise dans laquelle tu as investi va très mal ? Il y a plusieurs étapes.

- D'abord, on tente le **redressement judiciaire**.
- Puis vient la **réorganisation** : on change la stratégie ou on réduit les coûts pour éviter la faillite.
- Si tout cela échoue, c'est la **liquidation** : l'entreprise est dissoute et on vend tout ce qu'elle possède pour rembourser ceux à qui elle doit de l'argent.

L'ordre de remboursement est crucial. On rembourse d'abord l'**État**, puis les **créanciers** (ceux qui détiennent des obligations), et enfin... les **actionnaires**.

En tant qu'actionnaire, tu es donc le tout dernier à être remboursé, et seulement s'il reste de l'argent. C'est pour cela que l'action est un titre plus risqué que l'obligation.

## La solution pour réduire le stress : les OPCVM

Si choisir toi-même tes actions te fait peur, il existe une solution : les **OPCVM**, pour Organismes de Placement Collectif en Valeurs Mobilières.

- C'est un fonds géré par des professionnels.
- Il regroupe l'argent de plusieurs investisseurs.
- Il l'investit dans plein de titres différents : des actions, des obligations, etc.

L'objectif principal de cette technique est de réduire les risques en ne mettant pas tous ses œufs dans le même panier. Tu ne dépends plus du sort d'une seule entreprise, mais d'un ensemble de titres, ce qui atténue le risque émetteur.

## Ce qu'il faut retenir

- L'épargne rassure et reste disponible, mais rapporte peu ; l'investissement rapporte potentiellement plus, en échange de plus de risque.
- Trois risques à surveiller : émetteur, marché, liquidité.
- Solvabilité (long terme) et liquidité (court terme) t'aident à juger la santé d'une entreprise.
- En cas de liquidation, l'actionnaire passe en dernier, après l'État et les créanciers.
- Les OPCVM permettent de diversifier et de confier la gestion à des professionnels.$lyamfi$,
  4,
  $lyamfi$[{"q": "Quelle est la principale différence entre l'épargne classique et l'investissement en bourse ?", "options": ["L'épargne est plus risquée que l'investissement", "L'investissement offre moins de rendement que l'épargne", "L'épargne offre moins de risque mais moins de rendement, tandis que l'investissement expose à plus de risque pour plus de rendement", "L'investissement est toujours plus liquide que l'épargne"], "answer": 2, "explanation": "La leçon oppose l'épargne, rassurante et liquide mais peu rémunératrice, à l'investissement, plus risqué mais au rendement potentiellement bien plus élevé."}, {"q": "En finance, comment appelle-t-on la relation entre le gain espéré et le danger de perdre son argent ?", "options": ["Le rapport Solvabilité / Liquidité", "Le rapport Risque / Rendement", "Le rapport Offre / Demande", "Le rapport Émetteur / Marché"], "answer": 1, "explanation": "C'est le rapport Risque / Rendement : il n'y a pas de rendement élevé sans accepter une certaine dose de risque."}, {"q": "Pour un actionnaire, qu'est-ce que le « risque émetteur » ?", "options": ["Le risque lié à la mauvaise santé de la société, entraînant une baisse du cours et l'absence de dividendes", "Le risque que tout le marché financier s'effondre en même temps", "Le risque de ne trouver personne pour racheter son action", "Le risque que l'entreprise soit rachetée par un concurrent"], "answer": 0, "explanation": "Le risque émetteur, ou risque spécifique, est celui lié à la santé de l'entreprise elle-même : si elle va mal, le cours baisse et les dividendes disparaissent."}, {"q": "Quel est le risque émetteur principal pour quelqu'un qui détient une obligation ?", "options": ["Que l'obligation devienne trop liquide", "Que le marché dans son ensemble baisse", "Que l'entreprise décide de baisser ses prix de vente", "Que l'entreprise ne puisse plus le rembourser"], "answer": 3, "explanation": "Pour un obligataire, le risque émetteur est que l'entreprise ne soit tout simplement plus capable de le rembourser."}, {"q": "Comment définit-on le « risque de marché » ?", "options": ["C'est l'incapacité de vendre un actif rapidement sans casser son prix", "C'est le risque que tout le marché baisse en même temps, comme lors d'une crise mondiale, peu importe la santé de ton entreprise", "C'est le risque que l'entreprise fasse faillite à cause de mauvais produits", "C'est le risque que l'entreprise ne verse pas de dividendes cette année"], "answer": 1, "explanation": "Le risque de marché touche tout le marché en même temps, sous l'effet de l'offre et de la demande globale, indépendamment de la qualité de l'entreprise."}, {"q": "Qu'est-ce que le « risque de liquidité » en bourse ?", "options": ["Le fait qu'une action change de prix toutes les minutes", "Le risque que l'entreprise n'ait plus assez d'argent pour payer ses salariés", "L'incapacité de vendre tes actions rapidement sans faire chuter leur prix, faute d'acheteurs", "Le risque que le dividende versé soit inférieur aux prévisions"], "answer": 2, "explanation": "Le risque de liquidité apparaît quand une action est très peu demandée : tu ne peux pas la vendre vite sans faire chuter son prix."}, {"q": "En analysant une entreprise, que mesure sa « solvabilité » ?", "options": ["Sa capacité à payer ses dettes à long terme, donc sa viabilité dans la durée", "Sa capacité à convertir rapidement ses actifs en espèces", "Le nombre de ses salariés et de ses sites", "Le montant des dividendes qu'elle verse chaque année"], "answer": 0, "explanation": "La solvabilité mesure la capacité de l'entreprise à payer ses dettes à long terme et donc sa santé financière dans la durée."}, {"q": "Si le redressement judiciaire puis la réorganisation échouent, que se passe-t-il pour l'entreprise ?", "options": ["Elle est automatiquement rachetée par l'État", "Elle est obligée d'entrer en bourse", "Elle procède à une augmentation de capital", "C'est la liquidation : elle est dissoute et ses actifs sont vendus pour rembourser ce qu'elle doit"], "answer": 3, "explanation": "La liquidation est la dernière étape : l'entreprise est dissoute et tout ce qu'elle possède est vendu pour rembourser ses créanciers."}, {"q": "En cas de liquidation, dans quel ordre les remboursements sont-ils effectués ?", "options": ["Les actionnaires, puis les créanciers, puis l'État", "L'État, puis les créanciers détenteurs d'obligations, puis les actionnaires", "Les créanciers, puis les actionnaires, puis l'État", "Tout le monde est remboursé en même temps, à parts égales"], "answer": 1, "explanation": "On rembourse d'abord l'État, ensuite les créanciers obligataires, et enfin les actionnaires s'il reste de l'argent."}, {"q": "Que désigne le sigle OPCVM et quel est son objectif principal ?", "options": ["Un contrat d'épargne garanti par l'État, dont le but est d'offrir un rendement fixe", "Une taxe sur les plus-values boursières, dont le but est de financer le marché", "Un Organisme de Placement Collectif en Valeurs Mobilières, dont le but est de regrouper l'argent de plusieurs investisseurs dans différents titres pour réduire les risques", "Un ordre de bourse particulier, dont le but est d'acheter au meilleur prix"], "answer": 2, "explanation": "L'OPCVM est un Organisme de Placement Collectif en Valeurs Mobilières, un fonds géré par des professionnels qui diversifie les placements pour réduire les risques."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$entree-en-bourse-appel-public-a-lepargne$lyamfi$,
  $lyamfi$Intermédiaire$lyamfi$,
  $lyamfi$L'entrée en Bourse (L'Appel Public à l'Épargne)$lyamfi$,
  $lyamfi$Comprendre l'Appel Public à l'Épargne, la différence entre marché primaire et secondaire, et le rôle du Prospectus visé par l'AMMC.$lyamfi$,
  $lyamfi$## Pourquoi une entreprise ouvre ses portes au public

Imagine une belle entreprise marocaine qui a de grands projets de développement, mais qui ne veut plus dépendre uniquement des crédits bancaires. Elle décide de se tourner vers les investisseurs, particuliers comme institutionnels, pour lever des fonds.

En finance, cette démarche porte un nom précis : c'est un **Appel Public à l'Épargne (APE)**.

## L'Appel Public à l'Épargne (APE)

L'APE n'est pas une simple opération commerciale : c'est un **régime juridique et réglementaire très strict**.

- Il encadre le moment où un **émetteur** (l'entreprise) sollicite l'épargne du public pour que celui-ci achète ses **instruments financiers**, c'est-à-dire des actions ou des obligations.
- Il passe notamment par le recours au **démarchage** (des sollicitations non demandées par le client, par exemple une proposition d'actions par téléphone ou en agence), à la **publicité**, ou à l'entremise d'un **intermédiaire financier** chargé de vendre les titres.
- L'avantage pour l'entreprise est clair : elle peut s'adresser à un très grand nombre d'investisseurs potentiels pour financer sa croissance, au lieu de se limiter à quelques bailleurs de fonds.

## Le marché primaire : le marché du « neuf »

L'entrée en bourse se passe sur ce que l'on appelle le **marché primaire**.

- Pour faire simple, le marché primaire, c'est le **marché du neuf** : c'est là que de nouveaux produits sont créés pour de nouveaux acheteurs.
- C'est à cette étape que l'on procède à la **souscription** : tu achètes les actions directement à l'entreprise, lors de leur toute première émission. Cela peut aussi se produire lorsque les actionnaires historiques décident de céder au public une partie de leurs propres titres.
- Point essentiel : l'argent de ton achat va, en grande partie, directement dans les caisses de l'entreprise. C'est bien là que le financement se fait.

## Le marché secondaire : le marché d'« occasion »

Une fois que l'entreprise a fini son introduction en bourse, ses actions commencent à s'échanger tous les jours entre investisseurs. C'est ce qu'on appelle le **marché secondaire**.

- Le marché secondaire désigne celui sur lequel s'organise l'échange de **titres qui existent déjà**. C'est en quelque sorte le marché de la location ou de l'occasion.
- Sur ce marché, si tu achètes une action, l'argent que tu paies ne va plus à l'entreprise : il va à l'investisseur qui te vend son action.

Retiens bien la différence : sur le primaire, l'entreprise se finance ; sur le secondaire, les investisseurs se passent les titres entre eux.

## Le Prospectus et le Visa de l'AMMC : la transparence avant tout

On ne demande pas l'argent du public n'importe comment. L'Appel Public à l'Épargne exige un **niveau de transparence très élevé** de la part de l'entreprise, avec l'obligation de publier une grande quantité d'informations.

- Le tout premier acte officiel qui déclenche le processus d'admission en bourse est l'obtention d'un **Visa** sur un document appelé le **Prospectus**.
- Ce Prospectus est un document d'information indispensable, qui doit être approuvé par les autorités du marché, c'est-à-dire l'**AMMC**.
- Avant la réforme de 2019, ce document s'appelait la **note d'information**.

Depuis 2019, le Prospectus est composé de deux grandes parties :

- Le **document de référence**, qui contient toutes les informations sur la santé et l'activité de l'entreprise. Sa durée de validité est de **9 mois**.
- La **note d'opération**, qui explique les modalités pratiques de l'inscription en bourse et de la vente des titres.

Sans le Visa de l'AMMC sur ce prospectus, l'entreprise n'a tout simplement pas le droit de faire son entrée en bourse.

## À retenir

- L'APE est le cadre strict qui permet à une entreprise de solliciter l'épargne du public pour acheter ses actions ou ses obligations.
- Le marché primaire est celui du neuf : on y souscrit des titres nouvellement émis et l'argent finance l'entreprise.
- Le marché secondaire est celui de l'occasion : on y échange des titres déjà existants, entre investisseurs.
- Rien ne se fait sans transparence : Prospectus visé par l'AMMC, composé du document de référence (valide 9 mois) et de la note d'opération.$lyamfi$,
  5,
  $lyamfi$[{"q": "Que signifie l'acronyme APE en bourse ?", "options": ["Action Publique d'Entreprise", "Appel Public à l'Épargne", "Agence des Prix Économiques", "Autorisation Préalable d'Émission"], "answer": 1, "explanation": "APE est l'abréviation d'Appel Public à l'Épargne, le régime qui encadre la sollicitation de l'épargne du public."}, {"q": "Concrètement, qu'est-ce qu'un Appel Public à l'Épargne ?", "options": ["Une opération par laquelle une entreprise sollicite l'épargne du public pour se financer", "Une aide financière donnée par l'État aux entreprises", "L'interdiction pour une entreprise de vendre ses actions", "Une taxe prélevée sur les comptes d'épargne"], "answer": 0, "explanation": "L'APE est le régime juridique encadrant le moment où un émetteur sollicite l'épargne du public pour qu'il achète ses instruments financiers."}, {"q": "Comment appelle-t-on le marché sur lequel les titres sont émis pour la toute première fois ?", "options": ["Le marché secondaire", "Le marché monétaire", "Le marché primaire", "Le marché de l'occasion"], "answer": 2, "explanation": "Le marché primaire est celui de la première émission des titres, le « marché du neuf »."}, {"q": "Quelle image utilise-t-on souvent pour définir le marché primaire ?", "options": ["C'est le marché de l'occasion", "C'est un casino", "C'est le marché de la location", "C'est le marché du neuf"], "answer": 3, "explanation": "Le marché primaire est présenté comme le marché du neuf, car de nouveaux titres y sont créés pour de nouveaux acheteurs."}, {"q": "Comment s'appelle l'acte d'acheter un titre sur le marché primaire lors de son émission ?", "options": ["La radiation", "La souscription", "La liquidation", "Le démarchage"], "answer": 1, "explanation": "Acheter un titre directement à l'entreprise lors de sa première émission s'appelle la souscription."}, {"q": "Sur le marché secondaire, à qui va l'argent que tu paies quand tu achètes une action ?", "options": ["À l'entreprise émettrice, comme sur le marché primaire", "À l'AMMC, qui redistribue ensuite les fonds", "À l'investisseur qui te vend son action", "Aux salariés de l'entreprise cotée"], "answer": 2, "explanation": "Sur le marché secondaire, les titres existent déjà et l'argent va au vendeur, plus à l'entreprise."}, {"q": "Que se passe-t-il sur le marché secondaire ?", "options": ["Les investisseurs s'échangent des titres qui ont déjà été émis", "L'entreprise crée de nouvelles actions tous les jours", "L'État fixe le prix des actions", "Les entreprises demandent des crédits bancaires"], "answer": 0, "explanation": "Le marché secondaire organise l'échange de titres déjà existants entre investisseurs."}, {"q": "Quel niveau d'exigence s'impose à une entreprise qui réalise un Appel Public à l'Épargne ?", "options": ["Aucune information n'est requise", "L'entreprise fournit seulement son nom et son adresse", "Seules les entreprises étrangères sont contrôlées", "Un niveau de transparence très élevé, avec publication d'une grande quantité d'informations"], "answer": 3, "explanation": "L'APE exige un niveau de transparence très élevé et l'obligation de publier une grande quantité d'informations."}, {"q": "Quel est le tout premier acte officiel qui déclenche le processus d'admission en bourse ?", "options": ["La création d'un site web dédié aux actionnaires", "L'obtention du Visa de l'AMMC sur le Prospectus", "La signature du Directeur de la Bourse de Casablanca", "La première cotation de l'action"], "answer": 1, "explanation": "Le processus d'admission démarre par l'obtention d'un Visa de l'AMMC sur le Prospectus."}, {"q": "Quelle est la durée de validité du document de référence, qui contient les informations sur l'émetteur ?", "options": ["1 mois", "5 ans", "9 mois", "Il est valable à vie"], "answer": 2, "explanation": "Le document de référence, l'une des deux parties du Prospectus depuis 2019, est valide 9 mois."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$analyse-fondamentale-et-ratios-cles$lyamfi$,
  $lyamfi$Intermédiaire$lyamfi$,
  $lyamfi$L'Analyse Fondamentale et les Ratios Clés$lyamfi$,
  $lyamfi$Calculer et interpréter le BPA, le PER et le rendement du dividende pour juger si une action est chère ou bon marché.$lyamfi$,
  $lyamfi$## L'analyse fondamentale : soulever le capot du moteur

En bourse, il existe deux grandes façons de choisir une action. Soit tu regardes uniquement les courbes et les graphiques, c'est l'**analyse technique**. Soit tu regardes la véritable santé financière de l'entreprise, et c'est là qu'intervient l'**analyse fondamentale**.

Le but de l'analyse fondamentale est simple : essayer de déterminer si le prix actuel de l'action en bourse est justifié par rapport à ce que l'entreprise gagne réellement.

Bonne nouvelle : tu n'as pas besoin d'être expert-comptable. Il te suffit de maîtriser trois indicateurs (on parle de **ratios**) incontournables.

## Le BPA : ce que rapporte ta part

Imagine qu'une entreprise réalise un bénéfice net de 10 millions de dirhams à la fin de l'année. C'est bien, mais si l'entreprise a 100 millions d'actions en circulation, ta part du gâteau est minuscule. C'est exactement ce que mesure le **BPA (Bénéfice Par Action)**.

- Le calcul : tu divises le bénéfice net total par le nombre d'actions en circulation.
- L'exemple : si l'entreprise fait 10 millions de DH de bénéfice et qu'il y a 1 million d'actions, le BPA est de 10 DH.
- L'utilité : il t'indique exactement combien de richesse a été créée pour chaque action que tu possèdes.

Le BPA est la base absolue pour savoir si une entreprise est rentable.

## Le PER : le thermomètre de la cherté

Le **PER (Price Earnings Ratio)** est de loin le ratio le plus célèbre en bourse. Il te permet de savoir rapidement si une action est "chère" ou "bon marché".

- Le calcul : tu prends le prix de l'action en bourse et tu le divises par le BPA.
- L'exemple : si l'action se vend 150 DH en bourse et que son BPA est de 10 DH, le PER est de 15 (150 / 10).
- Ce que ça veut dire concrètement : un PER de 15 signifie que tu acceptes de payer 15 années de bénéfices actuels pour acheter l'entreprise.

Comment l'interpréter, généralement :

- Un PER bas (par exemple 8) peut signifier que l'action est sous-évaluée et qu'elle constitue une bonne affaire… ou bien que l'entreprise est en danger.
- Un PER très élevé (par exemple 40) signifie que l'action est très chère, souvent parce que les investisseurs s'attendent à ce que les bénéfices explosent dans le futur, comme pour les entreprises technologiques.

## Le Dividend Yield : le cash immédiat

Certains investisseurs se moquent de savoir si l'action va monter ou baisser dans 10 ans : ils veulent du cash tout de suite. C'est ici qu'intervient le **Dividend Yield (rendement du dividende)**.

- Le calcul : c'est le dividende versé divisé par le prix de l'action, le tout multiplié par 100 pour obtenir un pourcentage.
- L'exemple : tu achètes une action à 100 DH. L'entreprise décide de verser un dividende de 5 DH par action. Le rendement de ton investissement est de 5 %.
- L'utilité : il te permet de comparer cet investissement boursier avec un placement classique, comme un compte épargne à 2 % ou un Bon du Trésor à 3 %.

## La règle d'or : ne compare que ce qui est comparable

Attention au piège classique du débutant : on ne compare jamais le PER d'une banque avec le PER d'une entreprise agroalimentaire ou immobilière.

- Chaque secteur a sa propre dynamique de croissance et de dépenses.
- Une banque comme **Attijariwafa Bank** aura naturellement des ratios très différents d'un opérateur portuaire comme **Marsa Maroc**.
- La règle d'or de l'analyse fondamentale est la **comparaison sectorielle** : si tu veux savoir si le PER d'une banque est intéressant, compare-le avec le PER des autres banques marocaines, ou avec la moyenne historique de cette même banque.

## À retenir

- L'analyse fondamentale cherche à savoir si le prix en bourse est justifié par les résultats réels de l'entreprise.
- Le BPA mesure la rentabilité ramenée à une action : bénéfice net / nombre d'actions.
- Le PER mesure la cherté : prix de l'action / BPA, et s'exprime en "années de bénéfices".
- Le rendement du dividende mesure le cash immédiat : dividende / prix de l'action, en pourcentage.
- Un ratio ne veut rien dire tout seul : il ne prend son sens que comparé au même secteur ou à l'historique de l'entreprise.$lyamfi$,
  6,
  $lyamfi$[{"q": "Quel est l'objectif principal de l'analyse fondamentale ?", "options": ["Étudier uniquement les graphiques pour deviner si l'action va monter demain", "Évaluer la véritable santé financière de l'entreprise pour savoir si son prix en bourse est justifié", "Calculer les impôts que l'entreprise devra payer à la fin de l'année", "Trouver le moment exact où le marché va s'effondrer"], "answer": 1, "explanation": "L'analyse fondamentale regarde la santé financière réelle de l'entreprise pour juger si le prix actuel de l'action est justifié."}, {"q": "Que signifie l'acronyme BPA ?", "options": ["Bilan Prévisionnel Annuel", "Bon de Participation Auxiliaire", "Bénéfice Par Action", "Banque Privée d'Achat"], "answer": 2, "explanation": "BPA est l'abréviation de Bénéfice Par Action."}, {"q": "Comment calcule-t-on le BPA ?", "options": ["On divise le bénéfice net total par le nombre d'actions en circulation", "On divise le chiffre d'affaires par le nombre d'employés de l'entreprise", "On multiplie le prix de l'action par le bénéfice net de l'année", "On divise le prix de l'action par le dividende versé"], "answer": 0, "explanation": "Le BPA s'obtient en divisant le bénéfice net total par le nombre d'actions en circulation."}, {"q": "Une entreprise réalise 50 millions de dirhams de bénéfice net et compte 5 millions d'actions en circulation. Quel est son BPA ?", "options": ["5 DH", "25 DH", "250 DH", "10 DH"], "answer": 3, "explanation": "50 millions divisés par 5 millions d'actions donnent un BPA de 10 DH."}, {"q": "Comment calcule-t-on le PER d'une entreprise ?", "options": ["Dividende versé divisé par le prix de l'action", "Prix de l'action divisé par le BPA", "Prix de l'action multiplié par le nombre d'actions en circulation", "Bénéfice net divisé par le montant total des dettes"], "answer": 1, "explanation": "Le PER se calcule en divisant le prix de l'action en bourse par le Bénéfice Par Action."}, {"q": "Une action se vend 150 DH et son BPA est de 10 DH. Que signifie concrètement son PER ?", "options": ["Que l'action versera 15 % de dividende cette année", "Que l'action a progressé de 15 % depuis le début de l'année", "Que tu acceptes de payer 15 années de bénéfices actuels pour acheter l'entreprise", "Que l'entreprise est cotée en bourse depuis 15 ans"], "answer": 2, "explanation": "Un PER de 15 signifie que tu paies l'équivalent de 15 années de bénéfices actuels de l'entreprise."}, {"q": "Que peut signifier, généralement, un PER très élevé comme 40 ?", "options": ["L'action est chère car les investisseurs attendent une forte hausse future des bénéfices", "L'action est sous-évaluée et représente une bonne affaire évidente", "L'entreprise ne verse jamais de dividende à ses actionnaires", "Le bénéfice par action est obligatoirement négatif"], "answer": 0, "explanation": "Un PER très élevé traduit une action chère, souvent parce que les investisseurs anticipent une explosion des bénéfices futurs."}, {"q": "Tu achètes une action à 200 DH et l'entreprise te verse un dividende de 10 DH par action. Quel est le rendement du dividende ?", "options": ["10 %", "2 %", "20 %", "5 %"], "answer": 3, "explanation": "10 divisé par 200 puis multiplié par 100 donne un rendement du dividende de 5 %."}, {"q": "Pourquoi le rendement du dividende est-il utile ?", "options": ["Il garantit que le cours de l'action va monter dans les mois à venir", "Il permet de comparer l'action avec un placement classique comme un compte épargne ou un Bon du Trésor", "Il remplace complètement le calcul du BPA et du PER", "Il indique depuis combien d'années l'entreprise est rentable"], "answer": 1, "explanation": "Le rendement du dividende sert justement à comparer le cash reçu avec d'autres placements, comme un compte épargne à 2 % ou un Bon du Trésor à 3 %."}, {"q": "Quelle est la règle d'or de l'analyse fondamentale quand on utilise le PER ?", "options": ["Acheter systématiquement l'entreprise dont le PER est le plus bas de toute la bourse", "Ignorer le PER dès que le BPA dépasse 10 DH par action", "Ne comparer le PER qu'entre entreprises du même secteur, ou avec l'historique de l'entreprise", "Additionner le PER et le rendement du dividende pour obtenir un score unique"], "answer": 2, "explanation": "La règle d'or est la comparaison sectorielle : le PER d'une banque se compare à celui d'autres banques ou à sa propre moyenne historique."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$augmentation-de-capital-et-dps$lyamfi$,
  $lyamfi$Intermédiaire$lyamfi$,
  $lyamfi$L'Augmentation de Capital et le DPS$lyamfi$,
  $lyamfi$Comprendre l'augmentation de capital, l'effet de dilution et le rôle du DPS dans une souscription irréductible ou réductible.$lyamfi$,
  $lyamfi$## L'augmentation de capital en numéraire

Quand une entreprise a besoin d'argent pour financer un nouveau projet, elle peut décider de réaliser une **augmentation de capital en numéraire**.

En termes simples, cela veut dire qu'elle crée de **nouvelles actions** et qu'elle les vend contre de l'argent frais. Le capital de la société augmente, et le nombre total d'actions en circulation augmente lui aussi.

## Les trois façons de réaliser l'opération

L'entreprise a trois grandes possibilités pour ouvrir son capital :

- **Avec Droit Préférentiel de Souscription (DPS)** : l'opération est réservée en priorité aux actionnaires actuels de l'entreprise.

- **Destinée au public sans distinction** : tout le monde peut acheter, et le privilège (le DPS) des anciens actionnaires est supprimé.

- **L'augmentation réservée** : l'entreprise supprime le privilège de ses actionnaires pour vendre directement les nouvelles actions à un investisseur bien précis. Cela reste très rare.

## L'effet de dilution : ta part du gâteau diminue

Pourquoi cette histoire de privilège est-elle si importante ? À cause de l'**effet de dilution**.

Imagine que tu possèdes 5 actions d'une entreprise qui en compte 100 au total. Tu détiens donc 5 % de la société.

Si l'entreprise crée 10 nouvelles actions pour lever de l'argent, il y a désormais 110 actions au total. Si tu n'achètes aucune de ces nouvelles actions et que tu restes avec tes 5 actions, tu ne possèdes plus que 4,5 % de l'entreprise (5 sur 110) ! Ton pouvoir et ta part dans l'entreprise ont été « dilués ».

Attention cependant : cela ne veut pas dire que tu perds de l'argent. Le prix de l'action reste le même, c'est uniquement ton **pourcentage de contrôle** dans l'entreprise qui diminue.

À noter que le phénomène inverse s'appelle l'effet de **relution**.

## Le DPS : le bouclier de l'actionnaire

Pour protéger les anciens actionnaires contre cette dilution, la loi leur accorde un **Droit Préférentiel de Souscription (DPS)**.

- **Le principe** : si tu possèdes 100 actions, tu reçois automatiquement 100 DPS. Ces DPS te donnent la priorité absolue pour acheter les nouvelles actions avant le grand public.

- **La revente** : si tu ne veux pas, ou si tu ne peux pas acheter ces nouvelles actions, tu n'es pas bloqué. Un DPS a de la valeur et peut être vendu en bourse à d'autres investisseurs !

Le DPS n'est donc jamais une obligation : soit tu l'utilises pour maintenir ta part dans l'entreprise, soit tu le vends à quelqu'un d'autre.

## Souscription irréductible et souscription réductible

Au moment d'acheter les nouvelles actions, ce qu'on appelle la **souscription**, on distingue deux étapes.

- **La souscription à titre irréductible** : si tu utilises tes propres DPS pour acheter les actions auxquelles tu as droit, tu es assuré à 100 % de les obtenir. C'est garanti, car l'offre de nouveaux titres correspond exactement au nombre de DPS créés.

- **La souscription à titre réductible** : une fois que tu as utilisé tes droits, tu peux demander à acheter encore plus d'actions, parmi celles qui n'auraient pas été réclamées par les autres actionnaires. On l'appelle « réductible » car, si la demande globale est trop forte par rapport aux actions restantes, ta demande sera réduite proportionnellement pour satisfaire tout le monde.

## À retenir

- Une augmentation de capital en numéraire = création de nouvelles actions vendues contre de l'argent.

- Sans participation de ta part, ta part relative baisse : c'est la dilution, l'inverse de la relution.

- Le DPS est ton bouclier : une priorité d'achat, automatique, proportionnelle à ton nombre d'actions, et revendable en bourse.

- Avec tes DPS (irréductible), tu es certain d'obtenir tes actions. Au-delà de tes droits (réductible) ou sans DPS dans une offre au public, tout dépend de la demande générale.$lyamfi$,
  7,
  $lyamfi$[{"q": "Qu'est-ce qu'une « augmentation de capital en numéraire » ?", "options": ["Le rachat par l'entreprise de ses propres actions", "La création de nouvelles actions vendues contre de l'argent frais", "Une hausse obligatoire des salaires des employés", "Le remboursement anticipé des dettes de l'entreprise"], "answer": 1, "explanation": "Le cours définit l'augmentation de capital en numéraire comme la création de nouvelles actions vendues contre de l'argent frais."}, {"q": "Combien de grandes possibilités l'entreprise a-t-elle pour réaliser cette opération, selon le cours ?", "options": ["Une seule", "Deux", "Trois", "Cinq"], "answer": 2, "explanation": "Le cours présente trois possibilités : avec DPS, destinée au public sans distinction, ou réservée."}, {"q": "Dans une augmentation de capital avec DPS, à qui l'opération est-elle réservée en priorité ?", "options": ["Aux salariés de l'entreprise", "Aux investisseurs étrangers", "Aux banques créancières de l'entreprise", "Aux actionnaires actuels de l'entreprise"], "answer": 3, "explanation": "Le DPS réserve l'opération en priorité aux actionnaires actuels de l'entreprise."}, {"q": "Tu possèdes 5 actions sur 100 et l'entreprise crée 10 actions nouvelles que tu n'achètes pas. Quel est ton nouveau pourcentage ?", "options": ["4,5 %", "5 %", "5,5 %", "10 %"], "answer": 0, "explanation": "Avec 5 actions sur un total désormais de 110, ta part passe de 5 % à 4,5 %."}, {"q": "Que se passe-t-il pour le prix de l'action lors de l'effet de dilution décrit dans le cours ?", "options": ["Il tombe automatiquement à zéro", "Il reste le même, seul ton pourcentage de détention diminue", "Il double mécaniquement", "Il est fixé par l'État pour compenser la dilution"], "answer": 1, "explanation": "Le cours précise que la dilution ne te fait pas perdre d'argent : le prix reste le même, c'est le pourcentage de contrôle qui baisse."}, {"q": "Comment s'appelle le phénomène strictement inverse de la dilution ?", "options": ["La dissolution", "La spéculation", "La relution", "La souscription"], "answer": 2, "explanation": "Le cours indique que le phénomène inverse de la dilution s'appelle l'effet de relution."}, {"q": "Un actionnaire qui détient 100 actions reçoit combien de DPS ?", "options": ["100 DPS", "10 DPS", "1 DPS", "Aucun, les DPS s'achètent séparément"], "answer": 0, "explanation": "Le principe est un DPS par action détenue, donc 100 actions donnent 100 DPS."}, {"q": "Que peux-tu faire si tu ne veux pas ou ne peux pas utiliser tes DPS ?", "options": ["Rien, ils sont détruits sans compensation", "Les échanger contre des obligations d'État", "Les transférer obligatoirement à l'entreprise", "Les vendre en bourse à d'autres investisseurs"], "answer": 3, "explanation": "Le cours souligne qu'un DPS a de la valeur et peut être vendu en bourse à d'autres investisseurs."}, {"q": "Pourquoi la souscription à titre irréductible offre-t-elle une certitude de 100 % ?", "options": ["Parce que l'État garantit chaque transaction boursière", "Parce que l'offre de nouveaux titres correspond exactement au nombre de DPS créés", "Parce que les autres investisseurs ont interdiction de participer", "Parce que l'entreprise crée des actions en quantité illimitée"], "answer": 1, "explanation": "La garantie vient du fait que le nombre de titres offerts correspond exactement au nombre de DPS créés."}, {"q": "Dans une souscription à titre réductible, que se passe-t-il si la demande globale dépasse les actions restantes ?", "options": ["L'opération est purement et simplement annulée", "Les actions sont attribuées par tirage au sort", "Les demandes sont réduites proportionnellement entre les souscripteurs", "L'entreprise crée immédiatement des actions supplémentaires"], "answer": 2, "explanation": "Le terme « réductible » vient justement du fait que les demandes sont réduites proportionnellement quand la demande est trop forte."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$strategies-et-suivi-de-portefeuille$lyamfi$,
  $lyamfi$Intermédiaire$lyamfi$,
  $lyamfi$Stratégies & Suivi de Portefeuille$lyamfi$,
  $lyamfi$Choisir ta stratégie (rendement ou croissance), investir par DCA, diversifier tes secteurs et rééquilibrer ton portefeuille.$lyamfi$,
  $lyamfi$## Choisir ton style : rendement ou croissance ?

Avant d'acheter ta première action, tu dois définir ton objectif. En bourse, il existe deux grandes stratégies d'investissement.

- **La stratégie de rendement** (Value / Dividendes) : tu cibles des entreprises « matures » et très rentables, comme de grandes banques ou des opérateurs télécoms. Elles grandissent doucement, mais elles reversent chaque année une grande partie de leurs bénéfices sous forme de **dividendes**. C'est l'idéal pour te créer un revenu passif régulier.

- **La stratégie de croissance** (Growth) : tu cibles des entreprises en pleine expansion. Elles ne versent souvent aucun dividende, car elles réinvestissent 100 % de leurs bénéfices pour grandir encore plus vite. Ton but n'est pas de toucher une rente annuelle, mais de voir le prix de l'action exploser dans 5 ou 10 ans, pour faire une grosse **plus-value** à la revente.

Aucune des deux n'est « meilleure » : elles répondent simplement à deux objectifs différents, le revenu régulier d'un côté, le gain futur à la revente de l'autre.

## Le secret pour ne plus stresser : le DCA

Le plus grand piège en bourse est d'essayer de deviner le « bon moment » pour acheter : c'est ce qu'on appelle le **market timing**. C'est impossible, même pour les professionnels.

La solution s'appelle le **DCA** (Dollar-Cost Averaging), ou investissement programmé.

- Le principe : tu investis une somme fixe, à intervalle régulier (par exemple 1 000 DH tous les 5 du mois), peu importe si la bourse est en hausse ou en baisse.

- La magie mathématique : quand l'action est chère, tes 1 000 DH achètent peu d'actions. Quand l'action s'effondre et que tout le monde panique, tes mêmes 1 000 DH achètent beaucoup plus d'actions.

- Le résultat : sur le long terme, cela « lisse » ton prix d'achat moyen et élimine totalement le stress de la décision. Tu n'as plus à te demander si c'est le bon jour pour acheter.

## La diversification : ne pas mettre tous tes œufs dans le même panier

Si tu investis tout ton argent dans 3 entreprises immobilières et que le secteur de l'immobilier entre en crise, ton portefeuille est ruiné. Détenir plusieurs sociétés d'un même secteur ne te protège pas : elles réagissent toutes de la même façon à la même crise.

- La solution : la **diversification sectorielle**. Sur la Bourse de Casablanca, tu dois répartir ton argent entre des secteurs qui ne réagissent pas de la même manière aux crises.

- Par exemple : un peu de Banques, un peu de BTP/Cimenteries, un peu d'Agroalimentaire et un peu de Télécoms.

- L'idée est simple : si un secteur va mal, les autres compenseront la perte.

## Le suivi et le rééquilibrage

Un portefeuille boursier, c'est comme un jardin : il faut l'entretenir un minimum. Une à deux fois par an suffisent.

- Le **rééquilibrage** (rebalancement) : imagine que tu avais décidé d'avoir 50 % de banques et 50 % de BTP. Si les actions bancaires ont explosé cette année, elles représentent peut-être maintenant 70 % de ton portefeuille. Tu prends alors trop de risques sur ce seul secteur.

- Le geste à faire : vendre un peu de tes actions bancaires, pour encaisser tes gains, et racheter du BTP afin de revenir à ta cible de 50/50.

## L'effet boule de neige

Pour que ton portefeuille grandisse vite, la règle d'or est de **réinvestir tes dividendes**.

- Au lieu de dépenser les dividendes reçus, utilise-les pour racheter de nouvelles actions.

- Ces nouvelles actions généreront à leur tour de nouveaux dividendes l'année suivante, qui rachèteront encore des actions.

- C'est la force des **intérêts composés** : le moteur qui transforme un petit investissement régulier en un vrai capital sur le long terme.

## À retenir

- Définis d'abord ton objectif : revenu régulier (rendement) ou plus-value future (croissance).

- Oublie le market timing, préfère le DCA : une somme fixe, à date fixe, quoi qu'il arrive.

- Répartis ton argent entre plusieurs secteurs, pas seulement entre plusieurs sociétés.

- Rééquilibre une à deux fois par an et réinvestis systématiquement tes dividendes.$lyamfi$,
  8,
  $lyamfi$[{"q": "Quelle stratégie consiste à cibler des entreprises matures et très rentables qui reversent chaque année une grande partie de leurs bénéfices ?", "options": ["La stratégie de croissance (Growth)", "La stratégie de rendement (Value / Dividendes)", "Le market timing", "Le rééquilibrage sectoriel"], "answer": 1, "explanation": "La stratégie de rendement vise des entreprises matures, comme de grandes banques ou des opérateurs télécoms, qui distribuent une grande partie de leurs bénéfices en dividendes."}, {"q": "Pourquoi les entreprises visées par la stratégie de croissance ne versent-elles souvent aucun dividende ?", "options": ["Parce que la loi interdit aux jeunes entreprises de distribuer un dividende", "Parce qu'elles sont trop matures et que leurs actionnaires préfèrent une revente rapide", "Parce qu'elles réinvestissent 100 % de leurs bénéfices pour grandir plus vite", "Parce qu'elles doivent d'abord rembourser leurs actionnaires historiques"], "answer": 2, "explanation": "Les entreprises en pleine expansion réinvestissent la totalité de leurs bénéfices dans leur croissance au lieu de les distribuer."}, {"q": "Tu places 100 % de ton épargne dans trois entreprises immobilières différentes. Es-tu bien diversifié ?", "options": ["Non : elles dépendent toutes du même secteur", "Oui, car trois sociétés différentes suffisent toujours à répartir correctement le risque", "Oui, car l'immobilier est présenté comme le secteur le plus sûr de la Bourse de Casablanca", "Non, car la leçon impose de détenir au minimum cinquante sociétés cotées"], "answer": 0, "explanation": "Trois entreprises d'un même secteur réagissent de la même façon à une crise de ce secteur, donc le portefeuille n'est pas diversifié."}, {"q": "Que désigne le « market timing », présenté comme le plus grand piège en bourse ?", "options": ["Le fait d'investir une somme fixe à intervalle régulier", "Le fait de répartir son argent entre plusieurs secteurs d'activité", "Le fait de ramener son portefeuille à ses pourcentages cibles", "Le fait d'essayer de deviner le « bon moment » pour acheter"], "answer": 3, "explanation": "Le market timing consiste à tenter de deviner le bon moment pour acheter, ce qui est impossible même pour les professionnels."}, {"q": "Que signifie l'acronyme DCA ?", "options": ["Dividende Capitalisé Annuel", "Dollar-Cost Averaging", "Diversification Contrôlée des Actifs boursiers", "Dotation de Croissance Accélérée du portefeuille"], "answer": 1, "explanation": "DCA signifie Dollar-Cost Averaging, c'est-à-dire l'investissement programmé."}, {"q": "Lequel de ces comportements illustre correctement le principe du DCA ?", "options": ["Investir tout ton capital le jour où le marché a le plus baissé", "N'investir que les mois où la bourse est clairement en hausse", "Investir 1 000 DH tous les 5 du mois, que la bourse monte ou baisse", "Attendre un signal de ta société de bourse avant chaque versement"], "answer": 2, "explanation": "Le DCA consiste à investir une somme fixe à intervalle régulier, sans tenir compte de l'état du marché."}, {"q": "Avec le DCA, que se passe-t-il quand l'action s'effondre et que tout le monde panique ?", "options": ["Ta somme fixe achète beaucoup plus d'actions", "Ta somme fixe achète moins d'actions qu'en période de hausse", "Ton versement mensuel est automatiquement suspendu par la banque", "Tes actions sont automatiquement transformées en dividendes"], "answer": 0, "explanation": "Comme le prix baisse, la même somme fixe permet d'acheter un plus grand nombre d'actions."}, {"q": "Quels secteurs la leçon cite-t-elle en exemple pour diversifier un portefeuille sur la Bourse de Casablanca ?", "options": ["Banques, assurances, immobilier et tourisme", "Télécoms, mines, pêche et textile", "Agroalimentaire, transport aérien, hôtellerie et santé", "Banques, BTP/Cimenteries, Agroalimentaire et Télécoms"], "answer": 3, "explanation": "L'exemple donné répartit l'argent entre Banques, BTP/Cimenteries, Agroalimentaire et Télécoms."}, {"q": "Ta cible était 50 % banques et 50 % BTP, mais après une forte hausse les banques pèsent 70 % de ton portefeuille. Que fais-tu pour rééquilibrer ?", "options": ["Rien du tout, et tu laisses les banques monter jusqu'à occuper tout ton portefeuille", "Tu vends une partie des banques et tu rachètes du BTP", "Tu vends ton BTP pour renforcer encore davantage la position bancaire gagnante", "Tu empruntes de l'argent pour acheter du BTP sans toucher à tes actions bancaires"], "answer": 1, "explanation": "Le rééquilibrage consiste à vendre une partie du secteur qui a trop grossi pour encaisser les gains et racheter l'autre secteur, afin de revenir à la cible 50/50."}, {"q": "Comment s'appelle le mécanisme qui se déclenche lorsque tu réinvestis tes dividendes année après année ?", "options": ["Le market timing", "La diversification sectorielle", "La force des intérêts composés", "Le rééquilibrage annuel du portefeuille"], "answer": 2, "explanation": "Réinvestir les dividendes pour racheter des actions qui produiront à leur tour des dividendes, c'est l'effet boule de neige des intérêts composés."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$cotation-au-quotidien$lyamfi$,
  $lyamfi$Avancé$lyamfi$,
  $lyamfi$La cotation au quotidien$lyamfi$,
  $lyamfi$Comprendre le déroulé d'une séance à la Bourse de Casablanca : marché central, marché de blocs, seuils, continu, fixing et CTO.$lyamfi$,
  $lyamfi$## Deux salles, deux ambiances : marché central et marché de blocs

À la Bourse de Casablanca, toutes les transactions ne se font pas au même endroit. Le marché est divisé en deux segments principaux.

- Le **Marché Central** : c'est la place publique. C'est une plateforme transparente où les ordres d'achat et de vente de taille « standard » sont visibles par tous les participants dans le **carnet d'ordres**. C'est ici que passent les investisseurs particuliers, donc toi.

- Le **Marché de Blocs** : c'est le salon VIP, réservé aux investisseurs institutionnels (fonds, banques). Il accueille les transactions de très grande taille, celles qui dépassent une **Taille Minimum de Blocs (TMB)** fixée par la bourse. Ces échanges se font de **gré à gré**, c'est-à-dire directement entre deux parties.

Pourquoi séparer les deux ? Si un très gros investisseur achetait des millions d'actions d'un coup sur le marché central, le prix exploserait à la hausse. Le marché de blocs permet d'éviter cette volatilité et de ne pas perturber les cours publics.

## Les limitations de vitesse : le couloir de cotation

En bourse, une action ne peut pas voir son prix chuter de 80 % ou monter de 100 % en une seule journée. Il existe des garde-fous appelés **couloirs de cotation**, ou **Seuils de Variation (SDV)**.

- Pour les actions du marché central, le prix ne peut varier que dans une limite de **± 10 %** par rapport au cours de la veille, appelé **cours de référence**.

- Il y a donc un **seuil haut** (+ 10 %) et un **seuil bas** (− 10 %).

- Si tu proposes un prix en dehors de cette limite, ton ordre peut rester dans le carnet pour obtenir une priorité dans le temps, mais il ne sera exécuté que lorsque le prix rentrera dans cette plage.

- À noter : dans le marché de blocs, la plage de variation autorisée est plus large que sur le marché central.

## Le rythme de la bourse : continu ou fixing

Toutes les actions ne suscitent pas le même engouement. Pour gérer cela, la bourse utilise deux systèmes de cotation.

- Le **Continu** : réservé aux actions **liquides**, celles qui sont très demandées. Après l'ouverture de la bourse (9h30), les cours fluctuent et les transactions s'exécutent en temps réel tout au long de la journée, dès qu'un acheteur et un vendeur tombent d'accord.

- Le **Fixing** : réservé aux actions **peu liquides**, celles qui sont peu demandées. Au lieu de coter toute la journée, la bourse accumule les ordres silencieusement et procède à une seule confrontation, à une heure précise, pour fixer un prix unique pour la séance.

## L'ouverture du marché : le CTO

Avant même que les transactions ne commencent le matin, l'algorithme de la bourse accumule les ordres et calcule le **Cours Théorique d'Ouverture (CTO)**.

- L'objectif de l'algorithme est simple : il cherche le prix exact qui permettra d'exécuter la plus grande quantité d'actions possible. Le cours retenu **maximise toujours les quantités échangées**.

- Si le CTO calculé dépasse le seuil haut (+ 10 %) ou le seuil bas (− 10 %), le cours de marché sera fixé au seuil correspondant, afin de limiter les fluctuations.

- S'il n'y a aucune compatibilité entre les acheteurs et les vendeurs (par exemple si les acheteurs proposent 100 DH alors que les vendeurs exigent 120 DH), alors il n'y a pas de transaction, et le CTO n'existe tout simplement pas pour cette séance.

## Ce qu'il faut retenir

- Marché central pour les ordres standards et publics, marché de blocs pour les très gros volumes de gré à gré.
- ± 10 % de variation maximum par séance sur le marché central, calculés sur le cours de référence de la veille.
- Continu pour les valeurs liquides, fixing pour les valeurs peu liquides.
- Le CTO est le prix d'ouverture qui maximise les échanges, et il peut ne pas exister si l'offre et la demande sont incompatibles.$lyamfi$,
  9,
  $lyamfi$[{"q": "Sur quel marché les ordres sont-ils publics, transparents et visibles par tous dans le carnet d'ordres ?", "options": ["Le marché de blocs", "Le marché central", "Le marché monétaire", "Le marché de gré à gré"], "answer": 1, "explanation": "Le marché central est la place publique où les ordres de taille standard sont visibles par tous les participants."}, {"q": "Que signifie le sigle TMB dans le contexte du marché de blocs ?", "options": ["Taxe Mensuelle Boursière", "Taux Marginal de Base", "Taille Minimum de Blocs", "Titre Marocain de Bourse"], "answer": 2, "explanation": "La TMB est la Taille Minimum de Blocs, le seuil de taille fixé par la bourse au-delà duquel une transaction passe par le marché de blocs."}, {"q": "Pourquoi les très grandes transactions ne passent-elles pas par le marché central ?", "options": ["Pour éviter de perturber les cours publics et de créer une forte volatilité", "Parce que ces actions ne sont pas cotées à Casablanca", "Parce que l'algorithme du fixing les refuse systématiquement", "Parce que les particuliers y sont interdits d'accès"], "answer": 0, "explanation": "Un achat massif d'un coup sur le marché central ferait exploser le prix, et le marché de blocs évite cette volatilité."}, {"q": "Quelle est la limite classique de variation d'une action sur le marché central au cours d'une séance ?", "options": ["± 1 %", "± 35 %", "Il n'y a aucune limite", "± 10 %"], "answer": 3, "explanation": "Sur le marché central, le prix ne peut varier que de ± 10 % par rapport au cours de la veille."}, {"q": "Par rapport à quel prix ce seuil de ± 10 % est-il calculé ?", "options": ["Le prix de l'action à sa création", "Le cours de la veille, appelé cours de référence", "Le prix moyen des douze derniers mois", "Le prix le plus bas de l'année"], "answer": 1, "explanation": "Le couloir de cotation se calcule à partir du cours de la veille, qui sert de cours de référence."}, {"q": "Que devient un ordre placé à un prix situé en dehors du couloir de cotation ?", "options": ["Il peut rester dans le carnet et n'être exécuté que si le prix revient dans la plage", "Il est automatiquement transféré vers le marché de blocs pour y être exécuté", "Il est exécuté immédiatement au niveau du seuil haut ou du seuil bas", "Il entraîne la suspension de la cotation de la valeur concernée"], "answer": 0, "explanation": "Un tel ordre reste dans le carnet, où il garde une priorité dans le temps, mais il n'est exécuté que lorsque le prix rentre dans la plage autorisée."}, {"q": "S'il n'y a aucune compatibilité entre acheteurs et vendeurs avant l'ouverture, que se passe-t-il ?", "options": ["Le prix de la séance est tiré au hasard par l'algorithme", "L'État achète les actions restantes", "Il n'y a pas de transaction et le CTO n'existe pas pour cette séance", "Le cours de l'action est automatiquement divisé par deux"], "answer": 2, "explanation": "Si les prix demandés et offerts ne se croisent pas, aucune transaction n'a lieu et le Cours Théorique d'Ouverture n'existe pas pour la séance."}, {"q": "À quelles valeurs la cotation en continu est-elle réservée ?", "options": ["Aux actions peu liquides et peu demandées", "Uniquement aux transactions de gré à gré", "Aux valeurs cotées exclusivement le matin", "Aux actions liquides, c'est-à-dire très demandées"], "answer": 3, "explanation": "Le continu est réservé aux actions liquides, dont les cours fluctuent et s'échangent en temps réel toute la journée."}, {"q": "Quelle est la particularité du système de fixing ?", "options": ["Il fixe un nouveau prix toutes les cinq minutes", "Il accumule les ordres pour une seule confrontation et un prix unique par séance", "Il est réservé aux échanges de devises", "Il supprime toute limite de variation de cours"], "answer": 1, "explanation": "Au fixing, la bourse accumule les ordres puis procède à une unique confrontation qui fixe un seul cours pour la séance."}, {"q": "Quel est le but principal de l'algorithme qui calcule le Cours Théorique d'Ouverture ?", "options": ["Maximiser les quantités d'actions échangées", "Vendre les actions au prix le plus élevé possible", "Avantager les vendeurs par rapport aux acheteurs", "Protéger les actionnaires majoritaires"], "answer": 0, "explanation": "L'algorithme cherche le prix qui permet d'exécuter la plus grande quantité d'actions possible."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$marche-de-la-dette-obligations$lyamfi$,
  $lyamfi$Avancé$lyamfi$,
  $lyamfi$Le marché de la dette (Obligations)$lyamfi$,
  $lyamfi$Comprendre comment se forme le prix d'une obligation, mesurer la prime de risque, le coupon couru, le taux réel et l'amortissement.$lyamfi$,
  $lyamfi$## Pourquoi le prix d'une obligation bouge

Contrairement aux actions, dont le prix dépend directement des performances de l'entreprise, le prix d'une **obligation** dépend des taux d'intérêt.

Imagine que tu achètes une obligation qui rapporte 3% et que les taux généraux du marché montent soudainement à 5%. Ton titre devient beaucoup moins intéressant que les nouvelles obligations émises. Pour réussir à le revendre, tu devras baisser son prix.

Retiens cette règle d'or : quand les taux du marché montent, la valeur des obligations à taux fixe existantes diminue, et inversement. C'est une mécanique inversée.

## Taux fixe ou taux variable

- **Obligation à taux fixe** : le taux d'intérêt (le **coupon**) est décidé à l'avance et ne change jamais pendant toute la vie du titre. C'est ce type d'obligation qui subit de plein fouet la mécanique inversée décrite plus haut.

- **Obligation à taux variable** : ici, le taux d'intérêt s'ajuste régulièrement en fonction du marché (comme le taux directeur de la banque centrale). Le rendement évolue donc avec l'économie.

## Évaluer le risque : la prime de risque

Le titre financier considéré comme « sans risque » par excellence est le **Bon du Trésor**, car on estime que l'État fait très rarement faillite.

- Pour évaluer si une obligation d'entreprise (privée) est intéressante, on compare son rendement à celui d'un Bon du Trésor de même durée (même maturité).

- La différence de rendement entre les deux s'appelle la **prime de risque**, ou **spread de crédit**. C'est la rémunération supplémentaire que tu exiges pour accepter le risque de prêter à une entreprise plutôt qu'à l'État.

- En finance, cette prime se mesure en **points de base (pbs)**, où 100 points de base correspondent à 1%. Par exemple, si l'État offre 3% et l'entreprise 5%, la prime de risque est de 200 pbs, soit 2%.

- En période d'incertitude économique, les primes de risque augmentent généralement, car les investisseurs exigent une rémunération plus élevée pour accepter le risque.

## Revendre avant l'heure : le coupon couru

Que se passe-t-il si tu revends ton obligation au milieu de l'année, avant la date anniversaire du versement du coupon ? Rassure-toi, tu ne perds pas tes intérêts.

- On calcule alors le **coupon couru**, aussi appelé « pied de coupon ». Il représente les intérêts que tu as accumulés, jour après jour, depuis le dernier versement.

- L'acheteur de ton obligation devra te payer ce coupon couru **en plus** du prix de l'obligation.

- La formule est : coupon couru = valeur nominale (N) multipliée par le taux d'intérêt (Ti), divisée par 365, puis multipliée par le nombre de jours courus.

## L'ennemi invisible : l'inflation

Il ne faut pas confondre le taux affiché et ce que tu gagnes réellement.

- Le **taux facial** (ou nominal) : c'est le pourcentage théorique inscrit sur l'obligation au moment de son émission, par exemple 5% par an.

- Le **taux réel** : c'est ton véritable gain en pouvoir d'achat. On le calcule simplement en soustrayant l'inflation du taux facial. Si l'inflation est de 2%, ton obligation à 5% ne te rapporte réellement que 3%.

## Comment récupère-t-on son capital ? L'amortissement

L'émetteur a plusieurs façons de te rembourser ton argent, c'est-à-dire le capital.

- **In fine** : l'entreprise te paie uniquement les intérêts chaque année, et te rembourse la totalité du capital en une seule fois, tout à la fin.

- **Série égale annuelle** : chaque année, l'entreprise te verse tes intérêts plus une petite partie de ton capital. Pour l'émetteur, l'avantage est d'éviter de sortir une énorme somme d'argent d'un seul coup à l'échéance : c'est un lissage de la trésorerie.

- **Perpétuelle** : l'obligation n'a pas de date de fin. L'entreprise ne rembourse jamais le capital, mais te verse des intérêts indéfiniment.

## À retenir

- Le prix d'une obligation à taux fixe évolue à l'inverse des taux du marché.
- La prime de risque se mesure en points de base, et 100 pbs valent 1%.
- Le coupon couru te garantit les intérêts accumulés même si tu revends avant la date de versement.
- Seul le taux réel, après inflation, mesure ton vrai gain.
- Le mode d'amortissement détermine quand et comment tu récupères ton capital.$lyamfi$,
  10,
  $lyamfi$[{"q": "Pour une obligation à taux fixe, que se passe-t-il si les taux d'intérêt du marché augmentent fortement ?", "options": ["Sa valeur sur le marché augmente mécaniquement", "Sa valeur sur le marché diminue", "Son propre taux s'ajuste automatiquement à la hausse", "Elle est annulée par l'émetteur"], "answer": 1, "explanation": "Quand les taux du marché montent, les obligations à taux fixe déjà émises rapportent moins que les nouvelles et doivent voir leur prix baisser pour être revendues."}, {"q": "Qu'est-ce qui caractérise une obligation à taux variable ?", "options": ["Son taux d'intérêt s'ajuste régulièrement en fonction du marché", "Son taux d'intérêt est fixé une fois pour toutes à l'émission", "Elle ne verse jamais d'intérêts à son détenteur", "Elle est obligatoirement émise par l'État"], "answer": 0, "explanation": "Le taux d'une obligation à taux variable s'ajuste régulièrement en fonction du marché, comme le taux directeur de la banque centrale, et son rendement évolue donc avec l'économie."}, {"q": "Quel titre sert de référence « sans risque » pour évaluer une obligation ?", "options": ["L'action d'une très grande entreprise cotée", "Une obligation perpétuelle émise par une banque", "Le Bon du Trésor", "Le coupon couru d'une obligation privée"], "answer": 2, "explanation": "Le Bon du Trésor est considéré comme le titre sans risque par excellence, car on estime que l'État fait très rarement faillite."}, {"q": "À combien correspond un écart de 100 points de base (pbs) ?", "options": ["0,01%", "0,1%", "10%", "1%"], "answer": 3, "explanation": "En finance, 100 points de base correspondent exactement à 1%."}, {"q": "Si un Bon du Trésor offre 3% et une obligation d'entreprise 5%, quelle est la prime de risque ?", "options": ["2 points de base, un écart considéré comme négligeable", "200 points de base", "500 points de base", "Il n'y a aucune prime de risque dans ce cas"], "answer": 1, "explanation": "La prime de risque est la différence de rendement, soit 2%, ce qui correspond à 200 points de base."}, {"q": "En période d'incertitude économique, comment évoluent généralement les primes de risque ?", "options": ["Elles disparaissent totalement du marché obligataire", "Elles diminuent, car les investisseurs sont rassurés par la situation", "Elles augmentent", "Elles restent strictement identiques quoi qu'il arrive"], "answer": 2, "explanation": "Les primes de risque augmentent en période d'incertitude, car les investisseurs exigent une rémunération plus élevée pour accepter le risque."}, {"q": "Lors de la vente d'une obligation entre deux dates de versement, qui paie le coupon couru et à qui ?", "options": ["L'entreprise émettrice le verse directement à l'acheteur du titre", "Personne : les intérêts accumulés sont simplement perdus", "Le vendeur le paie à l'acheteur en plus du transfert du titre", "L'acheteur le paie au vendeur"], "answer": 3, "explanation": "L'acheteur paie le coupon couru au vendeur, en plus du prix de l'obligation, afin de lui restituer les intérêts accumulés depuis le dernier versement."}, {"q": "Une obligation affiche un taux facial de 5% et l'inflation est de 2%. Quel est le taux réel ?", "options": ["3%", "7%", "2,5%", "10%"], "answer": 0, "explanation": "Le taux réel s'obtient en soustrayant l'inflation du taux facial, soit 5% moins 2%, donc 3%."}, {"q": "Qu'est-ce qu'un amortissement « in fine » ?", "options": ["L'entreprise rembourse une part du capital chaque année avec les intérêts", "L'entreprise verse les intérêts chaque année et rembourse tout le capital en une seule fois à la fin", "L'entreprise ne rembourse jamais le capital mais paie des intérêts indéfiniment", "L'entreprise rembourse le capital d'abord et les intérêts ensuite"], "answer": 1, "explanation": "Dans un amortissement in fine, seuls les intérêts sont versés chaque année et la totalité du capital est remboursée en une seule fois à l'échéance."}, {"q": "Quel est l'avantage du remboursement par séries égales annuelles pour l'entreprise émettrice ?", "options": ["Elle n'a plus aucun intérêt à verser à ses créanciers", "Elle peut transformer librement ses obligations en actions cotées", "Elle lisse sa trésorerie et évite de sortir une énorme somme d'un seul coup à la fin", "Elle augmente automatiquement la valeur nominale de son obligation"], "answer": 2, "explanation": "En remboursant une petite partie du capital chaque année, l'entreprise évite de devoir sortir une somme très importante d'un seul coup à l'échéance."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$passer-a-l-action-avec-le-carnet-d-ordres$lyamfi$,
  $lyamfi$Avancé$lyamfi$,
  $lyamfi$Passer à l'action avec le carnet d'ordres$lyamfi$,
  $lyamfi$Lire un carnet d'ordres, comprendre les priorités prix et temps, et choisir entre ordre limité, ordre au marché, EoE et EeE.$lyamfi$,
  $lyamfi$## Le carnet d'ordres : l'exemple Addoha (ADH)

Pour acheter ou vendre en bourse, tes ordres viennent s'afficher dans un **carnet d'ordres**, c'est-à-dire le **marché central**. Prenons l'exemple de l'action Addoha (ADH) :

- À gauche, en vert : la **Demande**. Ce sont les acheteurs. Le meilleur acheteur du moment veut 50 actions au prix maximum de 36,01 DH.

- À droite, en rouge : l'**Offre**. Ce sont les vendeurs. Le vendeur le plus compétitif propose de vendre à 37,48 DH.

- La colonne **N°** t'indique combien de personnes ont passé un ordre à ce prix précis. Face au prix de 37,48 DH, le « 4 » signifie qu'il y a 4 ordres de vente différents, qui cumulent une quantité totale de 5 870 actions.

Pourquoi rien ne se passe ? Parce que le marché est en pause : le meilleur acheteur refuse de payer plus de 36,01 DH, et le meilleur vendeur refuse de descendre en dessous de 37,48 DH. Tant que personne ne bouge, aucune transaction n'a lieu.

## La loi de la jungle (organisée) : les deux priorités

Mais pourquoi l'acheteur à 36,01 DH est-il tout en haut de la liste verte ? La Bourse obéit à deux règles d'or.

- La **Priorité Prime**, c'est-à-dire le prix : c'est la règle numéro un. L'acheteur qui propose le prix le plus haut (36,01 DH) passe devant celui qui propose 35,60 DH. Côté vendeurs, celui qui brade au prix le plus bas (37,48 DH) passe devant celui qui exige 37,70 DH.

- La **Priorité Temps** : elle départage ceux qui affichent le même prix. Les 4 vendeurs qui proposent tous 37,48 DH sont classés selon la règle du « premier arrivé, premier servi ».

Retiens l'ordre : le prix d'abord, le temps ensuite.

## Ordre à cours limité ou ordre au marché ?

Quand tu passes un ordre, tu as deux grandes stratégies.

- L'**ordre à cours limité** : tu fixes un plafond (à l'achat) ou un plancher (à la vente). Si tu places un ordre d'achat limité à 36,50 DH, tu prends instantanément la première place de la file verte, devant l'acheteur à 36,01 DH. Avantage : tu maîtrises ton budget. Inconvénient : tu dois quand même attendre qu'un vendeur accepte de descendre à 36,50 DH, et ton ordre peut ne jamais s'exécuter.

- L'**ordre au marché** : tu veux acheter tout de suite, peu importe le prix. Si tu lances un ordre d'achat au marché pour 100 actions, le système pioche directement dans la meilleure offre rouge disponible : tu paieras donc 37,48 DH. Avantage : exécution immédiate. Inconvénient : aucune maîtrise sur le prix d'exécution.

## Qui fixe vraiment le prix d'exécution ?

Imagine un vendeur très pressé qui arrive sur ce carnet Addoha et annonce : « Je vends 50 actions, et je suis prêt à descendre jusqu'à 35,00 DH ! » À quel prix la transaction va-t-elle se faire ? À 35,00 DH ? À 36,01 DH ?

- La transaction s'exécutera à **36,01 DH**.

- Pourquoi ? Parce que la règle veut que le prix d'exécution soit toujours celui de l'ordre qui était déjà présent en premier dans le carnet. L'acheteur à 36,01 DH attendait patiemment : on respecte son prix.

- Résultat : le nouveau vendeur est ravi. Il était prêt à brader à 35,00 DH, et il repart avec 36,01 DH. Une fois entièrement exécuté, son ordre disparaît du carnet.

## Les conditions extrêmes : EoE et EeE

Si tu brasses de gros volumes, tu peux ajouter une validité spéciale à ton ordre.

- **EoE (Exécuter ou Éliminer)** : c'est du tout ou rien. Si tu veux acheter 10 000 actions à 37,48 DH mais qu'il n'y en a que 5 870 de disponibles, l'ordre est totalement annulé : tu n'achètes rien.

- **EeE (Exécuter et Éliminer)** : tu es plus flexible. Tu achètes les 5 870 actions immédiatement, et le **reliquat**, c'est-à-dire les 4 130 actions manquantes, est annulé et retiré du système au lieu de rester en attente.

## À retenir

- Le carnet d'ordres affiche la demande (acheteurs) à gauche et l'offre (vendeurs) à droite, avec le nombre d'ordres regroupés à chaque prix.

- La Priorité Prime (le prix) prime toujours sur la Priorité Temps.

- L'ordre limité protège ton prix mais ne garantit pas l'exécution ; l'ordre au marché garantit l'exécution mais pas le prix.

- Le prix retenu est celui de l'ordre déjà présent dans le carnet.

- EoE annule tout si la quantité entière n'est pas disponible ; EeE exécute ce qui est possible et élimine le reliquat.$lyamfi$,
  11,
  $lyamfi$[{"q": "Dans le carnet Addoha (ADH), quel est le prix proposé par le meilleur acheteur ?", "options": ["37,48 DH", "36,01 DH", "35,60 DH", "37,70 DH"], "answer": 1, "explanation": "Le meilleur acheteur de la file verte veut 50 actions au prix maximum de 36,01 DH."}, {"q": "Que signifie le « 4 » dans la colonne N° sur la ligne des vendeurs à 37,48 DH ?", "options": ["Qu'il y a 4 actions disponibles à ce prix", "Que l'action a progressé de 4 %", "Qu'il y a 4 ordres de vente distincts regroupés à ce prix", "Que l'offre reste valable 4 jours"], "answer": 2, "explanation": "La colonne N° indique le nombre d'ordres passés à ce prix, ici 4 ordres cumulant 5 870 actions."}, {"q": "Pourquoi l'acheteur à 36,01 DH est-il placé devant l'acheteur à 35,60 DH ?", "options": ["Par la Priorité Prime : il propose de payer plus cher", "Par la Priorité Temps : il est arrivé plus tôt", "Parce qu'il demande une plus petite quantité", "Parce que son ordre est un ordre au marché"], "answer": 0, "explanation": "La Priorité Prime, c'est-à-dire le prix, place en tête l'acheteur qui propose le prix le plus élevé."}, {"q": "Un cinquième vendeur propose lui aussi 37,48 DH. Où est-il placé parmi les vendeurs à ce prix ?", "options": ["En première position", "En dernier, selon la Priorité Temps", "Son ordre est rejeté", "Devant tous les acheteurs"], "answer": 1, "explanation": "À prix égal, la Priorité Temps applique le « premier arrivé, premier servi », donc le dernier arrivé passe en dernier."}, {"q": "Tu passes un ordre d'achat au marché de 50 actions sur ce carnet Addoha. Que se passe-t-il ?", "options": ["L'ordre attend indéfiniment dans le carnet", "Tu achètes 50 actions à 36,01 DH", "Tu achètes 50 actions à 35,60 DH", "Tu achètes 50 actions immédiatement à 37,48 DH"], "answer": 3, "explanation": "L'ordre au marché pioche dans la meilleure offre rouge disponible, soit 37,48 DH, avec exécution immédiate."}, {"q": "Quel est le principal inconvénient d'un ordre à cours limité ?", "options": ["Payer beaucoup plus cher que prévu", "Être obligé d'acheter au prix du marché", "Ne jamais s'exécuter si le marché n'atteint pas ton prix", "Perdre la Priorité Prime automatiquement"], "answer": 2, "explanation": "Avec un ordre limité tu maîtrises ton budget, mais tu dois attendre qu'une contrepartie accepte ton prix, ce qui peut ne jamais arriver."}, {"q": "Un vendeur pressé annonce vendre 50 actions en acceptant de descendre jusqu'à 35,00 DH. À quel prix la transaction se fait-elle avec le meilleur acheteur ?", "options": ["36,01 DH", "35,00 DH", "35,50 DH, la moyenne des deux prix", "Aucune transaction n'est possible"], "answer": 0, "explanation": "L'exécution se fait à 36,01 DH, le prix de l'acheteur déjà présent dans le carnet."}, {"q": "Pourquoi cette exécution se fait-elle à 36,01 DH et non au prix annoncé par le vendeur ?", "options": ["Parce que la Bourse retient toujours le prix le plus élevé du carnet", "Parce que l'AMMC fixe ce prix le matin", "Parce que le vendeur est pénalisé pour son empressement", "Parce que le prix retenu est celui de l'ordre déjà présent en premier dans le carnet"], "answer": 3, "explanation": "La règle veut que le prix d'exécution soit celui de l'ordre qui attendait déjà dans le carnet, ici l'acheteur à 36,01 DH."}, {"q": "Tu lances un ordre d'achat EoE de 10 000 actions à 37,48 DH, mais seules 5 870 sont disponibles. Que se passe-t-il ?", "options": ["Tu achètes 5 870 actions et attends pour le reste", "Tu paies plus cher pour obtenir le complément", "L'ordre est totalement annulé et tu n'achètes rien", "L'ordre reste dans le carnet jusqu'au lendemain"], "answer": 2, "explanation": "EoE signifie « Exécuter ou Éliminer » : c'est du tout ou rien, donc l'ordre est annulé en totalité."}, {"q": "Dans la même situation, comment se comporte un ordre EeE ?", "options": ["Tu achètes les 5 870 actions et le reliquat de 4 130 actions est annulé", "L'ordre est bloqué pendant une semaine", "L'ordre supprime les autres acheteurs du carnet", "L'ordre est refusé par le système"], "answer": 0, "explanation": "EeE signifie « Exécuter et Éliminer » : la partie disponible est achetée et le reliquat est retiré du système."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$fixer-le-prix-d-une-introduction$lyamfi$,
  $lyamfi$Avancé$lyamfi$,
  $lyamfi$Fixer le prix d'une introduction$lyamfi$,
  $lyamfi$Comprendre comment se fixe le prix d'une introduction en bourse (OPF, OPO, OPM, cotation directe) et comment les titres sont alloues.$lyamfi$,
  $lyamfi$## Le défi du premier jour

Quand une entreprise fait son entrée en bourse, elle vend ses nouvelles actions au public sur le **marché primaire**. C'est le moment où l'**offre** (les actions que l'entreprise veut vendre) rencontre la **demande** (les investisseurs qui veulent acheter).

Cette étape cruciale porte un nom précis : la **procédure de première cotation**. Reste une question redoutable : à quel prix vendre ces actions ? L'entreprise dispose de plusieurs méthodes.

## L'Offre à Prix Ferme (OPF)

C'est la méthode la plus directe, et la plus fréquente.

- Le principe : le prix de l'action est déterminé à l'avance par l'entreprise et ne varie absolument pas pendant toute la période de souscription.
- L'exemple : lors de son introduction, l'entreprise **Akdital** a proposé ses actions à un prix fixe de **670 DH**. Tous ceux qui voulaient acheter savaient exactement ce qu'ils allaient payer.

Avec une OPF, tu n'as aucune surprise sur le prix : tu sais dès le départ combien coûte une action.

## L'Offre à Prix Ouvert (OPO)

Parfois, l'entreprise n'est pas certaine du prix exact auquel les investisseurs sont prêts à acheter. Elle utilise alors une OPO.

- Le principe : l'entreprise ne donne pas un prix fixe, mais une **fourchette de prix** (par exemple, entre 210 DH et 240 DH).
- Les investisseurs font leurs offres à l'intérieur de cette fourchette, en respectant un **pas de cotation**, c'est-à-dire le palier avec lequel on peut enchérir. Si le pas est de 5 DH, tu peux proposer 210 DH, 215 DH ou 220 DH, mais pas 212 DH.
- À la fin, on confronte toutes les offres pour trouver un **prix d'équilibre**. Tous les investisseurs retenus paieront finalement ce même prix d'équilibre, quel que soit le prix qu'ils avaient proposé.

## Le grand problème : quand la demande dépasse l'offre

Que se passe-t-il si l'entreprise met en vente 1 million d'actions, mais que le public en réclame 5 millions ? On ne peut pas satisfaire tout le monde.

L'entreprise doit alors procéder à une **allocation des titres**, c'est-à-dire répartir le gâteau entre les souscripteurs. Il existe deux grandes méthodes.

## L'allocation au prorata

On applique un simple pourcentage. La formule est :

- Actions reçues = (Offre totale / Demande totale) × Actions souscrites par la personne.

Concrètement, si la demande est 5 fois supérieure à l'offre, chaque investisseur ne recevra que **20 %** de ce qu'il a demandé. Plus la demande est forte, plus la part de chacun se réduit.

## L'allocation par itération

C'est un algorithme plus « social ».

- On établit un classement des souscripteurs, puis on distribue les actions une par une, par cycles d'attribution, jusqu'à épuisement du stock.
- Résultat : cette méthode donne plus de chances aux **petits investisseurs** d'obtenir des actions. Moins tu demandes d'actions, plus tu as de chances d'obtenir la totalité de ta commande.

## Les méthodes plus rares : OPM et cotation directe

- L'**Offre à Prix Minimum (OPM)** : l'entreprise fixe uniquement un prix plancher, le minimum absolu en dessous duquel elle refuse de vendre. Au Maroc, pour éviter que le prix ne s'envole trop haut, ce qui tuerait la liquidité de l'action après l'introduction, la Bourse impose souvent un plafond, généralement fixé à **+ 20 %** du prix minimum.
- La **cotation directe** : si une entreprise est déjà cotée dans une bourse étrangère, ses titres sont déjà diffusés dans le public. Elle peut donc entrer à la Bourse de Casablanca directement sur le **marché secondaire**, sans passer par la case « émission de nouveaux titres ».

## Un réflexe pratique

Tu pourrais être tenté de souscrire auprès de plusieurs **sociétés de bourse** différentes pour multiplier tes chances lors d'une introduction. Mauvaise idée : les chances sont les mêmes partout, il est interdit de souscrire plusieurs fois, et ta souscription serait tout simplement rejetée.

## À retenir

- La procédure de première cotation organise la rencontre entre l'offre et la demande sur le marché primaire.
- OPF : prix fixe connu à l'avance. OPO : fourchette de prix, pas de cotation, puis prix d'équilibre unique pour tous.
- Quand la demande dépasse l'offre : allocation au prorata (pourcentage) ou par itération (distribution par cycles, favorable aux petits porteurs).
- OPM : prix plancher, avec un plafond souvent fixé à + 20 % au Maroc. Cotation directe : réservée aux titres déjà diffusés dans le public.$lyamfi$,
  12,
  $lyamfi$[{"q": "Comment appelle-t-on l'étape de rencontre entre l'offre et la demande lors de l'introduction en bourse d'une entreprise ?", "options": ["Le transfert des titres vers le marché de blocs", "La procédure de première cotation", "L'augmentation de capital réservée aux salariés", "La purge du carnet d'ordres"], "answer": 1, "explanation": "Le cours nomme explicitement cette étape la procédure de première cotation."}, {"q": "Que signifie l'acronyme OPF ?", "options": ["Offre à Prix Ferme", "Offre Publique Flottante", "Obligation à Prix Fixe", "Option de Partage Financier"], "answer": 0, "explanation": "OPF est l'abréviation d'Offre à Prix Ferme, la méthode la plus directe et la plus fréquente."}, {"q": "À quel prix fixe l'entreprise Akdital a-t-elle proposé ses actions lors de son introduction ?", "options": ["210 DH", "240 DH", "225 DH", "670 DH"], "answer": 3, "explanation": "Le cours indique qu'Akdital a proposé ses actions à un prix fixe de 670 DH."}, {"q": "Dans une OPO avec une fourchette de 210 DH à 240 DH et un pas de cotation de 5 DH, quelle proposition est impossible ?", "options": ["215 DH", "220 DH", "212 DH", "210 DH"], "answer": 2, "explanation": "Avec un pas de 5 DH, seuls les paliers comme 210, 215 ou 220 DH sont acceptés, donc 212 DH est impossible."}, {"q": "À la clôture d'une OPO, quel prix paient les souscripteurs retenus ?", "options": ["Chacun paie exactement le prix qu'il avait proposé", "Tous paient le même prix d'équilibre", "Chacun paie le prix maximum de la fourchette", "Chacun paie le prix plancher de la fourchette"], "answer": 1, "explanation": "Après confrontation des offres, un prix d'équilibre est trouvé et tous les investisseurs retenus paient ce même prix."}, {"q": "Si la demande est 5 fois supérieure à l'offre et que l'allocation se fait au prorata, quelle part de sa demande reçoit un investisseur ?", "options": ["20 %", "50 %", "5 %", "100 %"], "answer": 0, "explanation": "Le cours précise qu'avec une demande 5 fois supérieure à l'offre, chaque investisseur ne reçoit que 20 % de ce qu'il a demandé."}, {"q": "Quelle est la formule de l'allocation au prorata ?", "options": ["Demande totale divisée par l'offre totale", "Nombre d'actions demandées divisé par le prix de l'action", "Offre totale moins la demande des investisseurs institutionnels", "(Offre totale / Demande totale) × actions souscrites par la personne"], "answer": 3, "explanation": "La formule donnée est Actions reçues = (Offre totale / Demande totale) × Actions souscrites."}, {"q": "Quel est l'avantage de l'allocation par itération ?", "options": ["Elle garantit le versement d'un dividende dès la première année", "Elle permet aux plus gros acheteurs d'être servis en priorité", "Elle donne plus de chances aux petits investisseurs d'obtenir des actions", "Elle réduit le prix payé pour chaque action attribuée"], "answer": 2, "explanation": "En distribuant les titres un par un par cycles, l'itération favorise les petits investisseurs, qui ont plus de chances d'obtenir la totalité de leur commande."}, {"q": "Pourquoi la Bourse impose-t-elle souvent un plafond de + 20 % du prix minimum lors d'une OPM au Maroc ?", "options": ["Parce que les banques internationales l'exigent", "Pour éviter que le prix ne s'envole trop haut et ne tue la liquidité de l'action", "Pour garantir une prime de risque élevée aux souscripteurs", "Pour empêcher l'entreprise de faire faillite après l'introduction"], "answer": 1, "explanation": "Le plafond évite une émission à un prix trop élevé, ce qui détruirait la liquidité de l'action après l'introduction."}, {"q": "Dans quel cas une entreprise peut-elle faire une cotation directe à la Bourse de Casablanca ?", "options": ["Quand ses titres sont déjà diffusés dans le public, par exemple parce qu'elle est cotée sur une bourse étrangère", "Quand elle a été créée depuis moins d'un an", "Quand elle ne compte aucun actionnaire minoritaire", "Quand l'État vient de la racheter"], "answer": 0, "explanation": "La cotation directe est réservée aux entreprises dont les titres sont déjà diffusés dans le public, comme celles déjà cotées à l'étranger, qui entrent alors directement sur le marché secondaire."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$les-batailles-pour-le-controle-offres-publiques$lyamfi$,
  $lyamfi$Avancé$lyamfi$,
  $lyamfi$Les batailles pour le contrôle (Offres Publiques)$lyamfi$,
  $lyamfi$Comprendre les offres publiques au Maroc : OPA volontaire, OPA hostile, OPA obligatoire et OPR, avec leurs seuils et leurs règles.$lyamfi$,
  $lyamfi$## Prendre le contrôle d'une société cotée

L'Appel Public à l'Épargne n'est pas la seule opération majeure dans la vie d'une entreprise. Il arrive qu'un investisseur ou une entreprise concurrente veuille **prendre le contrôle** d'une société. Pour cela, on utilise une **Offre Publique d'Achat (OPA)**.

- Le principe : c'est une opération qui s'adresse **uniquement aux actions des sociétés déjà cotées**.
- L'initiateur de l'offre propose publiquement d'acheter les actions des autres actionnaires.
- Il propose un prix **généralement supérieur au prix du marché**, pour les inciter à vendre.

Retiens bien ce point : sans cotation, pas d'offre publique. Une société non cotée se rachète par des négociations privées, pas par une OPA.

## L'OPA volontaire : la stratégie d'acquisition

Une OPA peut être **volontaire**, c'est-à-dire lancée à l'initiative d'un acheteur pour atteindre un objectif stratégique de contrôle.

- Le **seuil de renonciation** : l'acheteur définit un objectif précis, par exemple obtenir au moins 30% des actions. Si, à la fin de l'opération, il ne récolte pas ce pourcentage minimum, l'OPA est tout simplement annulée.
- Autrement dit, l'acheteur ne veut pas se retrouver avec une participation trop faible qui ne lui donnerait aucun pouvoir : il préfère renoncer.

L'**OPA hostile** : si un concurrent veut acheter ces actions sans avoir trouvé d'accord au préalable avec les actionnaires majoritaires de la société cible, on parle d'une OPA hostile. L'offre passe alors par-dessus la tête des dirigeants et s'adresse directement aux actionnaires.

Note sur le marché marocain : l'OPA volontaire est **très rare au Maroc**, car le capital des sociétés y est peu fractionné. Souvent, un actionnaire de référence possède déjà la grande majorité des parts. Racheter le **flottant** (la partie des actions qui circule librement en bourse) ne suffit alors pas pour prendre le contrôle.

## L'OPA obligatoire : la protection des minoritaires

La loi impose des règles strictes pour protéger les petits actionnaires.

- Le **seuil de franchissement** : si un investisseur achète des actions sur le marché et dépasse **40% de détention** d'une société sur le **marché principal**, il est obligé de lancer une OPA sur le reste des actions.
- Sur le **marché alternatif**, ce seuil est de **50%**.

Pourquoi cette obligation ? Parce qu'à ce niveau de détention, le pouvoir de décision et la **souveraineté** de l'entreprise changent radicalement. Ce n'est plus la même société : elle passe sous la direction d'un nouvel actionnaire fort. La loi oblige donc ce dernier à proposer aux actionnaires minoritaires de racheter leurs parts, s'ils ne souhaitent pas rester sous sa direction.

Différence essentielle avec l'OPA volontaire : dans une OPA obligatoire, il n'y a **aucun seuil de renonciation**. L'initiateur est obligé d'acheter **toutes les actions** qu'on lui présentera, sans pouvoir annuler l'opération parce que le résultat ne lui plaît pas.

## L'Offre Publique de Retrait (OPR) : la porte de sortie

Il existe une autre offre obligatoire, appelée **OPR**, c'est-à-dire **Offre Publique de Retrait**. Elle intervient dans deux cas précis :

- Si un actionnaire devient tellement puissant qu'il franchit **95% des droits de vote**.
- Ou si l'entreprise est **radiée de la bourse**, c'est-à-dire qu'elle quitte le marché.

L'objectif est de **protéger la liquidité**. Si une action quitte la bourse, ou s'il n'y a plus que 5% d'actions en circulation, il devient presque impossible de la revendre : plus personne en face pour acheter. L'actionnaire principal est donc obligé de proposer une porte de sortie, une OPR, pour racheter les dernières actions existantes.

## Ce qu'il faut retenir

- L'OPA ne concerne que les sociétés cotées, à un prix en général supérieur au marché.
- Volontaire : l'acheteur fixe un seuil de renonciation et peut annuler s'il ne l'atteint pas. Elle est hostile s'il n'y a pas eu d'accord préalable avec les actionnaires majoritaires.
- Obligatoire : déclenchée au franchissement de 40% sur le marché principal et de 50% sur le marché alternatif, sans possibilité de renoncer.
- OPR : déclenchée au franchissement de 95% des droits de vote ou en cas de radiation, pour offrir une sortie aux derniers actionnaires.$lyamfi$,
  13,
  $lyamfi$[{"q": "Qu'est-ce qu'une Offre Publique d'Achat (OPA) ?", "options": ["Une offre de l'État pour privatiser un service public", "Une proposition publique d'acquérir les actions d'une société cotée, souvent à un prix attractif", "Une distribution gratuite d'actions aux salariés méritants", "Un plan de licenciement annoncé publiquement par une entreprise"], "answer": 1, "explanation": "L'OPA est une opération par laquelle un initiateur propose publiquement de racheter les actions des autres actionnaires d'une société cotée."}, {"q": "À quel type de sociétés une offre publique s'adresse-t-elle ?", "options": ["Aux associations à but non lucratif", "Aux auto-entrepreneurs et aux petites structures familiales", "Uniquement aux sociétés déjà cotées en bourse", "À toutes les entreprises, cotées ou non cotées"], "answer": 2, "explanation": "Le cours précise que l'opération s'adresse uniquement aux actions des sociétés déjà cotées."}, {"q": "Quel prix l'initiateur d'une OPA propose-t-il généralement pour inciter les actionnaires à vendre ?", "options": ["Un prix supérieur au prix du marché", "Un prix strictement identique au cours de bourse du jour", "Un prix inférieur au marché, afin de réaliser une bonne affaire sur le dos des minoritaires", "Un paiement en nature, sous forme de biens de l'entreprise"], "answer": 0, "explanation": "L'initiateur propose un prix généralement supérieur au prix du marché pour inciter les actionnaires à lui céder leurs titres."}, {"q": "Dans une OPA volontaire, que se passe-t-il si le seuil de renonciation n'est pas atteint ?", "options": ["L'initiateur doit quand même acheter toutes les actions présentées", "L'AMMC fixe elle-même un nouveau prix de rachat", "Le seuil est automatiquement abaissé de moitié", "L'OPA est tout simplement annulée"], "answer": 3, "explanation": "Le seuil de renonciation est l'objectif minimum fixé par l'acheteur : s'il ne le récolte pas, l'OPA n'aboutit pas et est annulée."}, {"q": "Comment appelle-t-on une OPA lancée sans accord préalable avec les actionnaires majoritaires de la société cible ?", "options": ["Une OPA amicale", "Une OPA obligatoire", "Une OPA hostile", "Une offre publique de retrait"], "answer": 2, "explanation": "Une OPA menée sans accord préalable avec les actionnaires majoritaires de la cible est qualifiée d'hostile."}, {"q": "Pourquoi les OPA volontaires sont-elles très rares au Maroc ?", "options": ["Parce que le capital des sociétés y est peu fractionné", "Parce que la loi marocaine interdit purement et simplement ce type d'opération sur le marché principal", "Parce que les sociétés cotées marocaines ne distribuent pas assez de dividendes pour intéresser un acheteur", "Parce que seules les entreprises radiées de la bourse peuvent faire l'objet d'une offre"], "answer": 0, "explanation": "Un actionnaire de référence détient souvent déjà la grande majorité des parts, si bien que racheter le flottant ne suffit pas à prendre le contrôle."}, {"q": "Quel seuil de détention, une fois dépassé sur le marché principal, oblige un investisseur à lancer une OPA ?", "options": ["20%", "30%", "33%", "40%"], "answer": 3, "explanation": "Sur le marché principal, le franchissement de 40% de détention déclenche l'obligation de lancer une OPA sur le reste des actions."}, {"q": "Quel est le seuil de franchissement qui déclenche une OPA obligatoire sur le marché alternatif ?", "options": ["40%", "50%", "66%", "95%"], "answer": 1, "explanation": "Le cours fixe ce seuil à 50% pour le marché alternatif, contre 40% pour le marché principal."}, {"q": "Dans le cas d'une OPA obligatoire, existe-t-il un seuil de renonciation ?", "options": ["Oui, il est fixé par la loi à 30% des actions visées", "Oui, mais uniquement si l'initiateur en fait la demande avant l'opération", "Non, l'initiateur doit acheter toutes les actions qu'on lui présentera", "Non, mais l'initiateur peut n'acheter que la moitié des titres apportés"], "answer": 2, "explanation": "Contrairement à l'OPA volontaire, l'OPA obligatoire ne comporte aucun seuil de renonciation : l'initiateur doit acheter tous les titres présentés."}, {"q": "Quels sont les deux cas qui déclenchent une Offre Publique de Retrait (OPR) ?", "options": ["Le franchissement de 95% des droits de vote ou la radiation de la bourse", "Le franchissement de 40% du capital ou le versement d'un dividende exceptionnel", "Le lancement d'une OPA hostile ou la nomination d'un nouveau PDG", "Le franchissement de 50% des droits de vote ou une augmentation de capital"], "answer": 0, "explanation": "L'OPR intervient quand un actionnaire franchit 95% des droits de vote ou quand l'entreprise est radiée de la bourse, afin de protéger la liquidité des derniers actionnaires."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES (
  $lyamfi$la-vie-de-l-action-les-operations-sur-titres$lyamfi$,
  $lyamfi$Avancé$lyamfi$,
  $lyamfi$La vie de l'action : les opérations sur titres$lyamfi$,
  $lyamfi$Comprendre les opérations sur titres, les dates de détachement et de jouissance, et l'ajustement du cours après un dividende.$lyamfi$,
  $lyamfi$## Ce qu'est une Opération Sur Titre (OST)

Une fois qu'une action est créée et qu'elle s'échange en bourse, sa vie n'est pas un long fleuve tranquille. L'entreprise peut prendre des décisions qui vont impacter directement les actions qu'elle a émises. C'est ce qu'on appelle une **Opération Sur Titre (OST)**.

Autrement dit : tu détiens un titre, et l'émetteur de ce titre agit d'une manière qui modifie ce que tu as sur ton compte-titres. Il existe deux grandes familles d'OST.

## Les deux familles : d'office et optionnelle

- Les **OST d'office** sont automatiques. Tu n'as rien à faire, aucune autorisation à donner : l'opération s'exécute d'office sur ton compte simplement parce que tu détiens le titre. L'exemple le plus connu est le **versement des dividendes**.

- Les **OST optionnelles** nécessitent une instruction de ta part. L'entreprise te propose un choix, et c'est à toi de décider. Exemple : participer à une **augmentation de capital en numéraire** en utilisant tes **droits de souscription**.

La distinction est simple à retenir : d'office, tu subis (ou tu profites) sans bouger ; optionnelle, tu dois donner ta réponse, sinon tu passes à côté du choix.

## Le versement des dividendes : les dates clés

Quand une entreprise distribue une partie de ses bénéfices (les dividendes), la mécanique obéit à un calendrier très précis. Deux dates comptent vraiment.

- La **date de détachement** : c'est la date limite. C'est le jour précis où l'action commence à se négocier en bourse SANS le droit au dividende annoncé. Si tu possèdes l'action avant cette date, tu toucheras le dividende. Si tu l'achètes à partir de cette date, tu n'auras rien pour cette période. C'est une date qui se répète chaque année.

- La **date de jouissance** : c'est la date à partir de laquelle une action commence à donner droit à des avantages économiques, comme les dividendes. On l'utilise souvent quand l'entreprise émet de nouvelles actions, par exemple lors d'une augmentation de capital.

## Pourquoi utiliser une date de jouissance

Imagine qu'une entreprise crée de nouvelles actions le 1er juillet, avec une date de jouissance fixée au 1er janvier de l'année suivante. Conséquence : les nouveaux actionnaires n'auront pas droit aux dividendes de l'année en cours.

- Le but ? Protéger les anciens actionnaires, ceux qui ont soutenu l'entreprise toute l'année, et garantir une équité selon la période de participation de chacun.

- Une fois cette date passée, les droits des anciens et des nouveaux actionnaires deviennent strictement identiques. Il n'y a plus deux catégories d'actionnaires : tout le monde est logé à la même enseigne.

## L'impact du dividende sur le prix de l'action

Beaucoup de débutants pensent qu'ils peuvent acheter une action la veille du détachement du dividende, toucher l'argent le lendemain, puis revendre l'action au même prix. C'est faux, et voici pourquoi.

- Le jour de la date de détachement, la **Bourse de Casablanca** ajuste automatiquement la valeur de l'action à la baisse.

- Le prix de l'action diminue d'un montant exactement égal à la valeur du dividende versé.

- Exemple concret : l'action se vend à 50 DH. L'entreprise détache un dividende de 5 DH par action. Le matin du détachement, la Bourse de Casablanca fait en sorte que l'action s'ouvre automatiquement à 45 DH.

C'est pour cela que l'on parle d'un **cours ajusté** : le prix de référence de l'action est corrigé par la Bourse pour tenir compte de l'argent qui est sorti des caisses de l'entreprise. La valeur totale de ton patrimoine ne change pas mécaniquement le jour du détachement : une partie était dans le cours de l'action, elle se retrouve maintenant en cash sur ton compte.

## Ce qu'il faut retenir

- Une OST est une décision de l'entreprise qui affecte les titres qu'elle a émis.

- OST d'office : automatique, comme le dividende. OST optionnelle : tu dois donner une instruction, comme l'exercice de droits de souscription.

- Date de détachement : à partir de ce jour, l'action se négocie sans le dividende annoncé ; elle revient chaque année.

- Date de jouissance : à partir de ce jour, une action nouvelle donne droit aux avantages économiques, et les droits de tous les actionnaires s'alignent.

- Le jour du détachement, le cours est ajusté à la baisse du montant exact du dividende : il n'y a pas d'argent gratuit à ramasser la veille.$lyamfi$,
  14,
  $lyamfi$[{"q": "Qu'est-ce qu'une Opération Sur Titre (OST) ?", "options": ["Une taxe prélevée par l'AMMC sur chaque transaction boursière", "Une décision de l'entreprise qui affecte les titres qu'elle a émis", "Un simple transfert d'argent entre deux banques marocaines", "L'impression des actions sur papier pour les actionnaires"], "answer": 1, "explanation": "Une OST est une décision prise par l'entreprise émettrice qui impacte directement les actions déjà en circulation."}, {"q": "Qu'est-ce qui caractérise une OST « d'office » ?", "options": ["Elle s'exécute automatiquement sur ton compte, sans instruction de ta part", "Elle exige que tu transmettes un choix à ta société de bourse", "Elle ne concerne que les entreprises non cotées en bourse", "Elle doit être signée devant notaire avant d'être exécutée"], "answer": 0, "explanation": "Une OST d'office s'exécute automatiquement du seul fait que tu détiens le titre, sans aucune autorisation à donner."}, {"q": "Lequel de ces exemples est une OST d'office ?", "options": ["La souscription à une augmentation de capital en numéraire", "L'utilisation de tes droits de souscription", "Le versement des dividendes", "La signature d'un mandat de gestion avec ta banque"], "answer": 2, "explanation": "Le versement des dividendes est l'exemple le plus connu d'OST d'office, car il se fait automatiquement."}, {"q": "Quel exemple d'OST optionnelle le cours donne-t-il ?", "options": ["Le détachement automatique du dividende annuel", "L'ajustement du cours effectué par la Bourse de Casablanca", "La fixation de la date de jouissance des actions nouvelles", "Participer à une augmentation de capital en numéraire avec tes droits de souscription"], "answer": 3, "explanation": "Participer à une augmentation de capital en numéraire via ses droits de souscription suppose une instruction de l'investisseur, donc une OST optionnelle."}, {"q": "Que désigne la « date de détachement » ?", "options": ["Le jour où l'entreprise annonce ses bénéfices annuels au marché", "Le jour où l'action commence à se négocier sans le droit au dividende annoncé", "Le jour de la création juridique de l'action", "Le jour où l'entreprise est radiée de la cote"], "answer": 1, "explanation": "À partir de la date de détachement, l'action se négocie en bourse sans le droit au dividende annoncé."}, {"q": "Tu achètes une action le jour même de sa date de détachement. Que se passe-t-il ?", "options": ["Tu touches le dividende en double pour cette période", "Ton action reste bloquée pendant un mois entier", "Tu ne recevras pas le dividende pour cette période", "Tu dois régler une pénalité à ta société de bourse"], "answer": 2, "explanation": "Seuls ceux qui détenaient l'action avant la date de détachement touchent le dividende de la période."}, {"q": "Quelle institution ajuste mécaniquement le cours de l'action le matin du détachement ?", "options": ["La Bourse de Casablanca", "Maroclear, le dépositaire central", "Le gouvernement marocain", "Les banques commerciales de la place"], "answer": 0, "explanation": "C'est la Bourse de Casablanca qui ajuste automatiquement la valeur de l'action à la baisse le jour du détachement."}, {"q": "Que désigne la « date de jouissance » ?", "options": ["La date de fin de vie de l'entreprise", "La date de clôture annuelle des comptes de la société", "Le jour où les marchés sont fermés pour congé", "La date à partir de laquelle une action donne droit à des avantages économiques"], "answer": 3, "explanation": "La date de jouissance est le point de départ du droit aux avantages économiques, comme les dividendes."}, {"q": "Une entreprise émet des actions nouvelles le 1er juillet avec une date de jouissance au 1er janvier suivant. Que deviennent les droits une fois cette date passée ?", "options": ["Les anciens actionnaires perdent leurs actions", "Les droits des anciens et des nouveaux actionnaires deviennent strictement identiques", "Les nouveaux actionnaires doivent racheter la société", "La Bourse de Casablanca annule l'augmentation de capital"], "answer": 1, "explanation": "Une fois la date de jouissance dépassée, anciens et nouveaux actionnaires ont exactement les mêmes droits."}, {"q": "Une action cote 50 DH et l'entreprise détache un dividende de 5 DH. À quel prix l'action s'ouvre-t-elle le matin du détachement ?", "options": ["55 DH", "50 DH", "45 DH", "5 DH"], "answer": 2, "explanation": "Le cours est ajusté à la baisse d'un montant exactement égal au dividende, soit 50 DH moins 5 DH."}]$lyamfi$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  level = EXCLUDED.level, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, quiz = EXCLUDED.quiz;

-- Retire les leçons de démonstration remplacées par le programme ci-dessus.
DELETE FROM public.lessons WHERE slug NOT IN (
  $lyamfi$actions-et-obligations-la-difference$lyamfi$,
  $lyamfi$bourse-de-casablanca-et-ses-acteurs$lyamfi$,
  $lyamfi$prix-valeur-et-capitalisation$lyamfi$,
  $lyamfi$pourquoi-investir-et-gerer-le-niveau-de-risque$lyamfi$,
  $lyamfi$entree-en-bourse-appel-public-a-lepargne$lyamfi$,
  $lyamfi$analyse-fondamentale-et-ratios-cles$lyamfi$,
  $lyamfi$augmentation-de-capital-et-dps$lyamfi$,
  $lyamfi$strategies-et-suivi-de-portefeuille$lyamfi$,
  $lyamfi$cotation-au-quotidien$lyamfi$,
  $lyamfi$marche-de-la-dette-obligations$lyamfi$,
  $lyamfi$passer-a-l-action-avec-le-carnet-d-ordres$lyamfi$,
  $lyamfi$fixer-le-prix-d-une-introduction$lyamfi$,
  $lyamfi$les-batailles-pour-le-controle-offres-publiques$lyamfi$,
  $lyamfi$la-vie-de-l-action-les-operations-sur-titres$lyamfi$
);
