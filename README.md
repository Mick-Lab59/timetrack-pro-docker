# TimeTrack Pro - Docker & ZimaOS Edition

Cette version de TimeTrack Pro est optimisée pour être installée sur un NAS (ZimaOS, CasaOS, Unraid) via Docker.

## 🚀 Installation Rapide (ZimaOS)

1. Ouvrez l'interface de **ZimaOS**.
2. Allez dans **App Store** -> **Custom Install**.
3. Choisissez **Import** et collez le contenu du fichier `docker-compose.yml` (en remplaçant `votre-pseudo/timetrack-pro` par le nom de votre image).
4. Cliquez sur **Install**.
5. L'application sera accessible sur le port **6901** (ex: `http://votre-nas:6901`).

## 🛠️ Configuration GitHub (Automatique)

Pour que chaque mise à jour de ton code soit envoyée automatiquement sur ZimaOS :

1. Crée un compte sur [Docker Hub](https://hub.docker.com/).
2. Crée un nouveau dépôt sur **GitHub** et pousse ce code.
3. Dans ton dépôt GitHub, va dans **Settings** -> **Secrets and variables** -> **Actions**.
4. Ajoute deux secrets :
   - `DOCKERHUB_USERNAME` : Ton pseudo Docker Hub.
   - `DOCKERHUB_TOKEN` : Un token généré dans tes paramètres Docker Hub (Security -> New Access Token).
5. Désormais, à chaque "Push", une nouvelle image sera créée !

## 💾 Persistance des données

Les données (entrées, réglages, entreprises) sont stockées dans le dossier `/app/data` du conteneur.
Dans le `docker-compose.yml`, nous avons mappé ce dossier vers `./data` sur ton NAS pour que tu ne perdes rien lors des mises à jour.

---
*Développé avec ❤️ par Mick-Lab*
