# 🧗 Escalade Pro Training

Application web (PWA) de suivi d'entraînement escalade orientée **niveau 6c** : force, technique et progression sur 12 semaines.

## Fonctionnalités

- 🏔️ **Mur** — séances Mardi (technique) / Jeudi (performance), journal de voies (cotation, profil, statut flash/work/chute), notes de séance
- 🖐️ **Fingerboard** — protocole adapté par phase (S1-4, S5-8, S9-12) avec minuteur travail/repos et progression de charge
- 💪 **Anneaux** — tractions lestées, dips, rows, gainage + chrono de séance 30 min
- 📊 **Analyse** — progression 12 semaines, stats de grimpe, historique, alertes santé des doigts
- ⏱️ Minuteurs dérive-compensés, minuterie de repos flottante, vibrations, notification du statut de séance
- 📱 **PWA** — installable sur téléphone, fonctionne hors-ligne (service worker)
- 💾 Données stockées en `localStorage` (aucun serveur requis)

## Mise en route

Ouvrir `index.html` dans un navigateur, ou déployer sur [GitHub Pages](https://pages.github.com/) :

1. Aller dans **Settings → Pages** du dépôt GitHub
2. Source : `Deploy from a branch` → branche `main` / dossier `/ (root)`
3. L'app est disponible à l'URL `https://<user>.github.io/Escalade-training-/`

## Structure

```
├── index.html           # App complète (une seule page)
├── manifest.webmanifest # Manifest PWA (installation)
├── sw.js                # Service worker (offline / cache)
├── icons/               # Icônes PWA (180, 192, 512)
├── .nojekyll            # Désactive Jekyll sur GitHub Pages
└── github.txt           # URL du dépôt distant
```