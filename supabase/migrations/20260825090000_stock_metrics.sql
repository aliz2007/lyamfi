-- Fondamentaux des valeurs de la Bourse de Casablanca.
--
-- Seed issu de « Lyamfi_Fond_DataBase_24_08.xlsx », généré par
-- scripts/build-stock-metrics.py : ne pas éditer à la main, régénérer.
--
-- Toutes les colonnes chiffrées sont NULLABLES et le classeur est
-- volontairement incomplet : il note « _ » ou « — » là où la donnée manque.
-- L'interface masque l'indicateur correspondant plutôt que d'afficher un
-- « N/A », donc une valeur absente ici doit rester NULL et surtout pas 0, qui
-- se lirait comme une vraie mesure.
--
-- Les colonnes « 25 » sont des constats sur l'exercice clos, les « 26 » des
-- prévisions, les « 27e » des estimations. Rien ici ne dépend du cours : PER,
-- rendement, P/B, P/S et P/FCF se calculent à l'affichage à partir du cours du
-- jour, sinon ils seraient périmés dès le lendemain.

CREATE TABLE IF NOT EXISTS public.stock_metrics (
  ticker             text PRIMARY KEY,
  company            text NOT NULL,
  shares             numeric,
  eps_26             numeric,
  eps_27e            numeric,
  dps_26             numeric,
  dps_27e            numeric,
  book_value_25      numeric,
  sales_per_share_25 numeric,
  fcf_per_share_25   numeric,
  roe_25             numeric,
  roa_25             numeric,
  payout_25          numeric,
  net_margin_25      numeric,
  ebitda_margin_25   numeric,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stock_metrics TO anon, authenticated;
GRANT ALL    ON public.stock_metrics TO service_role;
ALTER TABLE public.stock_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics public read" ON public.stock_metrics
FOR SELECT TO anon, authenticated USING (true);

-- Le seed fait foi : une réexécution réaligne la table sur le classeur.
INSERT INTO public.stock_metrics (ticker, company, shares, eps_26, eps_27e, dps_26, dps_27e, book_value_25, sales_per_share_25, fcf_per_share_25, roe_25, roa_25, payout_25, net_margin_25, ebitda_margin_25) VALUES
  ('ADH', 'DOUJA PROM ADDOHA', 402551254, 1.38, 1.67, 0.64, 1.01, 6.46, 1.86, NULL, 0.048, 0.02, 0.461, 0.168, 0.218),
  ('ADI', 'ALLIANCES', 22078588, 20.97, 25.75, 5.16, 6.02, 148.26, 89.57, -2.07, 0.101, 0.04, 0.22, 0.165, 0.247),
  ('AFI', 'AFRIC INDUSTRIES SA', 291500, 31, 34.14, 24.67, 25.01, 177.87, 153.61, 1.06, 0.163, 0.139, 0.729, 0.183, 0.03),
  ('AFM', 'AFMA', 1000000, 75.3, 77.13, 63.25, 64.52, 69.13, 316.25, -3.95, 0.01, 0.062, 0.849, 0.231, 0.463),
  ('AGM', 'AGMA', 200000, 412.67, 412.67, 333.61, 333.61, 806.59, 985.83, 550.23, 0.482, 0.109, 0.838, 0.396, 0.499),
  ('AKT', 'AKDITAL', 14159207, 39.21, 45.8, 16.03, 18.32, 170.9, 266.28, -124.46, 0.154, 0.046, 0.451, 0.1, 0.275),
  ('ALM', 'ALUMINIUM DU MAROC', 465954, 147.92, 152.81, 120.19, 120.19, 596.45, 3081.67, 171.2, 0.252, 0.061, 0.777, 0.051, 0.013),
  ('ARD', 'ARADEI CAPITAL', 12568130, 30.96, 35.21, 24.88, 30.12, 396.86, 47.97, 10.94, 0.098, 0.054, 0.541, 0.827, 0.011),
  ('ATH', 'AUTO HALL', 50294528, 2.74, 3, 3, 3.49, 24.03, 99.57, 1.12, 0.069, 0.015, 0.01, 0.017, 0.091),
  ('ATL', 'ATLANTASANAD', 60283595, 9.97, 9.97, 6.51, 6.51, 60.79, NULL, NULL, 0.136, 0.024, 0.63, 0.107, NULL),
  ('ATW', 'ATTIJARIWAFA BANK', 215140839, 54.23, 62.39, 23.97, 24.68, 320.45, NULL, NULL, 0.153, 0.013, 0.445, 0.305, NULL),
  ('BAL', 'Balima', 1744000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('BCI', 'BMCI', 13279286, 42.36, 48.8, 18.91, 21.96, 610, NULL, NULL, 0.057, 0.006, 0.58, 0.11, NULL),
  ('BCP', 'BCP', 203312473, 23.24, 26.15, 11.04, 12.05, 156.88, NULL, NULL, 0.122, 0.008, 0.474, 0.167, NULL),
  ('BOA', 'BANK OF AFRICA', 220281881, 19.54, 21.52, 4.98, 4.98, 119.69, NULL, NULL, 0.12, 0.009, 0.289, 0.188, NULL),
  ('CAP', 'CASH PLUS S,A', 24553090, 11.81, 13.93, 9.42, 10.91, 26.11, NULL, NULL, 0.306, 0.061, 0.987, 0.28, NULL),
  ('CDM', 'CDM', 11626499, 93.21, 108.57, 55.33, 59.28, 705.71, NULL, NULL, 0.105, 0.01, 0.605, 0.242, NULL),
  ('CFG', 'CFG BANK', 35007960, 11.86, 14.35, 3.96, 4.95, 49.5, NULL, NULL, 0.179, 0.012, 0.378, 0.297, NULL),
  ('CIH', 'CIH', 38641338, 36.46, 39.77, 17.85, 17.85, 233.33, NULL, NULL, 0.112, 0.007, 0.458, 0.201, NULL),
  ('CMA', 'CIMENTS DU MAROC', 14436004, 103.66, 108.28, 64.6, 64.6, 226.67, 326.92, -52.15, 0.375, 0.158, 0.669, 0.257, 0.43),
  ('CMG', 'CMGP GROUP', 17000900, 17.98, 19.28, 7.36, 8, 145.45, 152.38, -26.45, 0.088, 0.043, 0.453, 0.083, 0.16),
  ('CMT', 'MINIERE TOUISSIT', 1681233, 251.45, 277.07, 60.9, 121.8, 1115.38, 852.94, 201.39, 0.218, 0.102, NULL, 0.284, 0.616),
  ('COL', 'COLORADO', 16117611, 4.48, 4.58, 3.5, 3.5, 25.47, 45.28, 1.68, 0.184, 0.113, 0.855, 0.106, 0.188),
  ('CRS', 'CARTIER SAADA', 5265000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('CSR', 'COSUMAR', 94487143, 7.92, 9.04, 10.1, 12.08, 53.51, 99, 12.77, 0.125, 0.062, 0.013, 0.067, 0.159),
  ('CTM', 'CTM', 1225978, 48.08, 48.08, 26.25, 26.25, 178.57, 1458.33, -143.44, 0.23, 0.041, 0.569, 0.03, 0.081),
  ('DHO', 'DELTA HOLDING', 87600000, 3.94, 4.18, 2.52, 3.02, 21.54, 25.45, 4.83, 0.117, 0.069, 0.571, 0.101, 0.178),
  ('DIA', 'Diac Salaf', 1053404, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('DLM', 'Delattre Levivier Maroc', 1750000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('DRI', 'DARI COUSPATE', 298375, 0.18, 0.2, 0.15, 0.15, 1.35, 2.9, 0.19, 0.139, 0.075, 0.803, 0.064, 0.131),
  ('DWY', 'DISWAY', 1885762, 46.79, 47.65, 44, 44.78, 350.91, 1102.86, 47.07, 0.124, 0.065, 0.976, 0.041, 0.068),
  ('DYT', 'DISTY TECHNOLOGIES', 998110, 27.97, 29.11, 21.12, 21.12, 198.89, 716, 26.32, 0.141, 0.054, 0.768, 0.041, 0.059),
  ('EQD', 'EQDOM', 1670250, 70.19, 78.27, 55.32, 58.31, 1067.86, NULL, NULL, 0.071, 0.012, 0.962, 0.164, NULL),
  ('FBR', 'FENIE BROSSETTE', 1438984, 13.89, 15.28, NULL, NULL, 138, 690, 6.76, 0.092, 0.022, NULL, 0.02, 0.073),
  ('GAZ', 'AFRIQUIA GAZ', 3437500, 247.36, 263.38, 175.73, 186.71, 851.4, 2288.13, 67.17, 0.222, 0.081, 0.801, 0.084, 0.175),
  ('GTM', 'SGTM S,A', 60000000, 26.38, 27.71, 13.59, 15.73, NULL, NULL, NULL, 0.378, 0.081, 0.537, 0.088, 0.164),
  ('HPS', 'HPS', 7406190, 22.28, 25.43, 9.04, 9.69, 99.38, 179.44, 24.1, 0.13, NULL, 0.559, 0.072, 0.193),
  ('IAM', 'ITISSALAT AL-MAGHRIB', 879095340, 6.32, 6.44, 4.95, 4.95, 21.06, 37.44, 8.72, 0.34, 0.092, 0.505, 0.19, 0.581),
  ('IBC', 'IB MAROC,COM', 417486, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('IMO', 'IMMORENTE INVEST', 9007000, 5.78, 6.21, 5.51, 5.97, 91.9, 9.67, -2.27, 0.06, 0.038, 0.01, 0.58, 0.747),
  ('INV', 'INVOLYS', 382716, NULL, NULL, NULL, NULL, 220, 88, -8.63, NULL, NULL, NULL, NULL, 0.361),
  ('JET', 'JET CONTRACTORS', 3029522, 95.72, 118.72, 21.25, 25.5, 408.65, 1180.56, -244.25, 0.166, 0.037, 0.269, 0.057, 0.135),
  ('LBV', 'LABEL VIE', 2893957, 230.77, 260.87, 126, 134.4, 1135.14, 6000, -494.12, 0.163, 0.033, 0.6, 0.031, 0.065),
  ('LES', 'LESIEUR CRISTAL', 27631510, 1.81, 3.62, 2.9, 2.9, 67.08, 214.67, 4.93, 0.005, 0.002, NULL, 0.001, 0.053),
  ('LHM', 'Holcim Maroc S,A', 23431240, 93.75, 104.05, 95.4, 100.8, 352.94, 257.14, 65.93, 0.178, 0.108, 0.01, 0.242, 0.479),
  ('M2M', 'M2M Group', 647777, 18.56, 23.18, NULL, NULL, 190.95, 154.23, 24.45, 0.045, 0.02, NULL, 0.055, 0.146),
  ('MAB', 'MAGHREBAIL', 1384182, 117.5, 106.82, 52.64, 55.46, 854.55, NULL, NULL, 0.121, 0.01, 0.496, 0.338, NULL),
  ('MDP', 'MED PAPER', 4783823, 1.67, 1.67, NULL, NULL, 9.32, 19.96, 1.7, 0.17, 0.021, NULL, 0.079, -0.054),
  ('MIC', 'MICRODATA', 1680000, 43.1, 45.18, 44.25, 45.75, 105.63, 535.71, -12.73, 0.359, 0.098, 0.96, 0.072, 0.112),
  ('MLE', 'MAROC LEASING', 2776768, 41.2, 42.58, 14.02, 14.02, 473.75, NULL, NULL, 0.087, 0.007, 0.363, 0.276, NULL),
  ('MNG', 'MANAGEM', 118646760, 54.41, 57.17, 64.84, 100.86, 339.81, 400.22, -28.95, 0.261, 0.08, 0.217, 0.219, 0.438),
  ('MOX', 'MAGHREB OXYGENE', 812500, 18.49, 18.49, 3.94, 3.94, 358.09, 393.9, -103.66, 0.047, 0.015, 0.217, 0.045, 0.114),
  ('MSA', 'SODEP-Marsa Maroc', 73395600, 23.81, 24.56, 12.07, 12.93, 57.47, 82.1, 11.86, 0.393, 0.17, 0.508, 0.275, 0.552),
  ('MUT', 'MUTANDIS SCA', 9246737, 12.42, 14.09, 11.09, 11.09, 141.76, 185.38, 13.69, 0.081, 0.034, 0.764, 0.063, 0.156),
  ('NEJ', 'AUTO NEJMA', 1023264, 348.88, 384.28, 190.91, 190.91, 2791.05, 7575.71, 1104.79, 0.226, 0.098, 0.556, 0.078, 0.135),
  ('NKL', 'ENNAKL', 30000000, 6.76, 7.05, 3.4, 3.4, 35.75, 100.1, 3.21, 0.217, 0.118, 0.495, 0.084, 0.109),
  ('OUL', 'OULMES', 1980000, 62.23, 60.58, 40.08, 40.08, 37.3, 154.73, -17.43, 0.142, 0.029, 0.71, 0.034, 0.186),
  ('PRO', 'PROMOPHARM S,A,', 1000000, 69.15, 71.04, 35.1, 35.1, 650, 1083.33, NULL, 0.102, 0.049, 0.5, 0.061, 0.123),
  ('RDS', 'RESIDENCES DAR SAADA', 26208850, 6.56, 7.22, NULL, NULL, 177, 23.29, -12.55, 0.001, 0.001, NULL, 0.009, 0.088),
  ('REB', 'Rebab Company', 176456, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('RIS', 'RISMA', 16012132, 23.03, 26.8, 11.12, 13.08, 99.09, 96.18, 25.75, 0.16, 0.058, 0.534, 0.165, 0.386),
  ('S2M', 'S,M MONETIQUE', 812070, 45.54, 48.11, NULL, NULL, 154.55, 425, 87.93, 0.246, 0.111, NULL, 0.09, 0.177),
  ('SAH', 'SANLAM MAROC', 5341874, 116.53, 118.99, 101.52, 104.34, 1880, NULL, NULL, 0.081, 0.007, 0.919, 0.081, NULL),
  ('SBM', 'SOCIETE DES BOISSONS DU MAROC', 2829653, 142.69, 155.56, 124.14, 134.49, 530.51, 1034.5, 66.1, 0.215, 0.139, 0.01, 0.111, 0.21),
  ('SID', 'SONASID', 3900000, 77.52, 90.91, 56, 56, 476.19, 1538.46, -20.28, 0.137, 0.05, 0.746, 0.043, 0.1),
  ('SLF', 'SALAFIN', 3124119, 33.27, 37.54, 29.87, 35.14, 199.64, NULL, NULL, 0.11, 0.025, 0.976, 0.25, NULL),
  ('SMI', 'SMI', 1645090, 421.38, 437.91, 247.9, 261.3, 2680, 2481.48, 549.18, 0.239, 0.187, 0.622, 0.254, 0.551),
  ('SNA', 'STOKVIS NORD AFRIQUE', 17695150, 1.47, 1.58, NULL, NULL, 5.09, 11.71, -1.29, 0.274, 0.061, NULL, 0.119, 0.175),
  ('SNP', 'SNEP', 2400000, 18.78, 22.56, NULL, NULL, 119.35, 185, -12.05, -0.38, -0.108, NULL, -0.248, -0.039),
  ('SOT', 'SOTHEMA', 38309500, 11.56, 12.21, 7.72, 8.09, 89.63, 111.36, 13.13, 0.147, 0.084, 0.616, 0.12, 0.225),
  ('SRM', 'REALISATIONS MECANIQUES', 320000, 37.5, 40.79, NULL, NULL, 516.67, 1162.5, 108.14, 0.068, 0.029, NULL, 0.031, 0.062),
  ('STR', 'STROC Industrie', 1248515, 0.4, 0.8, NULL, NULL, -308.25, 168.14, 2.41, -0.001, 0.001, NULL, 0.003, 0.127),
  ('T2S', 'T2S GROUP HOLDING', 21785174, 11.06, 14.33, 10.9, 14.05, NULL, NULL, NULL, 0.145, 0.063, NULL, 0.116, 0.257),
  ('TGC', 'TGCC S,A', 34674332, 33.99, 36.9, 17.05, 19.38, 123.02, 322.92, 37.8, 0.21, 0.061, 0.546, 0.08, 0.248),
  ('TMA', 'TOTALENERGIES MARKETING MAROC', 8960000, 0.09, 0.1, 0.11, 0.11, 0.19, 1.53, 0.13, 0.429, 0.103, 0.942, 0.056, 0.111),
  ('TQM', 'TAQA MOROCCO', 23588542, 43.66, 52.99, 39.06, 39.06, 229.63, 357.69, 52.39, 0.145, 0.048, 0.914, 0.092, 0.306),
  ('UMR', 'UNIMER', 11413880, 0.44, 0.88, NULL, NULL, 86.5, 101.76, 4.69, -0.035, -0.013, NULL, -0.03, 0.044),
  ('VCN', 'VICENNE', 10258850, 16.2, 18.35, 9.66, 10.35, 90.79, 80.23, 2.43, 0.116, 0.072, 0.598, 0.133, 0.23),
  ('WAA', 'WAFA ASSURANCE', 3500000, 285.71, 314.61, 151.2, 168, 2333.33, NULL, NULL, 0.112, 0.032, 0.636, 0.071, NULL),
  ('ZEL', 'Zellidja S.A', 572849, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (ticker) DO UPDATE SET
  company = EXCLUDED.company,
  shares = EXCLUDED.shares,
  eps_26 = EXCLUDED.eps_26,
  eps_27e = EXCLUDED.eps_27e,
  dps_26 = EXCLUDED.dps_26,
  dps_27e = EXCLUDED.dps_27e,
  book_value_25 = EXCLUDED.book_value_25,
  sales_per_share_25 = EXCLUDED.sales_per_share_25,
  fcf_per_share_25 = EXCLUDED.fcf_per_share_25,
  roe_25 = EXCLUDED.roe_25,
  roa_25 = EXCLUDED.roa_25,
  payout_25 = EXCLUDED.payout_25,
  net_margin_25 = EXCLUDED.net_margin_25,
  ebitda_margin_25 = EXCLUDED.ebitda_margin_25,
  updated_at = now();

-- Les valeurs radiées de la cote disparaissent de la table.
DELETE FROM public.stock_metrics
WHERE ticker NOT IN ('ADH', 'ADI', 'AFI', 'AFM', 'AGM', 'AKT', 'ALM', 'ARD', 'ATH', 'ATL', 'ATW', 'BAL', 'BCI', 'BCP', 'BOA', 'CAP', 'CDM', 'CFG', 'CIH', 'CMA', 'CMG', 'CMT', 'COL', 'CRS', 'CSR', 'CTM', 'DHO', 'DIA', 'DLM', 'DRI', 'DWY', 'DYT', 'EQD', 'FBR', 'GAZ', 'GTM', 'HPS', 'IAM', 'IBC', 'IMO', 'INV', 'JET', 'LBV', 'LES', 'LHM', 'M2M', 'MAB', 'MDP', 'MIC', 'MLE', 'MNG', 'MOX', 'MSA', 'MUT', 'NEJ', 'NKL', 'OUL', 'PRO', 'RDS', 'REB', 'RIS', 'S2M', 'SAH', 'SBM', 'SID', 'SLF', 'SMI', 'SNA', 'SNP', 'SOT', 'SRM', 'STR', 'T2S', 'TGC', 'TMA', 'TQM', 'UMR', 'VCN', 'WAA', 'ZEL');
