# 🧗 Escalade Pro Training

Application web (PWA) d'entraînement escalade : **niveau réglable de 5b à 8a**, plan jour par jour et suivi de progression sur 12 semaines.

## Fonctionnalités

- ◎ **Aujourd'hui** — la séance du jour, son brief de coach, la structure en checklist et un bouton de validation
- 🗓️ **Semaine** — les 7 jours (lundi force de doigts, mardi technique, mercredi récupération, jeudi performance et flash, vendredi anneaux et gainage, samedi volume, dimanche repos)
- 📆 **Semaine calculée** — elle avance toute seule depuis la date de lancement du cycle (décharges S4/S8/S12 comprises), avec un ajustement manuel ± si tu as manqué des semaines
- 🎯 **Niveau réglable** — un curseur qui pilote tout : cotations, volume de voies, essais par voie, prise du fingerboard, lest, séries aux anneaux
- 🧠 **Coach** — avis calculé sur tes voies à la cotation cible (au moins 5 voies, 3 jours différents, moins de 3 semaines) : il propose de monter ou de descendre d'un cran, avec un bouton « Appliquer »
- 📉 **Profil faible** — taux de flash par profil (dévers, dalle, verticale, toit) calculé depuis le journal ; le profil le plus faible devient la priorité du jeudi
- 🖐️ **Chrono doigts** — mise en place 10 s, travail, repos, enchaînés automatiquement sur toutes les séries ; le poids réellement utilisé est noté et ton record par prise s'affiche
- 💪 **Chrono anneaux** — séquence scriptée : le chrono attend ta validation sur chaque série puis décompte le repos (tractions 2:30, dips 1:30, rows 1:30, gainage 0:45) avant de passer à l'exercice suivant
- 🎓 **Fin de cycle** — à la 12e semaine, bilan du cycle et nouveau palier en un clic
- ▲ **Mur** — journal de voies (cotation, profil, flash/work/chute, note) et note de séance
- ◔ **Bilan** — progression, taux de flash sur la cotation cible, taux par profil, voies du cycle, historique, alertes santé des doigts
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
├── test_plan.js         # Contrôle du moteur de niveau, des chronos et du coach (node)
├── manifest.webmanifest # Manifest PWA (installation)
├── sw.js                # Service worker (offline / cache)
├── icons/               # Icônes PWA (180, 192, 512)
├── .nojekyll            # Désactive Jekyll sur GitHub Pages
└── github.txt           # URL du dépôt distant
```