# 🧗 Escalade Pro Training

Application web (PWA) de suivi d'entraînement escalade : **niveau réglable de 5+ à 7c**, force, technique et progression sur 12 semaines.

## Fonctionnalités

- 🎯 **Niveau réglable** — un curseur 5+ → 7c qui pilote tout : cotations, volume de voies, essais par voie, prise du fingerboard, lest aux anneaux
- 🧠 **Avis du coach** — lit le journal de voies et propose de monter / descendre d'un cran selon le taux de flash
- 🗓️ **Plan jour par jour** — 7 jours (lundi force de doigts, mardi technique, mercredi récupération, jeudi flash, vendredi anneaux, samedi volume, dimanche repos) avec brief de coach et structure détaillée
- 🔄 **Semaines de décharge** — S4, S8 et S12 réduisent automatiquement le volume
- 📝 **Journal de voies** — cotation, profil, statut flash/work/chute, notes de séance
- 🖐️ **Fingerboard** — protocole adapté au niveau et à la phase, minuterie travail/repos, prescription écrite
- 💪 **Anneaux** — séries ajustées au niveau, tractions / dips / rows / gainage, chrono de séance
- 📊 **Analyse** — progression 12 semaines, taux de flash sur la cotation cible, historique, alertes santé des doigts
- ⏱️ Minuteurs dérive-compensés, minuterie de repos flottante, vibrations
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