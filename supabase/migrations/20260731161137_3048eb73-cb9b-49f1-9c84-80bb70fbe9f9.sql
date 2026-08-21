
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL UNIQUE,
  name text NOT NULL,
  sector text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  change_pct numeric NOT NULL DEFAULT 0,
  market_cap numeric NOT NULL DEFAULT 0,
  per numeric,
  bpa numeric,
  dividend_yield numeric,
  peg numeric,
  target_price numeric,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stocks TO anon, authenticated;
GRANT ALL ON public.stocks TO service_role;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stocks public read" ON public.stocks FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.stock_prices (
  id bigserial PRIMARY KEY,
  stock_id uuid NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  date date NOT NULL,
  close numeric NOT NULL,
  UNIQUE (stock_id, date)
);
GRANT SELECT ON public.stock_prices TO anon, authenticated;
GRANT ALL ON public.stock_prices TO service_role;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prices public read" ON public.stock_prices FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  level text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  quiz jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons public read" ON public.lessons FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  score int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Mon portefeuille',
  capital numeric NOT NULL DEFAULT 100000,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;
GRANT ALL ON public.portfolios TO service_role;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own portfolios" ON public.portfolios FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.portfolio_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  stock_id uuid NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  weight numeric NOT NULL DEFAULT 0,
  UNIQUE (portfolio_id, stock_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_positions TO authenticated;
GRANT ALL ON public.portfolio_positions TO service_role;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own positions" ON public.portfolio_positions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

INSERT INTO public.stocks (ticker, name, sector, price, change_pct, market_cap, per, bpa, dividend_yield, peg, target_price, description) VALUES
('ATW','Attijariwafa Bank','Banques',628.00,0.74,135200000000,15.2,41.3,3.10,1.35,700.00,'Premier groupe bancaire marocain, présent dans plus de 25 pays.'),
('BCP','Banque Centrale Populaire','Banques',298.50,-0.42,60400000000,17.8,16.8,2.85,1.62,325.00,'Groupe bancaire coopératif, forte présence en Afrique de l''Ouest.'),
('BOA','Bank of Africa','Banques',215.00,1.18,41300000000,14.1,15.2,3.45,1.28,240.00,'Banque panafricaine cotée à Casablanca.'),
('CIH','CIH Bank','Banques',345.00,0.29,9800000000,16.9,20.4,2.60,1.70,370.00,'Banque de détail spécialisée à l''origine dans l''immobilier.'),
('IAM','Maroc Telecom','Télécoms',102.50,-0.63,90100000000,14.6,7.02,5.80,1.90,115.00,'Opérateur télécom historique, forte politique de dividende.'),
('LHM','LafargeHolcim Maroc','Matériaux de construction',1720.00,0.35,40300000000,21.4,80.4,3.90,2.05,1850.00,'Leader marocain du ciment et des matériaux.'),
('CSR','Cosumar','Agroalimentaire',210.00,0.10,8800000000,13.9,15.1,5.10,1.45,230.00,'Groupe sucrier national.'),
('MSA','Marsa Maroc','Transport & Logistique',310.00,1.62,22700000000,18.3,16.9,3.20,1.15,350.00,'Opérateur portuaire de référence au Maroc.'),
('TQM','Taqa Morocco','Énergie',1150.00,-0.21,27200000000,11.8,97.5,7.20,1.80,1250.00,'Producteur d''électricité (centrale de Jorf Lasfar).'),
('ADH','Douja Prom Addoha','Immobilier',19.80,2.05,3200000000,12.5,1.58,0.00,0.95,24.00,'Promoteur immobilier de logement social et moyen standing.'),
('RDS','Résidences Dar Saada','Immobilier',12.40,-1.12,1100000000,10.2,1.21,0.00,0.88,15.00,'Promoteur immobilier résidentiel.'),
('LBV','Label Vie','Distribution',4900.00,0.51,20800000000,38.5,127.3,1.10,2.40,5300.00,'Groupe de grande distribution (Carrefour Maroc).'),
('SNP','Snep','Chimie',760.00,-0.78,1800000000,9.4,80.9,4.50,0.80,880.00,'Producteur de PVC et de soude.'),
('MNG','Managem','Mines',4550.00,1.94,45500000000,19.7,231.0,1.60,1.05,5200.00,'Groupe minier diversifié (or, cuivre, cobalt).'),
('CMA','Ciments du Maroc','Matériaux de construction',1580.00,0.19,22800000000,18.9,83.6,4.10,1.95,1700.00,'Deuxième cimentier du pays.'),
('WAA','Wafa Assurance','Assurances',4300.00,0.62,15000000000,15.6,275.6,3.60,1.50,4700.00,'Premier assureur marocain.'),
('SAH','Saham Assurance','Assurances',1290.00,-0.35,5300000000,13.2,97.7,3.00,1.40,1450.00,'Compagnie d''assurance généraliste.'),
('HPS','HPS','Technologies',6300.00,2.41,4400000000,34.8,181.0,0.90,1.75,7000.00,'Éditeur de solutions de paiement électronique.'),
('DIS','Disway','Technologies',680.00,0.44,1300000000,11.6,58.6,5.30,1.10,760.00,'Distributeur de produits informatiques.'),
('SBM','Société des Boissons du Maroc','Agroalimentaire',2600.00,0.08,7300000000,16.4,158.5,5.60,1.85,2800.00,'Producteur et distributeur de boissons.');

INSERT INTO public.stock_prices (stock_id, date, close)
SELECT s.id,
       (CURRENT_DATE - (g || ' days')::interval)::date,
       ROUND((s.price * (1 - (g::numeric/1400) + (sin(g::numeric/6 + (('x'||substr(md5(s.ticker),1,8))::bit(32)::int % 50)) * 0.035)))::numeric, 2)
FROM public.stocks s, generate_series(0, 364) g;

INSERT INTO public.lessons (slug, level, title, summary, content, sort_order, quiz) VALUES
('c-est-quoi-une-action','Débutant','C''est quoi une action ?','Comprendre ce que vous achetez réellement en bourse.',
'Une action est une part du capital d''une entreprise. En achetant une action d''Attijariwafa Bank, vous devenez copropriétaire d''une fraction de la banque.

En tant qu''actionnaire, vous avez deux sources potentielles de gain :
1. **Le dividende** : une part du bénéfice redistribuée, souvent annuellement à la Bourse de Casablanca.
2. **La plus-value** : la différence entre le prix de vente et le prix d''achat.

Le cours d''une action varie selon l''offre et la demande, les résultats de l''entreprise et le contexte économique. Il n''existe aucune garantie de capital : une action peut perdre de la valeur.', 1,
'[{"q":"Que possède-t-on en achetant une action ?","options":["Une dette de l''entreprise","Une part du capital de l''entreprise","Un compte d''épargne garanti"],"answer":1},{"q":"Le dividende correspond à :","options":["Une part du bénéfice redistribuée","Une taxe boursière","Le prix d''achat de l''action"],"answer":0},{"q":"Le capital investi en actions est :","options":["Garanti par l''AMMC","Non garanti, il peut baisser","Toujours croissant"],"answer":1}]'::jsonb),

('la-bourse-de-casablanca','Débutant','La Bourse de Casablanca en pratique','Marché, horaires, indices MASI et MSI20.','La Bourse de Casablanca (BVC) est le marché boursier du Maroc. Les échanges se déroulent du lundi au vendredi, en dirhams (MAD).

Les indices de référence :
- **MASI** : indice global de toutes les valeurs cotées.
- **MSI20** : indice des 20 valeurs les plus liquides.

Pour investir, il faut ouvrir un compte titres auprès d''une société de bourse agréée. Les ordres passent par un intermédiaire, jamais en direct.', 2,
'[{"q":"Quelle est la devise de cotation à la BVC ?","options":["EUR","MAD","USD"],"answer":1},{"q":"Le MASI est :","options":["Un indice global de la place","Une société de bourse","Une taxe"],"answer":0}]'::jsonb),

('lire-un-bilan','Intermédiaire','Comment lire un bilan','Actif, passif, dette nette et fonds propres.','Le bilan est une photographie du patrimoine de l''entreprise à un instant donné.

- **Actif** : ce que l''entreprise possède (immobilisations, stocks, créances, trésorerie).
- **Passif** : comment c''est financé (fonds propres + dettes).

Trois repères utiles :
1. **Dette nette / EBITDA** : au-delà de 3x, l''endettement devient lourd.
2. **Fonds propres** : coussin de sécurité en cas de pertes.
3. **Trésorerie** : capacité à tenir sans financement externe.

Le compte de résultat complète le bilan en montrant la performance sur une période (chiffre d''affaires, résultat net).', 3,
'[{"q":"Les fonds propres figurent :","options":["À l''actif","Au passif","Hors bilan"],"answer":1},{"q":"Un ratio dette nette / EBITDA de 5x indique :","options":["Un endettement élevé","Une trésorerie excédentaire","Un dividende élevé"],"answer":0}]'::jsonb),

('per-peg-expliques','Intermédiaire','PER, BPA et PEG expliqués','Les multiples de valorisation, simplement.','- **BPA** (bénéfice par action) = résultat net / nombre d''actions.
- **PER** = cours / BPA. Il exprime combien d''années de bénéfices vous payez.
- **PEG** = PER / taux de croissance des bénéfices. Un PEG proche de 1 suggère un prix cohérent avec la croissance.
- **DY** (dividend yield) = dividende / cours.

Un PER de 15 sur Attijariwafa Bank signifie que le marché paie 15 fois le bénéfice annuel. Un PER bas n''est pas automatiquement une bonne affaire : il peut refléter un risque ou une croissance faible.', 4,
'[{"q":"PER = ","options":["Cours / BPA","BPA / Cours","Dividende / Cours"],"answer":0},{"q":"Un PEG proche de 1 signifie :","options":["Prix cohérent avec la croissance","Action garantie","Dividende élevé"],"answer":0},{"q":"Le DY mesure :","options":["La croissance","Le rendement du dividende","L''endettement"],"answer":1}]'::jsonb),

('ammc-et-reglementation','Avancé','Comprendre l''AMMC et la réglementation','Le gendarme du marché marocain.','L''**AMMC** (Autorité Marocaine du Marché des Capitaux) est le régulateur du marché. Elle :
- vise les notes d''information des introductions en bourse et augmentations de capital ;
- veille à l''information financière périodique des émetteurs ;
- sanctionne les délits d''initié et manipulations de cours.

Les sociétés cotées doivent publier leurs résultats semestriels et annuels, ainsi que toute information susceptible d''influencer le cours. En tant qu''investisseur, ces publications sont votre matière première.', 5,
'[{"q":"Quel organisme régule le marché marocain ?","options":["AMMC","BAM uniquement","BVC"],"answer":0},{"q":"Les sociétés cotées doivent publier :","options":["Rien","Leurs résultats périodiques","Uniquement leur bilan à la création"],"answer":1}]'::jsonb),

('gestion-du-risque','Avancé','Gestion du risque et diversification','Concentration, horizon, volatilité.','Le risque principal du débutant marocain est la **concentration** : un portefeuille composé à 80% de valeurs bancaires subit intégralement un choc sur le secteur.

Trois règles simples :
1. Diversifier les secteurs (banques, télécoms, mines, immobilier, agroalimentaire).
2. Limiter le poids d''une seule ligne (souvent 10 à 20% maximum).
3. Adapter l''horizon : l''action se pense sur 5 ans et plus.

La volatilité n''est pas le risque ultime : le vrai risque est la perte définitive de capital sur une entreprise fragile.', 6,
'[{"q":"Un portefeuille à 80% bancaire est :","options":["Bien diversifié","Fortement concentré","Sans risque"],"answer":1},{"q":"Horizon recommandé pour les actions :","options":["Quelques jours","5 ans et plus","1 mois"],"answer":1}]'::jsonb);
