# EPICC

Socle TypeScript en monorepo Nx : vitrine React rendue côté serveur, gestion des clients sur `/connect` et API Hono sur `/api`. En production, un seul serveur Node sert ces trois espaces sur la même origine.

## Démarrer

Prérequis : Node **22.22 minimum dans la branche 22**, ou Node 24 et supérieur ; npm 10 ou supérieur. La version de référence est indiquée dans `.nvmrc`.

```sh
npm ci
npm run dev
```

Ouvrir <http://localhost:3100>. Le serveur React Router utilise le port 3100 et relaie `/api` vers Hono, sur le port 3101. Le chargement de la page d’accueil appelle l’API depuis le serveur, avant le rendu du HTML. Les modifications sont rechargées automatiquement.

La vitrine démarre sans secret ni fichier `.env`. La base SQLite des clients est créée automatiquement au premier lancement de l’API ; la connexion à la gestion accepte un identifiant et un mot de passe non vides au choix pour découvrir le Dashboard.

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
- `/connect` : connexion et liste des clients ; `/connect/clients/nouveau` et `/connect/clients/:slug` : création et modification. Ces routes sont exclues de l’indexation et du cache.
- `/api/health` : état du serveur HTTP ; ce contrôle ne vérifie pas une base de données.
- `/api/v1/pages/accueil` : contenu public de démonstration, chargé par la vitrine.
- `/robots.txt` et `/sitemap.xml` : consignes d’exploration et liste des pages publiques.

Le contenu est déterministe et assemblé dans `apps/api/src/composition-root.ts`. Le cas d’usage masque les brouillons et les pages absentes avec le même statut 404. Une panne de l’API produit une page d’erreur 503 ; les erreurs techniques ne sont pas exposées au visiteur.

La gestion des clients comprend un accès de démonstration avec des identifiants libres, des sessions signées de huit heures, une protection CSRF et une API privée protégée par un jeton serveur. Les pages éditoriales de démonstration restent en mémoire. Les contenus et l’identité visuelle sont des exemples à remplacer.

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

## Gestion des clients

Le Dashboard est en accès de démonstration : toute personne peut se connecter avec un identifiant et un mot de passe non vides, sans contrôle des valeurs, et gérer les fiches. L’identifiant peut être un simple texte, sans format e-mail. `ADMIN_EMAIL` et `ADMIN_PASSWORD` ne sont plus utilisés.

Variables du serveur, à conserver hors du navigateur :

| Variable          | Usage                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_SECRET`  | Secret aléatoire d’au moins 32 caractères ; signe les sessions et protège l’API privée. Généré automatiquement au lancement de `npm start` si absent ou trop court ; les sessions expirent alors au redémarrage. Définir une valeur stable pour les conserver. |
| `CLIENTS_DB_PATH` | Chemin de la base SQLite ; par défaut `data/clients.sqlite`, relatif au répertoire de lancement.                                                                                                                                                               |

La gestion permet d’ajouter, modifier et supprimer les fiches, de changer tous leurs textes, leur couleur, leur ordre et leur publication. Les adresses des fiches restent stables après création pour préserver les liens. Les images JPEG, PNG ou WebP peuvent être téléversées (5 Mo maximum) ou remplacées par une illustration existante. Les suppressions nécessitent une confirmation explicite.

L’API crée automatiquement les tables et importe une seule fois les six exemples fictifs. Les modifications, les images et même une liste entièrement vidée sont conservées après redémarrage. SQLite utilise le module natif `node:sqlite` (Node peut afficher un avertissement expérimental). Aucun service Postgres n’est nécessaire.

**Hébergement : monter un volume persistant et inscriptible pour le dossier contenant `CLIENTS_DB_PATH`**, hors de `dist/`, et sauvegarder ce volume avec le processus arrêté ou avec un outil de sauvegarde SQLite. Un disque éphémère perdrait les modifications au redéploiement. Ce stockage convient à un serveur Node unique ; plusieurs répliques sur des disques séparés nécessiteraient un stockage partagé adapté. Configurer `PUBLIC_SITE_URL` avec le domaine HTTPS réel pour les URLs SEO, le contrôle d’origine des formulaires et le cookie sécurisé. En développement (`npm run dev`), fournir le même `SESSION_SECRET` d’au moins 32 caractères aux processus web et API.

Les visiteurs lisent uniquement les fiches publiées. L’accueil, les filtres, les fiches et le sitemap chargent ces données à chaque requête côté serveur. Les descriptions SEO et Open Graph suivent le contenu édité. Un brouillon répond 404 sur son URL publique et son image téléversée reste privée. L’administration et la vitrine fonctionnent également sans JavaScript.

Les tests navigateur utilisent une base temporaire isolée, des identifiants libres et aucun accès administrateur configuré, puis nettoient leur stockage.

## Prochaines fonctionnalités

1. Étendre la gestion aux pages éditoriales et aux contenus réels.
2. Prévoir plusieurs comptes et rôles si l’équipe de gestion s’agrandit.
3. Migrer le stockage des clients si l’hébergement nécessite plusieurs répliques.

Le verrouillage transitoire d’`undici` dans `package.json` impose la version corrigée 7.29.1 à Nx 24, qui dépend de 7.29.0. Le retirer quand Nx embarquera une version corrigée.

## Direction visuelle et répertoire clients

La vitrine adopte un carnet de rencontres : papier grainé, encre bleue, notes manuscrites et photographies fixées par du scotch en CSS. Le répertoire propose une recherche par nom, ville ou univers (insensible aux accents) et un filtre par univers. Les formulaires GET et les liens vers les fiches restent utilisables sans JavaScript.

Les six clients initiaux de `apps/api/src/clients.seed.ts` sont **entièrement fictifs** : noms, descriptions et propos servent uniquement à présenter l’interface. Ils ne constituent pas des références ni des témoignages réels. Remplacer ces données par des contenus validés avant une publication commerciale. Les images sont des illustrations mutualisées entre les exemples.

Les ressources sont servies localement, sans appel à une police ou à une image externe depuis le navigateur :

- Photographies d’illustration provenant d’Unsplash : [végétal](https://unsplash.com/photos/ef046c08a56e), [atelier](https://unsplash.com/photos/64674bd600d8), [café](https://unsplash.com/photos/236099ec97a0). Sources de téléchargement : `images.unsplash.com/photo-1497250681960-ef046c08a56e`, `photo-1441986300917-64674bd600d8`, `photo-1445116572660-236099ec97a0`.
- Police manuscrite Caveat, distribuée sous SIL Open Font License ; licence conservée dans `apps/web/public/fonts/OFL-Caveat.txt`.
- Grain SVG procédural et rubans adhésifs CSS créés pour cette interface. Les pièces jointes d’inspiration ne sont pas publiées dans le site.
