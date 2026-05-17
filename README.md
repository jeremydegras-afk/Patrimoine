# Mon Patrimoine

Application web (PWA) de suivi mensuel du patrimoine personnel — installable sur smartphone Android comme une vraie app.

## Fonctionnalités

- **Dashboard** : patrimoine brut/net, comparaison vs CAC 40, top/flop performances, objectifs, revenus passifs estimés
- **Saisie mensuelle** : 17 actifs sur 7 catégories, versements DCA pré-remplis, navigation entre mois
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

## Confidentialité

Aucune donnée n'est envoyée nulle part. Tout reste en local sur le téléphone.
