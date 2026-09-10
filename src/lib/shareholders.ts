/**
 * Structure actionnariale des valeurs de la cote.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le brief du 08/09 fournit le classeur « Actionnariat BVC » : pour chaque
 * valeur, ses actionnaires et leur part. C'est le même genre de donnée que
 * `lib/sectors.ts` et `lib/quotation.ts` — un classeur de l'éditeur, indexé
 * sur le code de la cote, qui bouge de quelques lignes par an — et il vit en
 * constantes pour la même raison : pas une donnée à administrer, pas de
 * table ni de politique RLS à maintenir. La carte « Structure actionnariale »
 * de la fiche valeur lit `shareholdersOf(code)` et rien d'autre.
 *
 * TRANSCRIPTION
 *
 * Le classeur compte 80 blocs, un par valeur cotée, et chaque bloc nomme ses
 * actionnaires en toutes lettres : c'est ce nom qui a servi de jointure avec
 * `CSE_SYMBOLS`, comme pour les secteurs. Sept blocs arrivaient abîmés (la
 * conversion du classeur avait intercalé deux colonnes caractère par
 * caractère, ou fait passer une virgule) ; ils ont été remis d'équerre
 * ci-dessous, et chaque retouche est documentée en commentaire sur le bloc.
 * Huitième cas : CARTIER SAADA (CRS), dont les parts totalisent 108 % sans
 * qu'aucune correction ne s'impose d'évidence — la valeur n'a pas de carte
 * tant que le classeur n'est pas corrigé, et `shareholdersOf` renvoie
 * `undefined`, ce que la carte traduit par « Données non disponibles ».
 *
 * CONVENTIONS
 *
 *   * Les parts sont des pourcentages du capital, le point en séparateur
 *     (64.79, pas 64,79).
 *   * Chaque bloc totalise 100,00 à l'arrondi près. La ligne « Divers
 *     Actionnaires » est celle du classeur ; là où la retouche l'a absorbée,
 *     elle est recalculée en solde et le commentaire le dit.
 *   * L'ordre est celui du classeur : parts décroissantes, le divers en
 *     dernier.
 */

export type Shareholder = { name: string; pct: number };

const SHAREHOLDERS: Record<string, Shareholder[]> = {
  ADH: [
    { name: "SEFRIOUI ANAS", pct: 64.79 },
    { name: "RCAR", pct: 5.07 },
    { name: "Divers Actionnaires", pct: 30.14 },
  ],
  ADI: [
    { name: "NAFAKH LAZRAQ ALAMI MOHAMED", pct: 51.68 },
    { name: "RCAR", pct: 8.39 },
    { name: "Divers Actionnaires", pct: 39.93 },
  ],
  AFI: [
    { name: "Aluminium du Maroc SA", pct: 51.0 },
    { name: "Divers Actionnaires", pct: 49.0 },
  ],
  AFM: [
    { name: "TENOR FINANCES", pct: 39.48 },
    { name: "CIMR", pct: 11.63 },
    { name: "FIPAR HOLDING", pct: 10.0 },
    { name: "TENOR GROUP", pct: 3.61 },
    { name: "TENOR ASSURANCE", pct: 2.56 },
    { name: "Divers Actionnaires", pct: 32.72 },
  ],
  AGM: [
    { name: "ONA Courtage", pct: 50.03 },
    { name: "Divers Actionnaires", pct: 49.97 },
  ],
  AKT: [
    { name: "Talib Rochdi", pct: 11.3 },
    { name: "Akdim Ahmed", pct: 10.83 },
    { name: "Akdim Brahim", pct: 10.83 },
    { name: "Akdim Fatima", pct: 8.47 },
    { name: "Zakaria Jaouad", pct: 5.18 },
    { name: "El Mrini Mohammed", pct: 5.18 },
    { name: "Divers Actionnaires", pct: 48.21 },
  ],
  ALM: [
    { name: "HOLDING SA", pct: 37.81 },
    { name: "SOPINORD", pct: 18.95 },
    { name: "EL AYOUBI Hamza", pct: 4.99 },
    { name: "COFINORD", pct: 4.49 },
    { name: "ALUCOIL S.A.U", pct: 3.81 },
    { name: "HOLDING DE PARTICIPATION ET D INVESTISSEMENT DU NOR", pct: 3.41 },
    { name: "Divers Actionnaires", pct: 26.54 },
  ],
  ARD: [
    { name: "Label Vie SA", pct: 36.05 },
    { name: "Government Employees Pension Fund", pct: 9.77 },
    { name: "Best Financière SA", pct: 6.81 },
    { name: "Banque Européenne pour la Reconstruction et le Développe", pct: 4.38 },
    { name: "BMCI", pct: 3.41 },
    { name: "FCEC SARL", pct: 3.09 },
    { name: "Zakah Capital SARL", pct: 3.09 },
    { name: "FARAH MAGHREB", pct: 1.08 },
    { name: "Divers Actionnaires", pct: 32.32 },
  ],
  ATH: [
    { name: "AMANA", pct: 58.3 },
    { name: "CIMR", pct: 15.05 },
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 8.14 },
    { name: "Divers Actionnaires", pct: 18.52 },
  ],
  ATL: [
    { name: "HOLMARCOM Insurance Activities S.A", pct: 55.92 },
    { name: "CIH", pct: 10.0 },
    { name: "CDG (Caisse de Dépôt et de Gestion)", pct: 9.6 },
    { name: "HOLMARCOM (Holding Marocaine Commerciale)", pct: 5.21 },
    { name: "Divers Actionnaires", pct: 19.27 },
  ],
  ATW: [
    { name: "AL MADA", pct: 46.54 },
    { name: "WAFA ASSURANCE", pct: 6.32 },
    { name: "Groupe MCMA-MAMDA", pct: 6.15 },
    { name: "RCAR", pct: 5.71 },
    { name: "SANTUSA HOLDING", pct: 5.1 },
    { name: "CIMR", pct: 4.11 },
    { name: "CAISSE MAROCAINE DE RETRAITE (CMR)", pct: 2.41 },
    { name: "Personnel", pct: 2.17 },
    { name: "Divers Actionnaires", pct: 21.49 },
  ],
  BAL: [
    { name: "MATHIAS Jaqueline", pct: 30.09 },
    { name: "Argan Invest", pct: 22.44 },
    { name: "Multitec Electronics NV", pct: 21.72 },
    { name: "RMA", pct: 10.01 },
    { name: "Divers Actionnaires", pct: 15.74 },
  ],
  BCI: [
    { name: "BNP PARIBAS IRB PARTICIPATIONS", pct: 66.74 },
    { name: "AXA ASSURANCES MAROC", pct: 8.91 },
    { name: "ATLANTASANAD", pct: 8.44 },
    { name: "Divers Actionnaires", pct: 15.91 },
  ],
  BCP: [
    { name: "CIMR", pct: 14.9 },
    { name: "MCMA", pct: 8.87 },
    { name: "MAMDA", pct: 7.49 },
    { name: "RCAR", pct: 5.65 },
    { name: "Banque Populaire CENTRE SUD", pct: 5.8 },
    { name: "Banque Populaire TANGER TETOLIAN", pct: 5.0 },
    { name: "Banque Populaire FES MEKNES", pct: 4.99 },
    { name: "Banque Populaire NADOR AL HOCEIMA", pct: 4.99 },
    { name: "Banque Populaire MARRAKECH BENI MELLAL", pct: 4.99 },
    { name: "Banque Populaire RABAT KENITRA", pct: 4.99 },
    { name: "Banque Populaire OUJDA", pct: 4.92 },
    { name: "MAC", pct: 4.9 },
    { name: "BPCE", pct: 4.05 },
    { name: "Banque Populaire LAAYOUNE", pct: 3.43 },
    { name: "Personnel", pct: 2.16 },
    { name: "WAFA ASSURANCE", pct: 1.05 },
    { name: "Divers Actionnaires", pct: 11.83 },
  ],
  BOA: [
    { name: "RMA WATANYA", pct: 27.41 },
    { name: "BANQUE FEDERATIVE DU CREDIT MUTUEL", pct: 24.56 },
    { name: "CDG (Caisse de Dépôt et de Gestion)", pct: 8.13 },
    { name: "O CAPITAL GROUP", pct: 7.16 },
    { name: "Groupe MCMA-MAMDA", pct: 5.01 },
    { name: "British International Investment", pct: 4.48 },
    { name: "CIMR", pct: 3.93 },
    { name: "Personnel", pct: 1.07 },
    { name: "Divers Actionnaires", pct: 18.25 },
  ],
  CAP: [
    { name: "AMAPAR", pct: 27.57 },
    { name: "DUQUESA", pct: 17.57 },
    { name: "MERYDINAL", pct: 17.57 },
    { name: "MC IV MONEY", pct: 11.39 },
    { name: "LDW Holding", pct: 4.43 },
    { name: "MOBIZ", pct: 3.13 },
    { name: "MCIV Morocco FPCC-RFA", pct: 2.35 },
    { name: "Divers Actionnaires", pct: 15.99 },
  ],
  CDM: [
    { name: "Holmarcom Finance Company", pct: 54.61 },
    { name: "ATLANTASANAD", pct: 12.82 },
    { name: "WAFA ASSURANCE", pct: 10.74 },
    { name: "Divers Actionnaires", pct: 21.83 },
  ],
  CFG: [
    { name: "ALAMI Amyn", pct: 8.45 },
    { name: "RMA", pct: 7.22 },
    { name: "BENNANI Zouhair", pct: 4.83 },
    { name: "MAJDALINE HOLDING", pct: 4.66 },
    { name: "MUTANDIS SCA", pct: 4.38 },
    { name: "BANK OF AFRICA", pct: 4.07 },
    { name: "REIM International Limited", pct: 3.94 },
    { name: "CIMR", pct: 3.25 },
    { name: "AXA ASSURANCES MAROC", pct: 3.25 },
    { name: "Famille BENJELLOUN Younes", pct: 3.07 },
    { name: "BENBACHIR Souad", pct: 2.56 },
    { name: "DOUIRI Adil", pct: 2.29 },
    { name: "Divers Actionnaires", pct: 48.02 },
  ],
  CIH: [
    { name: "MASSIRA CAPITAL MANAGEMENT", pct: 50.82 },
    { name: "ATLANTASANAD", pct: 5.22 },
    { name: "Personnel", pct: 5.41 },
    { name: "RCAR", pct: 5.04 },
    { name: "Divers Actionnaires", pct: 33.51 },
  ],
  CMA: [
    { name: "Heidelberg Materials AMWA Holding GmbH L.G", pct: 41.0 },
    { name: "PROCIMAR", pct: 10.0 },
    { name: "CIMR", pct: 9.52 },
    { name: "CAISSE MAROCAINE DE RETRAITE (CMR)", pct: 6.5 },
    { name: "Abu Dhabi Fund for Development", pct: 4.8 },
    { name: "FIPAR HOLDING", pct: 2.86 },
    { name: "Divers Actionnaires", pct: 25.32 },
  ],
  CMG: [
    { name: "ADP II Holding 10 Luxembourg", pct: 26.72 },
    { name: "Africa Agriculture", pct: 5.12 },
    { name: "FIPAR HOLDING", pct: 7.83 },
    { name: "Moamah Youssef", pct: 5.02 },
    { name: "Alléon Jacques", pct: 1.0 },
    { name: "Divers Actionnaires", pct: 54.31 },
  ],
  CMT: [
    { name: "OSEAD Maroc Mining", pct: 37.04 },
    { name: "CIMR", pct: 14.41 },
    { name: "Divers Actionnaires", pct: 48.55 },
  ],
  COL: [
    { name: "COLBERT FINANCES SA", pct: 67.94 },
    { name: "YAN SASU", pct: 4.0 },
    { name: "Berrada Soleiman", pct: 2.09 },
    { name: "CHAGAR Abed", pct: 1.99 },
    { name: "Divers Actionnaires", pct: 23.98 },
  ],
  // Ligne étrangère retirée (« SANLAM ASSURANCE 35 % », venue d'un bloc voisin). « ASSURANCE 7,26 % » lu « WAFA ASSURANCE » — la cote la liste à cette place. Le divers (32,32) est le solde.
  CSR: [
    { name: "CIMR", pct: 18.2 },
    { name: "RCAR", pct: 10.45 },
    { name: "MCMA", pct: 9.85 },
    { name: "Sucden MAROC SAS", pct: 8.0 },
    { name: "WAFA ASSURANCE", pct: 7.26 },
    { name: "MAMDA", pct: 6.64 },
    { name: "MUTUELLE ATTAMINE CHAABI", pct: 3.13 },
    { name: "WAFA", pct: 2.14 },
    { name: "Sucre et Denrées SA", pct: 2.01 },
    { name: "Divers Actionnaires", pct: 32.32 },
  ],
  // Bloc décodé : la conversion avait intercalé le nom de la société dans chaque actionnaire (« URM MAAROC » = RMA + « …AU MAROC »). Total 100,00.
  CTM: [
    { name: "RMA", pct: 49.52 },
    { name: "BENJELLOUN Othman", pct: 28.84 },
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 5.0 },
    { name: "INTERFINA", pct: 1.47 },
    { name: "Divers Actionnaires", pct: 15.17 },
  ],
  // Classeur : « CIMR 61,20 % ». L'AMMC (31/12/2025) donne CIMR 6,12 % et un flottant de 26,26 % : virgule déplacée dans le classeur, corrigée ici, et le divers recalculé en solde.
  DHO: [
    { name: "HF INTERNATIONAL", pct: 62.62 },
    { name: "CIMR", pct: 6.12 },
    { name: "RCAR", pct: 5.0 },
    { name: "Divers Actionnaires", pct: 26.26 },
  ],
  DIA: [
    { name: "FININVEST", pct: 51.13 },
    { name: "AL CHIMIE", pct: 4.69 },
    { name: "GOLDFIN", pct: 3.48 },
    { name: "Divers Actionnaires", pct: 40.7 },
  ],
  DLM: [
    { name: "Famille BOUVEUR", pct: 50.01 },
    { name: "SOFTGROUP", pct: 11.25 },
    { name: "VIAUD Marie Elisabeth", pct: 7.2 },
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 6.82 },
    { name: "Eric CECCONELLO", pct: 6.8 },
    { name: "Divers Actionnaires", pct: 17.92 },
  ],
  DRI: [
    { name: "Famille KHALIL", pct: 70.6 },
    { name: "Divers Actionnaires", pct: 29.4 },
  ],
  DWY: [
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 21.87 },
    { name: "RMA", pct: 9.97 },
    { name: "Millenium Ventures", pct: 9.64 },
    { name: "RADI BENJELLOUN Karim", pct: 7.5 },
    { name: "Groupe Azim", pct: 6.77 },
    { name: "Groupe Selmaachi", pct: 5.73 },
    { name: "Groupe Anacleto", pct: 5.31 },
    { name: "Abdellilah Sbai", pct: 1.35 },
    { name: "Divers Actionnaires", pct: 31.86 },
  ],
  DYT: [
    { name: "EL HIMDY Younes", pct: 29.86 },
    { name: "CHAMI Ahmed Reda", pct: 4.55 },
    { name: "Divers Actionnaires", pct: 65.59 },
  ],
  EQD: [
    { name: "SOCIETE GENERALE CONSUMER FINANCE", pct: 34.95 },
    { name: "SGMB", pct: 18.77 },
    { name: "RCAR", pct: 16.88 },
    { name: "CIMR", pct: 6.02 },
    { name: "SCR (Société Centrale de Reassurance)", pct: 5.19 },
    { name: "INVESTIMA", pct: 3.1 },
    { name: "Divers Actionnaires", pct: 15.09 },
  ],
  FBR: [
    { name: "ZELLIDJA SA", pct: 57.08 },
    { name: "ASMA INVEST", pct: 12.31 },
    { name: "Divers Actionnaires", pct: 30.61 },
  ],
  GAZ: [
    { name: "Afriquía SMDC", pct: 38.0 },
    { name: "AKWA GROUP S.A.", pct: 30.01 },
    { name: "RMA WATANYA", pct: 5.0 },
    { name: "ATLANTA", pct: 4.0 },
    { name: "CDG (Caisse de Dépôt et de Gestion)", pct: 20.0 },
    { name: "Divers Actionnaires", pct: 2.99 },
  ],
  GTM: [
    { name: "M'hammed KABBAJ", pct: 37.0 },
    { name: "AKMH INVEST", pct: 35.25 },
    { name: "KABBAJ Mohammed", pct: 1.44 },
    { name: "KABBAJ Hamza", pct: 14.45 },
    { name: "KABBAJ Hicham", pct: 1.44 },
    { name: "KABBAJ Jihane", pct: 1.0 },
    { name: "KABBAJ Mohamed Ali", pct: 1.0 },
    { name: "KABBAJ Brahim", pct: 1.0 },
    { name: "Divers Actionnaires", pct: 7.42 },
  ],
  HPS: [
    { name: "KHALLOUQUI Samir", pct: 8.47 },
    { name: "ALAOUI SMAILI Abdesselam", pct: 7.54 },
    { name: "SABBAHE Driss", pct: 7.45 },
    { name: "HORANI Mohamed", pct: 7.16 },
    { name: "Morgan Stanley & Co international Pic", pct: 5.42 },
    { name: "Personnel", pct: 5.0 },
    { name: "MSL/Briawood Capital Partners LP", pct: 4.29 },
    { name: "Divers Actionnaires", pct: 54.67 },
  ],
  IAM: [
    { name: "SPT (Société de Participation dans les Télécommunications)", pct: 53.0 },
    { name: "Etat", pct: 22.0 },
    { name: "RCAR", pct: 5.32 },
    { name: "Divers Actionnaires", pct: 19.68 },
  ],
  IBC: [
    { name: "IB CORP", pct: 56.74 },
    { name: "Divers Actionnaires", pct: 43.26 },
  ],
  // Classeur : « CIMR 638,30 % », corrigé en 6,38 % (fiche AMMC). Le divers (66,89) est le solde ; la cote affichait 66,90 %.
  IMO: [
    { name: "AXA ASSURANCES MAROC", pct: 9.04 },
    { name: "Compagnie d'Assurance Transport", pct: 7.26 },
    { name: "CIMR", pct: 6.38 },
    { name: "SCR (Société Centrale de Reassurance)", pct: 5.66 },
    { name: "ALLIANZ MAROC", pct: 4.77 },
    { name: "Divers Actionnaires", pct: 66.89 },
  ],
  INV: [
    { name: "AM INVEST MOROCCO", pct: 37.46 },
    { name: "RACHDI Bachir", pct: 9.79 },
    { name: "BENNANI Omar", pct: 7.05 },
    { name: "EL OUARZAZI Héritiers", pct: 5.85 },
    { name: "LARAKI WALID", pct: 5.1 },
    { name: "Divers Actionnaires", pct: 34.75 },
  ],
  JET: [
    { name: "AR CORPORATION SARL", pct: 36.31 },
    { name: "RCAR", pct: 10.64 },
    { name: "TADLAQUI Omar Abdelkader", pct: 9.55 },
    { name: "DAOUDI Amine", pct: 4.15 },
    { name: "Divers Actionnaires", pct: 39.35 },
  ],
  LBV: [
    { name: "Retail holding", pct: 50.16 },
    { name: "SANLAM ASSURANCE", pct: 6.68 },
    { name: "ALJIA HOLDING", pct: 3.17 },
    { name: "Divers Actionnaires", pct: 39.99 },
  ],
  LES: [
    { name: "OLEOSUD", pct: 48.83 },
    { name: "CIMR", pct: 9.98 },
    { name: "CAISSE MAROCAINE DE RETRAITE (CMR)", pct: 7.67 },
    { name: "WAFA ASSURANCE", pct: 7.35 },
    { name: "MCMA", pct: 5.7 },
    { name: "MUTUELLE ATTAMINE CHAABI", pct: 2.74 },
    { name: "MAMDA", pct: 1.39 },
    { name: "Divers Actionnaires", pct: 16.34 },
  ],
  LHM: [
    { name: "LAFARGE MAROC", pct: 64.68 },
    { name: "Divers Actionnaires", pct: 35.32 },
  ],
  M2M: [
    { name: "RMK SA", pct: 65.43 },
    { name: "RMA Asset Management", pct: 8.32 },
    { name: "Divers Actionnaires", pct: 26.25 },
  ],
  MAB: [
    { name: "BANK OF AFRICA", pct: 52.47 },
    { name: "RMA Asset Management", pct: 21.39 },
    { name: "Groupe MCMA-MAMDA", pct: 7.99 },
    { name: "RMA", pct: 6.58 },
    { name: "Divers Actionnaires", pct: 11.57 },
  ],
  MDP: [
    { name: "SEFRIOUI MOHSIN", pct: 67.61 },
    { name: "ALIKEN", pct: 5.8 },
    { name: "Divers Actionnaires", pct: 26.59 },
  ],
  MIC: [
    { name: "AMOR Hassane", pct: 50.56 },
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 5.04 },
    { name: "Divers Actionnaires", pct: 44.4 },
  ],
  MLE: [
    { name: "BANQUE CENTRALE POPULAIRE", pct: 53.11 },
    { name: "HOLDPARTS", pct: 34.01 },
    { name: "THE ARAB INVESTMENT COMPANY SA.", pct: 5.74 },
    { name: "Divers Actionnaires", pct: 7.14 },
  ],
  MNG: [
    { name: "AL MADA", pct: 81.63 },
    { name: "CIMR", pct: 8.72 },
    { name: "Divers Actionnaires", pct: 9.65 },
  ],
  // Ligne étrangère retirée (« AKHANNOUCH SAFAA 35 % »). Une ligne illisible (« 2.00 N / 1,39 % ») est rangée en « Autres actionnaires ». Le divers (6,24) est le solde.
  MOX: [
    { name: "AKWA GROUP S.A.", pct: 62.48 },
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 20.55 },
    { name: "RMA WATANYA", pct: 4.0 },
    { name: "ATLANTA", pct: 3.45 },
    { name: "CDG (Caisse de Dépôt et de Gestion)", pct: 1.89 },
    { name: "Autres actionnaires", pct: 1.39 },
    { name: "Divers Actionnaires", pct: 6.24 },
  ],
  // Bloc décodé de la même façon. « Tanger Med Dev Log SA » confirmé par la fiche AMMC de Marsa Maroc.
  MSA: [
    { name: "TANGER MED DEV LOG SA", pct: 35.0 },
    { name: "Etat", pct: 25.0 },
    { name: "RCAR", pct: 3.33 },
    { name: "CAISSE MAROCAINE DE RETRAITE (CMR)", pct: 3.33 },
    { name: "WAFA ASSURANCE", pct: 3.07 },
    { name: "Divers Actionnaires", pct: 30.27 },
  ],
  MUT: [
    { name: "BANK OF AFRICA", pct: 9.0 },
    { name: "DOUIRI Adil", pct: 5.81 },
    { name: "RMA WATANYA", pct: 6.3 },
    { name: "PATRIMOINE GESTION ET PLACEMENTS", pct: 4.4 },
    { name: "Divers Actionnaires", pct: 74.49 },
  ],
  NEJ: [
    { name: "HAKAM ABDELLATIF FINANCE SA", pct: 31.45 },
    { name: "MAD INVEST", pct: 19.35 },
    { name: "FINAM SARL", pct: 14.32 },
    { name: "HAKAM EL ABBES PARTICIPATIONS", pct: 9.67 },
    { name: "ZAK FINANCE SARL", pct: 8.9 },
    { name: "BISMILLAH HOLDING", pct: 8.5 },
    { name: "LOUKSSOS HOLDING", pct: 4.57 },
    { name: "Divers Actionnaires", pct: 3.24 },
  ],
  NKL: [
    { name: "GROUPE AMEN", pct: 54.17 },
    { name: "GROUPE POULINA", pct: 28.7 },
    { name: "FLOTTANT BOURSE TUNIS", pct: 7.12 },
    { name: "Divers Actionnaires", pct: 10.01 },
  ],
  OUL: [
    { name: "ATLANTASANAD", pct: 28.66 },
    { name: "HOLMARCOM (Holding Marocaine Commerciale)", pct: 24.19 },
    { name: "OMI (Omnium Marocain d Investissement)", pct: 21.31 },
    { name: "SOCHEPAR (Société Cherifienne des Participations)", pct: 11.22 },
    { name: "Famille Bensalah", pct: 4.3 },
    { name: "Divers Actionnaires", pct: 10.32 },
  ],
  // Bloc décodé : « BH SIK.AMA MENA FZE » = HIKMA MENA FZE.
  PRO: [
    { name: "HIKMA MENA FZE", pct: 94.12 },
    { name: "Divers Actionnaires", pct: 5.88 },
  ],
  RDS: [
    { name: "Groupe Palmeraie Développement", pct: 44.99 },
    { name: "B Participation SARL", pct: 10.11 },
    { name: "Divers Actionnaires", pct: 44.9 },
  ],
  REB: [
    { name: "FONDS ABU DHABI", pct: 82.82 },
    { name: "ZELLIDJA SA", pct: 4.5 },
    { name: "SOMED", pct: 3.42 },
    { name: "Divers Actionnaires", pct: 9.26 },
  ],
  RIS: [
    { name: "RMA", pct: 35.0 },
    { name: "Mutris SCA", pct: 21.79 },
    { name: "CIMR", pct: 12.18 },
    { name: "MAMDA-MCMA-MAC", pct: 6.03 },
    { name: "Divers Actionnaires", pct: 25.0 },
  ],
  S2M: [
    { name: "SA MEDTECH", pct: 52.65 },
    { name: "CHADHA HOLDING", pct: 15.81 },
    { name: "AMKD", pct: 4.49 },
    { name: "Personnel", pct: 2.78 },
    { name: "Divers Actionnaires", pct: 24.27 },
  ],
  SAH: [
    { name: "Sanlam Pan Africa", pct: 85.59 },
    { name: "SANAM HOLDING", pct: 7.13 },
    { name: "ALJ Said", pct: 2.22 },
    { name: "Divers Actionnaires", pct: 5.06 },
  ],
  // Ligne étrangère retirée (« SAFARI 43 % »). Le divers (13,32) est le solde.
  SBM: [
    { name: "MDI", pct: 69.29 },
    { name: "CIMR", pct: 11.5 },
    { name: "BOURCHANIN ET CIE", pct: 3.68 },
    { name: "HEINEKEN", pct: 2.21 },
    { name: "Divers Actionnaires", pct: 13.32 },
  ],
  SID: [
    { name: "Nouvelles Sidérurgies Industrielles", pct: 64.86 },
    { name: "RCAR", pct: 5.06 },
    { name: "WAFAGESTION", pct: 2.37 },
    { name: "Divers Actionnaires", pct: 27.71 },
  ],
  SLF: [
    { name: "BANK OF AFRICA", pct: 52.2 },
    { name: "SANLAM HOLDING", pct: 6.87 },
    { name: "RCAR", pct: 3.92 },
    { name: "SANAM HOLDING", pct: 3.57 },
    { name: "Personnel", pct: 2.0 },
    { name: "Divers Actionnaires", pct: 31.45 },
  ],
  SMI: [
    { name: "MANAGEM", pct: 80.26 },
    { name: "CIMR", pct: 3.04 },
    { name: "Divers Actionnaires", pct: 16.71 },
  ],
  SNA: [
    { name: "SANASTOK", pct: 64.6 },
    { name: "SANLAM MAROC", pct: 13.77 },
    { name: "Divers Actionnaires", pct: 21.63 },
  ],
  // Bloc décodé : « SYNnEnPa) Holding » = YNNA HOLDING.
  SNP: [
    { name: "YNNA HOLDING", pct: 62.92 },
    { name: "Divers Actionnaires", pct: 37.08 },
  ],
  // Classeur : « BERRADA Mohammed Karim 67,15 % » et « CHADUI OMAR 42,80 % ». La cote officielle donne 6,71 % pour le premier ; le second suit la même virgule déplacée, 4,28 %. Le divers (12,42) est le solde.
  SOT: [
    { name: "TAZI MOHAMMED", pct: 17.59 },
    { name: "TAZI Najia", pct: 9.81 },
    { name: "TAZI Lamiae", pct: 8.19 },
    { name: "TAZI Selma", pct: 6.94 },
    { name: "BERRADA Mohammed Karim", pct: 6.71 },
    { name: "BERRADA BAHIA", pct: 6.5 },
    { name: "BERRADA Mohammed Amine", pct: 6.41 },
    { name: "Tahiri Ghali Consort", pct: 5.37 },
    { name: "CHADUI OMAR", pct: 4.28 },
    { name: "TAZI BADIA", pct: 4.0 },
    { name: "BERRADA HALIMA", pct: 3.93 },
    { name: "BERRADA Lina", pct: 3.67 },
    { name: "DIOURI Amal", pct: 3.02 },
    { name: "SEFRIOUI MOHAMMED", pct: 1.16 },
    { name: "Divers Actionnaires", pct: 12.42 },
  ],
  SRM: [
    { name: "Groupe Premium", pct: 78.12 },
    { name: "RCAR", pct: 5.38 },
    { name: "Divers Actionnaires", pct: 16.5 },
  ],
  // Bloc décodé : famille ZIAT + AL ISTIMRAR HOLDING (coquille « HOLIDNG » du classeur corrigée).
  STR: [
    { name: "AL ISTIMRAR HOLDING", pct: 55.62 },
    { name: "ZIAT Nabil", pct: 14.6 },
    { name: "ZIAT Reda", pct: 1.54 },
    { name: "ZIAT Mouna", pct: 1.31 },
    { name: "Divers Actionnaires", pct: 26.93 },
  ],
  T2S: [
    { name: "Trone Investment Holdings Limited", pct: 42.1 },
    { name: "SORDO Abderraouf", pct: 19.4 },
    { name: "Ahmed", pct: 7.1 },
    { name: "BOUIH Ismail", pct: 3.1 },
    { name: "BOUZID Mohamed", pct: 2.5 },
    { name: "Autres actionnaires (Membres du GAS)", pct: 2.0 },
    { name: "ACHAACH", pct: 1.2 },
    { name: "Divers Actionnaires", pct: 22.6 },
  ],
  // Bloc décodé : « NB DouEz CoAuSbAaaB… » = Bouzoubaa Mohammed.
  TGC: [
    { name: "Bouzoubaa Mohammed", pct: 60.97 },
    { name: "Divers Actionnaires", pct: 39.03 },
  ],
  TMA: [
    { name: "TotalEnergies Marketing Afrique", pct: 55.0 },
    { name: "ZAHID Intermational FZE", pct: 30.0 },
    { name: "Divers Actionnaires", pct: 15.0 },
  ],
  TQM: [
    { name: "Abu Dhabi National Energy Company", pct: 85.79 },
    { name: "Divers Actionnaires", pct: 14.21 },
  ],
  UMR: [
    { name: "SANAM AGRO", pct: 50.8 },
    { name: "SANAM HOLDING", pct: 24.37 },
    { name: "SANLAM MAROC", pct: 6.16 },
    { name: "ALJIA HOLDING", pct: 3.48 },
    { name: "Divers Actionnaires", pct: 15.19 },
  ],
  VCN: [
    { name: "Best Financière", pct: 29.43 },
    { name: "SA", pct: 14.0 },
    { name: "BENNANI Adil", pct: 5.89 },
    { name: "Amethis Fund II SCA SICAR", pct: 4.23 },
    { name: "Divers Actionnaires", pct: 46.45 },
  ],
  WAA: [
    { name: "OGM", pct: 79.29 },
    { name: "Divers Actionnaires", pct: 20.71 },
  ],
  ZDJ: [
    { name: "SOMED", pct: 69.5 },
    { name: "AXA ASSURANCES MAROC", pct: 17.58 },
    { name: "AL HOCEINIA SA", pct: 5.01 },
    { name: "REBAB COMPANY", pct: 4.57 },
    { name: "Divers Actionnaires", pct: 3.34 },
  ],
};

/**
 * Les actionnaires d'une valeur, ou `undefined` quand le classeur n'en publie
 * pas de fiable (CRS aujourd'hui) : l'absence se lit « Données non
 * disponibles », jamais un donut reconstruit sur des parts qui dépassent 100.
 */
export const shareholdersOf = (code: string): Shareholder[] | undefined =>
  SHAREHOLDERS[code.toUpperCase()];
