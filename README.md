# EPICC

Socle TypeScript en monorepo Nx : vitrine React rendue côté serveur, point d’entrée du futur backoffice sur `/connect` et API Hono sur `/api`. En production, un seul serveur Node sert ces trois espaces sur la même origine.

## Démarrer

Prérequis : Node **22.22 minimum dans la branche 22**, ou Node 24 et supérieur ; npm 10 ou supérieur. La version de référence est indiquée dans `.nvmrc`.

```sh
npm ci
npm run dev
```

Ouvrir <http://localhost:3100>. Le serveur React Router utilise le port 3100 et relaie `/api` vers Hono, sur le port 3101. Le chargement de la page d’accueil appelle l’API depuis le serveur, avant le rendu du HTML. Les modifications sont rechargées automatiquement.

Aucune base de données, aucun secret ni fichier `.env` ne sont nécessaires pour démarrer.

## Commandes

| Commande                                       | Usage                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                                  | Démarrer les deux applications en développement             |
| `npm run build`                                | Compiler le client, le rendu SSR et le serveur Hono         |
| `npm start`                                    | Servir le build de production, port 3100 par défaut         |
| `npm run check`                                | Formatage, lint, types, tests et build                      |
| `npm run test:e2e`                             | Construire et tester le serveur de production avec Chromium |
| `npm run format`                               | Formater le code                                            |
| `npm run graph`                                | Afficher le graphe des dépendances Nx                       |
| `npx nx test content-application`              | Tester un projet isolément                                  |
| `npx nx affected -t lint typecheck test build` | Vérifier les projets concernés par un changement            |

Pour les tests navigateur, installer Chromium une première fois : `npx playwright install chromium`. Ils utilisent le port 3190 et arrêtent leur serveur automatiquement. La CI effectue les mêmes vérifications.

Les bibliothèques sont consommées sous forme de sources : Vite et esbuild les compilent dans les applications. Elles ont chacune leurs cibles Nx `lint`, `typecheck` et `test` ; les deux applications ont aussi une cible `build`. Les tâches de vérification et de compilation sont mises en cache par Nx.

## Organisation

```text
apps/
  web/                         # Adaptateur entrant React Router : routes, SSR, interface
  api/                         # Adaptateur entrant Hono et assemblage des dépendances
libs/content/
  domain/                      # Entité Page et invariants métier, TypeScript pur
  application/                 # Cas d’usage et port PageRepository
  infrastructure/              # Adaptateur sortant de dépôt en mémoire
  contracts/                   # Contrat HTTP public et validation Zod
```

Les décisions d’architecture, les règles de dépendance et la méthode d’ajout d’une fonctionnalité sont décrites dans [ARCHITECTURE.md](ARCHITECTURE.md).

## Routes et contenu de démonstration

- `/` : vitrine responsive en français, rendue côté serveur, avec titre, description, Open Graph et URL canonique.
- `/clients/:slug` : fiche client sous forme de formulaire d’archives, avec navigation entre les fiches et retour au répertoire.
- `/connect` : page d’attente du futur backoffice, avec `noindex, nofollow`, `X-Robots-Tag` et `Cache-Control: no-store`.
- `/api/health` : état du serveur HTTP ; ce contrôle ne vérifie pas une base de données.
- `/api/v1/pages/accueil` : contenu public de démonstration, chargé par la vitrine.
- `/robots.txt` et `/sitemap.xml` : consignes d’exploration et liste des pages publiques.

Le contenu est déterministe et assemblé dans `apps/api/src/composition-root.ts`. Le cas d’usage masque les brouillons et les pages absentes avec le même statut 404. Une panne de l’API produit une page d’erreur 503 ; les erreurs techniques ne sont pas exposées au visiteur.

**Ce socle ne comprend pas encore de CMS, d’authentification, d’édition ni de persistance.** `/connect` ne donne aucun accès privilégié et aucune route d’écriture n’est exposée. L’exclusion des moteurs de recherche n’est pas une protection d’accès. Les contenus et l’identité visuelle sont des exemples à remplacer.

## Exécuter le build

```sh
npm run build
PUBLIC_SITE_URL=https://www.exemple.fr PORT=3100 npm start
```

Ce lancement reste local : publier et configurer le domaine est une étape d’hébergement distincte. Le serveur Hono sert `/api`, les ressources compilées et le rendu React Router. Les liens du navigateur restent sur la même origine ; aucun CORS n’est nécessaire.

| Variable              | Valeur par défaut                                                                 | Rôle                                                                                    |
| --------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `PORT`                | 3101 en développement pour Hono, 3100 en production                               | Port d’écoute du serveur Hono                                                           |
| `INTERNAL_API_ORIGIN` | `http://127.0.0.1:3101` en développement ; boucle locale sur `PORT` en production | Origine de l’API utilisée par le rendu SSR ; aussi cible du proxy Vite en développement |
| `PUBLIC_SITE_URL`     | `http://localhost:3100`                                                           | Origine publique des URLs canoniques, Open Graph et du sitemap                          |

Configurer `PUBLIC_SITE_URL` avec le vrai domaine avant une publication. Pour changer le port Hono en développement, fournir aussi `INTERNAL_API_ORIGIN`. Ne pas exposer ces paramètres dans le bundle navigateur. Le processus de production doit disposer de `dist/`, du `package.json` et de ses dépendances d’exécution (`npm ci --omit=dev`).

## Prochaines fonctionnalités

1. Ajouter l’authentification et une autorisation serveur sur chaque opération d’administration ; protéger les sessions et les écritures contre le CSRF.
2. Ajouter des cas d’usage distincts de création, modification et publication, puis leurs adaptateurs HTTP et leurs formulaires `/connect`.
3. Remplacer le dépôt en mémoire par une implémentation persistante du port, avec migrations et tests d’intégration.
4. Enrichir la vitrine avec les contenus réels, les pages publiques et leur référencement.

Le verrouillage transitoire d’`undici` dans `package.json` impose la version corrigée 7.29.1 à Nx 24, qui dépend de 7.29.0. Le retirer quand Nx embarquera une version corrigée.

## Direction visuelle et répertoire clients

La vitrine adopte un carnet de rencontres : papier grainé, encre bleue, notes manuscrites et photographies fixées par du scotch en CSS. Le répertoire propose une recherche par nom, ville ou univers (insensible aux accents) et un filtre par univers. Les formulaires GET et les liens vers les fiches restent utilisables sans JavaScript.

Les six clients de `apps/web/app/services/clients.ts` sont **entièrement fictifs** : noms, descriptions et propos servent uniquement à présenter l’interface. Ils ne constituent pas des références ni des témoignages réels. Remplacer ces données par des contenus validés avant une publication commerciale. Les images sont des illustrations mutualisées entre les exemples.

Les ressources sont servies localement, sans appel à une police ou à une image externe depuis le navigateur :

- Photographies d’illustration provenant d’Unsplash : [végétal](https://unsplash.com/photos/ef046c08a56e), [atelier](https://unsplash.com/photos/64674bd600d8), [café](https://unsplash.com/photos/236099ec97a0). Sources de téléchargement : `images.unsplash.com/photo-1497250681960-ef046c08a56e`, `photo-1441986300917-64674bd600d8`, `photo-1445116572660-236099ec97a0`.
- Police manuscrite Caveat, distribuée sous SIL Open Font License ; licence conservée dans `apps/web/public/fonts/OFL-Caveat.txt`.
- Grain SVG procédural et rubans adhésifs CSS créés pour cette interface. Les pièces jointes d’inspiration ne sont pas publiées dans le site.
