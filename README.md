# Lyamfi: Your Moroccan Investment Guide

Crée une application web nommée "Lyamfi": une plateforme d'éducation financière dédiée au marché marocain (Bourse de Casablanca / BVC).

## Identité visuelle

- Palette basée sur le logo fourni : noir/anthracite profond en fond principal (#0A0A0A à #121212), avec un accent doré-jaune en dégradé (de #E8A73F/#D9A441 vers #F5E14C/#FFF0A0) pour les CTA, highlights, graphiques et éléments actifs.

- Texte principal blanc cassé (#F5F5F0), texte secondaire gris (#8A8A8A).

- Direction artistique inspirée de finary.fr en termes de TON VISUEL uniquement (pas le contenu) : interface épurée, dark mode par défaut, beaucoup d'espace blanc négatif (ici "espace noir"), typographie moderne et grande (style Inter ou Söhne), cards avec coins arrondis (rounded-2xl), ombres douces, animations subtiles au scroll et au hover, chiffres/KPIs mis en avant en gros caractères avec le dégradé doré.

- Logo Lyamfi en haut à gauche de la navbar (fichier fourni séparément à intégrer).

## Structure de l'application

### 1. Landing page

Hero avec proposition de valeur claire ("Apprends, simule, investis: la bourse marocaine expliquée simplement"), aperçu des 4 modules, social proof placeholder, CTA "Créer un compte gratuit".

### 2. Dashboard utilisateur

Vue d'ensemble : progression dans les modules, résumé du portefeuille simulé, accès rapide aux 4 sections.

### 3. Module "Bourse" (data BVC)

- Liste des valeurs cotées à la BVC avec fiche par action : cours actuel (mock/placeholder à connecter plus tard), secteur, capitalisation.

- Fiche de valorisation fondamentale par action : PER, BPA, DY (dividend yield), PEG, cours cible, upside, avec graphique d'évolution du cours.

- Filtre par secteur (banques, immobilier, telecom, etc.) et par capitalisation.

### 4. Simulateur de portefeuille

- L'utilisateur construit un portefeuille virtuel (choix des actions BVC + pondération en %).

- Calcul automatique : concentration sectorielle, rendement pondéré, dividend yield moyen, score de diversification.

- Visualisation en camembert (allocation) + courbe de performance simulée dans le temps.

### 5. Modules pédagogiques

- Parcours structuré en niveaux (Débutant / Intermédiaire / Avancé) : c'est quoi une action, comment lire un bilan, PER/PEG expliqués, comprendre l'AMMC et la réglementation, gestion du risque.

- Chaque module = leçon courte + quiz de validation + badge de progression.

### 6. Simulateur de budget & intérêts composés

- Formulaire : montant investi/mois, durée (années), niveau de risque (Prudent ~3-4%, Modéré ~6-7%, Dynamique ~9-10%, avec disclaimer que ce sont des hypothèses pédagogiques, pas des promesses de rendement).

- Graphique montrant la courbe de croissance du capital (versements vs intérêts composés cumulés), avec comparaison "avec intérêts composés" vs "épargne simple sans rendement" pour bien montrer l'effet.

- Résultat chiffré clair en bas : capital final, total versé, total des intérêts générés.

## Contraintes techniques

- Responsive mobile-first.

- Authentification utilisateur basique (email/password).

- Toutes les données de marché (cours, PER, etc.) doivent être structurées comme des données modifiables/éditables depuis une table Supabase, pas hardcodées en dur dans le frontend, pour pouvoir être mises à jour manuellement par la suite.

- Disclaimer visible sur les pages de simulation : "Outil pédagogique, ne constitue pas un conseil en investissement."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lyamfi.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2453dc32-ea97-4a62-8999-498cfb8f3e98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm: [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
