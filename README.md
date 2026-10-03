# 🧗 Escalade Pro Training

Application web (PWA) d'entraînement escalade : **niveau réglable de 5b à 8a**, plan jour par jour et suivi de progression sur 12 semaines.

## Fonctionnalités

- ◎ **Aujourd'hui** — la séance du jour, son brief de coach et la structure détaillée, avec une checklist et un bouton de validation
- ▤ **Semaine** — les 7 jours (lundi force de doigts, mardi technique, mercredi récupération, jeudi performance et flash, vendredi anneaux et gainage, samedi volume, dimanche repos) et le réglage de la semaine (1 à 12)
- 🎯 **Niveau réglable** — un curseur qui pilote tout : cotations, volume de voies, essais par voie, prise du fingerboard, lest, séries aux anneaux
- 🧠 **Avis du coach** — lit les 10 dernières voies du journal et propose de monter ou de descendre d'un cran selon le taux de flash
- ▲ **Mur** — journal de voies (cotation, profil, flash/work/chute, note) et note de séance
- ⚡ **Force** — fingerboard (protocole adapté au niveau et à la phase, chrono travail/repos) et anneaux (séries ajustées, chrono de séance)
- ◔ **Bilan** — progression 12 semaines, taux de flash sur la cotation cible, historique, alertes santé des doigts
- 🔄 **Semaines de décharge** — S4, S8 et S12 réduisent automatiquement le volume
- 📱 **PWA** — installable sur téléphone, fonctionne hors-ligne (service worker)
- 💾 Données stockées dans `localStorage` (aucun serveur requis)

## Vérification

```
node test_plan.js
```

## Mise en route

Ouvrir `index.html` dans un navigateur, ou déployer sur [GitHub Pages](https://pages.github.com/) :

1. Aller dans **Settings → Pages** du dépôt GitHub
2. Source : `Deploy from a branch` → branche `main` / dossier `/ (root)`
3. L'app est disponible à l'URL `https://<user>.github.io/Escalade-training-/`

## Structure

```
├── index.html           # App complète (une seule page)
├── test_plan.js         # Contrôle du moteur de niveau + plan (node)
├── manifest.webmanifest # Manifest PWA (installation)
├── sw.js                # Service worker (offline / cache)
├── icons/               # Icônes PWA (180, 192, 512)
├── .nojekyll            # Désactive Jekyll sur GitHub Pages
└── github.txt           # URL du dépôt distant
```