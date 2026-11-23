# Mon Patrimoine

Application web (PWA) de suivi mensuel du patrimoine personnel — installable sur smartphone Android comme une vraie app.

## Fonctionnalités

- **Dashboard** : patrimoine brut/net, comparaison vs CAC 40 et S&P 500 (mise à jour automatique), top/flop performances, objectifs avec date estimée d'atteinte, revenus passifs estimés
- **Saisie mensuelle** : 19 actifs sur 8 catégories (dont PER et ETF crypto), versements DCA pré-remplis, navigation entre mois
- **Analyse** : détail par actif et catégorie, flux nets, historique
- **Projection** : intérêts composés sur 5/10/15/20 ans avec apports DCA
- **Réglages** : crédit immobilier (CRD calculé auto), DCA, taux de rendement, objectifs, export/import JSON
- **Mode privé** : icône œil pour masquer tous les montants
- **Hors-ligne** : service worker, données stockées localement (localStorage)

## Stack technique

HTML + JavaScript vanilla + Tailwind CSS + Chart.js. Aucun build, aucun serveur, aucune base de données externe. Tout vit dans le navigateur du téléphone.

## Installation sur Android

1. Ouvrir l'URL de l'app dans Chrome
2. Menu ⋮ → **« Ajouter à l'écran d'accueil »**
3. Confirmer — l'icône apparaît comme une vraie app

## Installation sur iOS

1. Ouvrir l'URL dans Safari
2. Bouton Partage → **« Sur l'écran d'accueil »**

## Sauvegarde des données

Les données sont stockées localement (localStorage). Pour sauvegarder :

- **Réglages → Exporter (JSON)** : télécharge un fichier de sauvegarde
- À garder dans Google Drive / iCloud / par mail

Pour restaurer sur un autre appareil :
- **Réglages → Importer une sauvegarde**

## Structure du repo

```
.
├── index.html              # Application complète (HTML + CSS + JS)
├── manifest.webmanifest    # Manifest PWA
├── sw.js                   # Service worker (cache offline)
├── data/indices.json       # Clôtures mensuelles CAC 40 / S&P 500 (créé et mis à jour par le robot)
├── scripts/update_indices.py             # Script qui récupère les indices
├── .github/workflows/update-indices.yml  # Planification quotidienne (GitHub Actions)
├── icon.svg                # Icône vectorielle
├── icon-192.png            # Icône PWA Android
├── icon-512.png            # Icône PWA Android (haute résolution)
├── icon-180.png            # Apple touch icon
├── .nojekyll               # Désactive le traitement Jekyll GitHub Pages
└── README.md               # Ce fichier
```

## Déploiement

Compatible avec n'importe quel hébergement statique :

- **GitHub Pages** : activer dans Settings → Pages → Source = `main` branch / `/` (root)
- **Netlify** : drag & drop le dossier, ou connexion GitHub auto
- **Vercel** : import du repo
- **Cloudflare Pages** : connexion GitHub
- **Hébergement local** : ouvrir `index.html` directement dans le navigateur

## Mise à jour automatique des indices (CAC 40, S&P 500)

Un robot GitHub Actions récupère chaque soir de bourse les clôtures mensuelles (Yahoo Finance, FRED en secours pour le S&P 500) et les enregistre dans `data/indices.json`. L'app relit ce fichier à chaque ouverture : rien à saisir à la main.

Mise en route (une seule fois) :

1. Mettre en ligne dans le repo les dossiers `.github/` et `scripts/` avec le reste des fichiers
2. Onglet **Actions** du repo → workflow **« Mise à jour des indices »** → **Run workflow** pour créer `data/indices.json` tout de suite
3. Vérifier que le fichier `data/indices.json` est apparu dans le repo, puis rouvrir l'app

Dans l'app : **Réglages → Indices CAC 40 et S&P 500 → Actualiser** force une relecture et affiche la date de dernière mise à jour. Le S&P 500 est suivi en points (USD), sans conversion en euros.

## Dates estimées des objectifs

Pour chaque objectif, l'app simule mois par mois l'évolution de chaque actif à partir du dernier mois saisi : rendement attendu de sa catégorie, versement DCA mensuel, amortissement du crédit. La date affichée est le premier mois où la cible est atteinte ; elle est recalculée à chaque saisie et à chaque changement d'hypothèse.

## Confidentialité

Aucune donnée personnelle n'est envoyée nulle part. Tout reste en local sur le téléphone. Le seul échange réseau est le téléchargement des cours des indices, qui sont publics.
