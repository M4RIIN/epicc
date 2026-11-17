# EPICC — Vitrine statique

Le site comprend l’accueil et la réalisation Viandes des Sommets. Le build produit du HTML, du CSS, des images WebP et un petit script pour l’animation du manifeste et la préparation du message de contact. Les pages se lisent et se parcourent aussi sans JavaScript.

```sh
npm ci
npm run build
npm start
```

L’aperçu écoute sur <http://localhost:3100>. Utilisez `PORT` si nécessaire. Pour modifier le contenu, éditez les fichiers dans `apps/web/app/content` et les composants de la vitrine dans `apps/web/app/components/vitrine`, puis relancez le build. Les images sources sont dans `apps/web/public/images`.

Le dossier **`dist/site`** suffit pour publier le site sur un hébergement statique. Configurez l’hébergement pour servir `index.html` dans les dossiers et utiliser `404.html` pour les pages inconnues. Le Dockerfile fournit aussi un serveur de fichiers sans dépendance applicative. Voir [l’hébergement par conteneur](docs/railway.md).

## GitHub Pages

Dans les paramètres du dépôt, sélectionnez **Pages → Build and deployment → Source → GitHub Actions**. Le workflow de vérification publie `dist/site` après chaque push sur `main` dont les vérifications réussissent. Il utilise l’adresse fournie par GitHub Pages, par défaut <https://m4riin.github.io/epicc/>. Pour activer le formulaire, définissez la variable Actions `CONTACT_EMAIL` avec l’adresse publique de contact.

## Variables de build

Deux variables publiques peuvent être fournies **au moment du build** :

- `PUBLIC_SITE_URL` définit l’adresse publique du site, avec son éventuel chemin de publication, par exemple `https://m4riin.github.io/epicc/`. Elle sert aux liens internes, aux URL canoniques, au partage social, aux données structurées et au sitemap. Sans adresse publique, les liens partent de la racine et le build omet les références absolues et le sitemap.
- `CONTACT_EMAIL` active le formulaire avec une adresse de contact publique. Le formulaire ouvre la messagerie du visiteur et ne transmet aucune donnée au site.

`npx playwright install chromium` installe le navigateur de test. `npm run check` vérifie le format, le lint, les types et la vitrine dans Chromium.
