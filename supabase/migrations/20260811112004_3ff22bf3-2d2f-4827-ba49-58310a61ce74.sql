CREATE TABLE public.stock_fundamentals (
  ticker text PRIMARY KEY,
  name text NOT NULL,
  shares_m numeric NOT NULL,
  bpa_2025 numeric,
  bpa_2026e numeric,
  dpa_2025 numeric,
  dpa_2026e numeric,
  per_2025 numeric,
  per_2026e numeric,
  dy_2025 numeric,
  dy_2026e numeric,
  as_of date NOT NULL DEFAULT '2026-05-25'
);

GRANT SELECT ON public.stock_fundamentals TO anon;
GRANT SELECT ON public.stock_fundamentals TO authenticated;
GRANT ALL ON public.stock_fundamentals TO service_role;

ALTER TABLE public.stock_fundamentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fundamentals public read" ON public.stock_fundamentals
FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.stock_fundamentals (ticker,name,shares_m,bpa_2025,bpa_2026e,dpa_2025,dpa_2026e,per_2025,per_2026e,dy_2025,dy_2026e) VALUES
('ADH','Addoha',402.6,1.1,0.9,0.0,0.0,31.9,38.2,0.0,0.0),
('GAZ','Afriquia Gaz',3.4,220.7,215.0,175.0,180.0,18.5,17.9,4.3,4.7),
('AKT','Akdital',14.2,31.2,38.1,14.0,16.8,37.7,30.8,1.2,1.4),
('ADI','Alliances',22.1,18.5,19.2,4.0,4.5,28.7,22.0,0.8,1.1),
('ARD','Aradei Capital',12.6,25.5,26.0,23.0,23.0,16.4,16.5,5.5,5.4),
('ATL','AtlantaSanad',60.0,7.8,8.9,5.9,6.5,19.3,14.6,3.9,5.0),
('ATW','Attijariwafa Bank',215.1,49.5,54.0,22.0,24.0,14.8,12.9,3.15,3.43),
('ATH','Auto Hall',50.3,2.0,2.5,2.0,2.5,47.3,28.0,2.1,3.6),
('BCP','Banque Centrale Populaire',203.0,22.2,25.3,11.0,12.0,13.1,9.5,3.8,5.0),
('BCI','BMCI',13.3,32.7,36.7,14.0,15.0,19.3,16.2,2.2,2.5),
('CAP','Cash Plus',24.6,9.8,11.2,9.73,8.19,31.1,25.0,3.2,2.9),
('CDM','Credit du Maroc',11.0,79.2,87.0,48.0,52.0,13.1,11.7,4.6,5.1),
('CIH','CIH Bank',35.6,30.6,34.3,14.0,14.0,13.6,10.5,3.88,3.88),
('CMA','Ciments du Maroc',14.4,95.6,90.6,65.0,70.0,19.4,18.5,3.5,4.2),
('CMG','CMGP Group',17.0,14.9,15.5,6.5,7.1,24.8,23.2,1.8,2.0),
('CMT','Compagnie Miniere de Touissit',1.7,115.3,204.1,0.0,83.0,15.4,23.5,0.0,1.7),
('COL','Colorado',16.1,4.1,4.5,3.5,3.5,21.3,23.1,4.1,4.3),
('CSR','Cosumar',94.5,7.4,7.2,10.0,11.0,27.3,25.4,4.9,6.0),
('DWY','Disway',1.9,45.0,48.1,44.0,45.0,19.4,16.4,5.0,5.7),
('LHM','Holcim Maroc',23.4,92.6,94.6,96.0,101.0,19.9,19.7,5.2,5.4),
('HPS','HPS',7.4,14.3,18.2,8.0,8.0,38.8,34.4,1.4,1.3),
('IAM','Maroc Telecom',879.1,7.9,6.3,4.0,4.2,13.7,14.7,3.7,4.5),
('JET','Jet Contractors',3.0,74.0,111.7,20.0,30.0,36.2,20.2,0.7,1.3),
('LBV','Label Vie',2.9,199.6,248.8,120.0,130.0,23.0,15.5,2.6,3.4),
('MSA','Marsa Maroc',73.4,21.6,22.4,11.0,11.0,43.9,37.9,1.2,1.3),
('MNG','Managem',11.9,252.3,415.3,55.0,60.0,25.3,39.9,0.9,0.4),
('MUT','Mutandis',9.2,13.7,11.5,10.5,10.5,18.3,19.6,4.2,4.6),
('RDS','Residences Dar Saada',26.2,0.2,4.8,0.0,0.0,1055.0,34.9,0.0,0.0),
('GTM','SGTM',60.0,22.4,29.0,12.0,15.0,40.9,25.9,1.3,2.0),
('SMI','Societe Metallurgique d''Imiter',1.6,248.1,263.6,150.0,150.0,17.0,35.5,3.6,1.6),
('SID','Sonasid',3.9,69.7,85.9,52.0,65.3,31.9,24.1,2.3,3.2),
('SOT','Sothema',38.3,10.1,12.7,6.6,7.3,36.5,29.8,1.8,1.9),
('TQM','Taqa Morocco',23.588542,41.6,44.0,38.0,38.0,51.0,40.9,1.8,2.1),
('TGC','TGCC',34.7,27.4,30.2,15.0,18.0,33.0,25.2,1.7,2.4),
('TMA','TotalEnergies Marketing Maroc',9.0,94.6,109.4,94.6,109.4,18.4,14.1,5.2,5.8),
('VCN','Vicenne',10.3,14.0,18.0,8.4,8.6,32.0,22.0,1.9,2.2),
('WAA','Wafa Assurance',4.0,269.0,285.0,150.0,160.0,18.0,20.0,3.12,2.76);