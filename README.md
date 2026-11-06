# EPICC

Socle TypeScript en monorepo Nx : vitrine React rendue côté serveur, gestion des images sur `/connect` et API Hono sur `/api`. En production, un seul serveur Node sert ces trois espaces sur la même origine.

## Démarrer

Prérequis : Node **22.22 minimum dans la branche 22**, ou Node 24 et supérieur ; npm 10 ou supérieur. La version de référence est indiquée dans `.nvmrc`.

```sh
npm ci
npm run dev
```

Ouvrir <http://localhost:3100>. Le serveur React Router utilise le port 3100 et relaie `/api` vers Hono, sur le port 3101. La page d’accueil est rendue en HTML côté serveur. Les visuels des projets et des offres sont chargés depuis l’API avant le rendu. Les modifications sont rechargées automatiquement. Fournir `DATABASE_URL` avant le démarrage, comme décrit ci-dessous.

Le serveur utilise PostgreSQL : créez une base dédiée avec votre hébergeur ou `createdb epicc`, puis fournissez `DATABASE_URL` dans l’environnement du processus (par exemple `postgresql://utilisateur:mot-de-passe@localhost:5432/epicc`). Les tables et les contenus initiaux sont créés au premier lancement. Aucun fichier `.env` n’est nécessaire. La connexion à la gestion exige un compte initial et un secret de session.

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
- `/clients/viandes-des-sommets` : page du projet Viandes des Sommets, accessible depuis la vitrine.
- `/connect` : connexion et gestion des images des projets et des offres. Les routes de gestion sont exclues de l’indexation et du cache.
- `/api/health` : état du serveur HTTP ; ce contrôle ne vérifie pas une base de données.
- `/api/v1/pages/accueil` : contenu éditorial de démonstration.
- `/robots.txt` et `/sitemap.xml` : consignes d’exploration et liste des pages publiques.

Le contenu est déterministe et assemblé dans `apps/api/src/composition-root.ts`. Le cas d’usage masque les brouillons et les pages absentes avec le même statut 404. Une panne de l’API produit une page d’erreur 503 ; les erreurs techniques ne sont pas exposées au visiteur.

La gestion des images comprend une authentification administrateur, des sessions signées de huit heures, une protection CSRF et une API privée protégée par un jeton serveur. Les pages éditoriales de démonstration restent en mémoire. L’accueil reprend la maquette EPICC.

## Exécuter le build

Pour l’hébergement Railway avec PostgreSQL, consulter le [guide de configuration](docs/railway.md). Le Dockerfile à la racine construit et sert les deux applications dans une seule image.

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

Configurer `PUBLIC_SITE_URL` avec le vrai domaine avant une publication. Derrière un proxy, ce domaine reste prioritaire pour les actions de gestion. Sans domaine public configuré, les formulaires de gestion peuvent retrouver l’origine du navigateur uniquement après validation de leur jeton CSRF et du cookie signé ; les en-têtes `Forwarded` ne sont pas utilisés comme preuve. Pour changer le port Hono en développement, fournir aussi `INTERNAL_API_ORIGIN`. Ne pas exposer ces paramètres dans le bundle navigateur. Le processus de production doit disposer de `dist/`, du `package.json` et de ses dépendances d’exécution (`npm ci --omit=dev`).

## Gestion des images

Configurer les variables dans l’environnement du serveur, sans les exposer au navigateur. PostgreSQL est obligatoire, y compris pour la vitrine :

| Variable         | Usage                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | URL de la base PostgreSQL dédiée, obligatoire. Le compte doit pouvoir créer les tables. Configurer TLS selon les exigences de l’hébergeur, sans désactiver la vérification des certificats.                                                 |
| `ADMIN_EMAIL`    | Adresse du compte administrateur initial, obligatoire pour sa création.                                                                                                                                                                     |
| `ADMIN_PASSWORD` | Mot de passe du compte initial. Haché avec scrypt et un sel aléatoire avant stockage ; utilisé uniquement si le compte n’existe pas. Peut être retiré après création. Changer cette variable ne change pas un mot de passe déjà enregistré. |
| `SESSION_SECRET` | Secret aléatoire d’au moins 32 caractères, obligatoire pour la connexion et l’API privée. Le conserver entre redémarrages ; sa rotation invalide les sessions.                                                                              |

La gestion permet d’ajouter, remplacer et supprimer les photos des projets, et de modifier les visuels des offres. Les images JPEG, PNG, WebP ou AVIF peuvent être téléversées (5 Mo par défaut, limite configurable).

L’API crée automatiquement les tables et les offres initiales. Une migration unique supprime les anciennes fiches du répertoire ainsi que leurs images devenues inutilisées, en préservant les médias référencés par les projets, les offres et la vitrine. Les anciennes URLs du répertoire, des fiches et de leur gestion répondent 404 ; seule la page projet Viandes des Sommets est conservée. Le sitemap contient l’accueil et cette page.

Les comptes et les médias sont conservés dans PostgreSQL après redémarrage. Les nouveaux médias sont stockés dans le bucket privé avec `MEDIA_STORAGE=s3` ; le stockage historique PostgreSQL reste disponible pendant la transition. Voir le [guide des images](docs/stockage-images.md) pour les variables S3 et la migration. Sauvegarder la base avec les outils de l’hébergeur ou `pg_dump`.

Configurer `PUBLIC_SITE_URL` avec le domaine HTTPS réel pour les URLs SEO, le contrôle d’origine des formulaires et le cookie sécurisé. `SESSION_SECRET` doit être identique dans les processus web et API en développement.

### Créer un compte administrateur

Sur une machine disposant de l’accès à la base PostgreSQL cible et des dépendances du projet, fournir `DATABASE_URL` et `ADMIN_EMAIL` dans l’environnement, puis exécuter :

```sh
npm run admin:create
```

La commande initialise les tables si nécessaire, crée le compte et affiche une seule fois un mot de passe aléatoire. Le conserver dans un gestionnaire de mots de passe. Pour choisir un mot de passe, fournir aussi `ADMIN_PASSWORD` (au moins huit caractères) dans l’environnement avant la commande ; il ne sera pas affiché. Ne pas passer les secrets en arguments de ligne de commande ni les versionner. La commande refuse d’écraser un compte existant. Le serveur de l’application doit utiliser la même base et disposer de `SESSION_SECRET` (32 caractères minimum) pour permettre la connexion sur `/connect`.

La création de compte nécessite une connexion PostgreSQL durable : les bases temporaires utilisées par les tests ne constituent pas un compte utilisable sur l’hébergement réel.

### Réinitialiser le mot de passe d’un administrateur

Si le compte existe déjà, changer `ADMIN_PASSWORD` dans la configuration ne modifie pas son mot de passe enregistré. Sur le serveur ayant accès à la base de l’application, fournir `DATABASE_URL`, `ADMIN_EMAIL` et le nouveau `ADMIN_PASSWORD`, puis exécuter :

```sh
npm run admin:reset-password
```

La commande remplace uniquement le mot de passe du compte indiqué. Elle refuse un compte absent ou un mot de passe inférieur à huit caractères. Le mot de passe fourni n’est pas affiché. Sans `ADMIN_PASSWORD`, elle génère et affiche une seule fois un nouveau mot de passe, comme la commande de création. Aucun redémarrage de l’application n’est nécessaire après cette opération.

### Images des offres

Depuis `/connect`, ouvrir « Modifier les images » pour l’une des offres. Téléverser un JPEG, PNG, WebP ou AVIF dans la limite configurée (5 Mo par défaut), renseigner son texte alternatif, puis enregistrer. Une prévisualisation permet de retrouver le visuel ; il peut être remplacé ou retiré. Les modifications sont immédiatement visibles sur l’accueil, y compris sans JavaScript. Le visuel est recadré en 3:2 ; la largeur alterne entre 100 % et 58 % selon la position de l’offre, sur bureau comme sur mobile. Les images remplacées ou retirées sont supprimées lorsqu’elles ne sont plus référencées ; les suppressions S3 en échec sont reprises par une file persistante. Les offres initiales conservent leurs libellés illustrés et n’ont pas de photographie ajoutée automatiquement.

Le formulaire « Image de survol » gère un second visuel indépendant, avec sa propre description, son remplacement et sa suppression. Sur ordinateur, il apparaît au survol de l’offre ou au focus clavier, derrière les mentions manuscrites et sans déplacer les autres offres. Sur écran tactile, il reste visible dans la ligne de l’offre. Cette interaction fonctionne aussi sans JavaScript.

Les tests d’intégration et navigateur exigent `TEST_DATABASE_URL` (URL du serveur PostgreSQL de test) et `TEST_DB_PREFIX` (préfixe réservé, par exemple `test_local_`). Ils créent des bases temporaires isolées portant ce préfixe et les suppriment après exécution. Le compte utilisé est `test@questboard.test` / `testtest`, puis les bases sont nettoyées. Ces identifiants ne sont jamais activés automatiquement au démarrage habituel.

## Prochaines fonctionnalités

1. Étendre la gestion aux pages éditoriales et aux contenus réels.
2. Prévoir plusieurs comptes et rôles si l’équipe de gestion s’agrandit.
3. Ajouter une gestion des comptes et un parcours de changement de mot de passe.

Le verrouillage transitoire d’`undici` dans `package.json` impose la version corrigée 7.29.1 à Nx 24, qui dépend de 7.29.0. Le retirer quand Nx embarquera une version corrigée.

## Direction visuelle

L’accueil reprend le cadre `411:3` du fichier [EPICC-SITE](https://www.figma.com/design/KSR9sI73Y80NkzBfCmUdP2/EPICC-SITE?node-id=411-3) : ouverture photographique, menu, prestations, parcours de Chloé, manifeste, réalisations et contact. Les sections React sont isolées dans `apps/web/app/components/vitrine`, avec des styles préfixés et des variables typographiques. La composition bureau suit les proportions du cadre de 1920 px ; sur mobile, les colonnes passent en lecture verticale. Les libellés « MENU » sont conservés ; le premier ouvre une navigation native accessible sans JavaScript.

Le lien « Connexion ↗ » est visible directement en haut de l’accueil et mène à `/connect`. Pour activer la connexion sur l’hébergement, fournir `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL` et `ADMIN_PASSWORD` lors du premier démarrage, comme décrit plus haut. Aucun compte de démonstration n’est activé en production.

L’accueil présente un écran de chargement EPICC avec une progression réelle pendant le téléchargement et le décodage de ses images, y compris les illustrations SVG et les visuels des offres. Toutes les images de la page sont chargées avant de révéler le contenu. Après douze secondes, un bouton permet d’entrer sans attendre ; le lien vers la gestion reste accessible pendant le chargement. Une image en erreur ne bloque pas l’ouverture. Sans JavaScript, le contenu reste directement lisible ; si le JavaScript de l’application ne démarre pas, le masque se retire au bout de quinze secondes.

Les photographies et illustrations sont servies dans leur format et leur résolution d’origine, sans recompression ni rasterisation des SVG. Les nouvelles images téléversées dans la gestion (projets et offres) sont validées, puis enregistrées et servies avec leurs octets d’origine. La limite d’envoi est de 5 Mo par défaut (`IMAGE_MAX_BYTES` configurable) et 40 millions de pixels. Si un fichier avait déjà été compressé par une version précédente, téléverser à nouveau son original : les détails perdus ne peuvent pas être reconstitués depuis le fichier compressé. Les images privées conservent leur protection.

Les ressources sont servies localement, sans appel à une police ou à une image externe depuis le navigateur :

- Visuels originaux de la maquette dans `apps/web/public/images/vitrine`, servis localement sans URL temporaire Figma.
- Roboto Mono normale et italique (graisse 700), auto-hébergée ; licence SIL conservée dans `apps/web/public/fonts/OFL-RobotoMono.txt`.
- Photographies d’illustration du répertoire provenant d’Unsplash : [végétal](https://unsplash.com/photos/ef046c08a56e), [atelier](https://unsplash.com/photos/64674bd600d8), [café](https://unsplash.com/photos/236099ec97a0). Sources de téléchargement : `images.unsplash.com/photo-1497250681960-ef046c08a56e`, `photo-1441986300917-64674bd600d8`, `photo-1445116572660-236099ec97a0`.
- Police manuscrite Caveat, distribuée sous SIL Open Font License ; licence conservée dans `apps/web/public/fonts/OFL-Caveat.txt`.
- Grain SVG procédural et rubans adhésifs CSS créés pour cette interface. Les pièces jointes d’inspiration ne sont pas publiées dans le site.

### Réalisations et contact de la vitrine

La section `#projets` reprend les photographies et les noms manuscrits du cadre Figma `411:3`. Les images originales sont conservées dans `apps/web/public/images/vitrine/projets-*` avec leur format réel, sans recompression. La composition bureau conserve les emplacements et les recadrages de la maquette ; sur mobile, les images sont regroupées par projet dans l’ordre de lecture. Ces réalisations sont gérées depuis la section « Les projets clients » de `/connect`. Chaque client a un logo et peut recevoir autant de photos que nécessaire, ajoutées une par une. Chaque photo propose les tailles Petite, Moyenne et Grande ; les images existantes gardent leurs dimensions exactes tant qu’aucune taille n’est choisie. L’Écluse Douze et Deux Mnu sont deux clients séparés. Les deux apparitions historiques du logo de L’Écluse Douze partagent le même remplacement, tout en conservant leurs emplacements. Une photo ajoutée peut être supprimée ; un visuel d’origine peut être rétabli.

Au démarrage, les 26 visuels d’origine sont importés de façon idempotente dans le stockage configuré, avec références et métadonnées en PostgreSQL. Avec `MEDIA_STORAGE=s3`, les fichiers sont copiés dans le bucket et relus pour vérifier leur SHA-256 avant publication de la référence. Les originaux restent disponibles pour la restauration. `npm run media:migrate` importe aussi ces visuels puis migre les anciens binaires PostgreSQL vers S3. Les fichiers versionnés restent les sources de reprise et ne sont pas modifiés. L’import conserve les éditions existantes et s’arrête si deux remplacements contradictoires du logo de L’Écluse Douze sont présents. Les options `--inventory` et `--verify` de `dist/apps/api/migrate-images.mjs` permettent des contrôles en lecture seule. L’import des 26 originaux dans le bucket de development et leur persistance après redémarrage ont été vérifiés ; voir [le compte rendu du stockage](docs/stockage-images.md).

La navigation donne accès aux offres, à la présentation, aux projets et au contact. Le menu déroulant conserve aussi l’accès à la gestion. Les liens fonctionnent sans JavaScript.

La section `#contact` comprend les champs nom, prénom et demande. Le formulaire est activé avec l’adresse de test `test@test.com` par défaut. Fournir `CONTACT_EMAIL` dans l’environnement du serveur pour la remplacer par l’adresse publique souhaitée. Le formulaire ouvre la messagerie du visiteur avec un message à relire avant envoi. Sans JavaScript, le formulaire utilise le protocole natif `mailto:`. Une messagerie configurée est nécessaire ; aucun mail ne part du serveur et aucune demande n’est enregistrée. Si `CONTACT_EMAIL` est explicitement vide ou invalide, le bouton est désactivé et un message explique son indisponibilité. Cette variable ne contient que l’adresse de contact publique ; aucun secret ni accès de messagerie n’est nécessaire pour ce fonctionnement.
