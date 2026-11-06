# Stockage des images

## Visuels des réalisations et photos par client

Les 26 visuels `projets-*` sont désormais importés au démarrage depuis les fichiers du build. La table `project_originals` rattache chaque emplacement à une image ; `images` conserve UUID, clé S3, MIME, dimensions natives, taille et SHA-256. En mode S3, la copie est relue et comparée avant d’enregistrer la référence. L’import reprend les fichiers manquants après une interruption, sans doublonner ceux déjà validés. Les originaux sont exclus du nettoyage pour permettre leur restauration. La commande `npm run media:migrate` effectue également cet import avant la migration des anciens binaires. Les fichiers versionnés restent disponibles comme sources de reprise.

Dans `/connect`, chaque client possède un seul logo. L’Écluse Douze et Deux Mnu disposent de cartes séparées. La seconde apparition historique de L’Écluse Douze est un emplacement du même logo : un remplacement met les deux à jour sans changer la composition initiale. Une ancienne surcharge de cet emplacement reste utilisée si le logo principal n’avait pas encore été modifié.

« Ajouter une photo » permet des ajouts successifs sans limite de nombre par client. Le fichier est validé selon les limites habituelles, sans recompression, puis rattaché au client en base. Les ajouts sont affichés après les photos existantes, dans l’ordre d’ajout. Le sélecteur propose Petite (123), Moyenne (222) et Grande (297), largeurs de référence sur une composition de 1920 pixels. Les proportions sont conservées et l’affichage reste adaptatif. Les dimensions historiques, recadrages et miroirs sont préservés jusqu’à un choix explicite de taille. Une photo ajoutée peut être supprimée ; les visuels initiaux peuvent être rétablis avec leurs dimensions et leur texte alternatif d’origine.

L’import utilise un verrou pour éviter les copies concurrentes et ne déclenche pas le nettoyage des images historiques non référencées. Deux remplacements différents des emplacements du logo de L’Écluse Douze arrêtent l’import avant toute copie : les sources restent intactes et le conflit doit être résolu explicitement. Les contenus déjà présents sont comparés par empreinte avant et après migration. Une base vierge peut être initialisée avec les données de démarrage.

La commande applique d’abord les migrations applicatives, puis prend l’inventaire de référence pour contrôler l’import des médias. Cet ordre permet notamment la mise à jour prévue des offres d’origine sans déclencher à tort l’erreur « Les contenus ont changé pendant l’import ». Les contenus doivent rester strictement identiques entre cet inventaire et la fin de l’import, y compris pour une table initialement vide. Les offres personnalisées restent protégées par la migration applicative.

Les commandes suivantes effectuent uniquement des lectures, depuis un processus disposant des accès PostgreSQL et S3 :

```sh
node dist/apps/api/migrate-images.mjs --inventory
node dist/apps/api/migrate-images.mjs --verify
```

### Import et vérification réels dans development

Le 6 novembre 2026, le déploiement `827fc479-43fc-4794-912a-91e4c0edbc94` a importé **26 visuels**, ignoré **0 visuel** et détecté **0 conflit** dans le bucket existant. Les copies représentent **94 073 195 octets**, sans recompression. L’inventaire PostgreSQL préalable comptait 6 fiches clients, 5 offres, 1 réglage de visuel, aucune image enregistrée et aucun original importé. Les empreintes des contenus existants sont restées identiques après cette importation.

Le déploiement final `796df1ee-75de-43ab-ac4e-099196e735c5`, exécutant le code `6b1ccab`, a confirmé la reprise : **0 nouvel import, 26 visuels ignorés, 0 conflit**. Sa commande préalable a relu les 26 objets privés et vérifié leurs SHA-256, MIME, tailles et dimensions contre les originaux et les métadonnées PostgreSQL. Les 26 références sont conservées dans `project_originals`, avec leurs métadonnées dans `images` ; aucun binaire historique n’a été purgé.

Un remplacement de `D8DV39.png` pour Annafurna est apparu entre les deux contrôles. Il a été conservé, sans restauration ni remplacement par l’import. L’inventaire final compte donc **27 images en base et 27 objets dans le bucket** : les 26 originaux et cette image éditée. Les empreintes des 6 fiches, des 5 offres et des 2 réglages alors présents sont restées identiques pendant la reprise.

Le service applicatif a ensuite été redémarré explicitement dans development, avec reprise du serveur confirmée dans les journaux le 6 novembre à 11:18:06 UTC. Après ce redémarrage :

- les 26 originaux relus directement depuis S3 privé et via le proxy sont identiques aux fichiers versionnés ;
- les références des originaux et des éditions sont stables ; le remplacement d’Annafurna est également identique entre S3 et le proxy ;
- la lecture anonyme d’un objet existant renvoie HTTP 403 ;
- les dimensions, positions, ajustements et miroirs des 26 emplacements correspondent exactement à l’état avant import aux largeurs 1440, 375 et 320 pixels, sans débordement ;
- sans JavaScript, les 26 emplacements chargent également leurs images depuis les références PostgreSQL.

L’accès SSH Railway a renvoyé « The agent path is temporarily unavailable ». L’inventaire et les vérifications PostgreSQL ont donc été exécutés par la commande préalable au déploiement, à l’intérieur du réseau privé Railway. Aucun proxy public PostgreSQL n’a été créé. Les identifiants ont été utilisés uniquement par les processus autorisés, sans modification des fichiers `.env` ni des variables du service.

Les contrôles locaux `npm run check` passent, dont les tests de reprise sur base vierge, de préservation des éditions et des images historiques et de rejet des conflits. Les 10 parcours Playwright de gestion et de composition ont également passé avec et sans JavaScript avant l’import réel.

## Diffusion des visuels depuis le backend

Tous les visuels affichés par l’accueil et la page Viandes des Sommets utilisent des références du backend. Aucun visuel de ces pages ne se replie sur un fichier local ou une variante calculée à la compilation. Les URL de partage et les SVG utilisent également le backend. Les remplacements des projets et des offres restent ceux enregistrés depuis le backoffice ; un visuel réutilisé dans le contact suit le même remplacement que dans le projet.

Les 26 originaux des projets restent gérés par `project_originals`. Le catalogue `vitrineAssetFiles` décrit les 50 autres visuels de la maquette et de la page client. Au premier démarrage, `importVitrineOriginals` copie leurs octets dans le stockage configuré et enregistre leurs références dans `vitrine_originals`. Avec S3, les fichiers sont privés et ne transitent que par l’API ; avec le stockage PostgreSQL, les mêmes routes sont utilisées. L’import est idempotent et protégé par un verrou : une référence existante n’est jamais écrasée par le fichier du build. Les fichiers livrés ne servent qu’à initialiser ou reprendre le stockage. Les originaux de la vitrine sont protégés du nettoyage.

Les routes `/api/v1/vitrine-images/<uuid>`, `/api/v1/project-images/<uuid>` et `/api/v1/offer-images/<uuid>` fournissent les visuels publics. Le HTML rendu côté serveur conserve les textes alternatifs et les dimensions et fournit `srcset` et `sizes`. Les navigateurs choisissent les WebP adaptés à l’écran, sans JavaScript. L’image d’ouverture reste prioritaire, les autres images utilisent le chargement différé natif et les SVG restent vectoriels. Les routes d’images sont autorisées dans `robots.txt`. Un catalogue backend absent ou incomplet produit une erreur 503 plutôt que des images locales différentes.

Une URL telle que `/api/v1/project-images/<uuid>?w=640&v=1` génère un WebP au premier accès puis le réutilise depuis la table `image_variants`. Ce cache léger persiste dans PostgreSQL, même quand l’original est dans S3. Deux conversions au maximum s’exécutent simultanément ; les demandes identiques partagent la même conversion dans un processus. Un cache existant, y compris une réponse 304, ne relit pas S3. Les variantes sont publiques et mises en cache pendant un an avec `immutable` ; les originaux fixes de la maquette sont également immuables grâce à leurs UUID.

Un remplacement de projet ou d’offre reçoit un nouvel UUID et de nouvelles URL. Les variantes de l’ancien fichier sont supprimées avec celui-ci par clé étrangère. Les références publiques sont vérifiées avant de lire une variante. Les routes originales des projets et offres conservent leur revalidation ; les images des brouillons et les chemins administrateurs gardent leurs contrôles d’accès et leur absence de cache partagé. Un navigateur ayant déjà téléchargé une variante publique peut la conserver jusqu’à expiration de son cache.

Le paramètre de version fait partie de la recette de conversion : le changer si la recette doit changer. Les largeurs sont limitées à 320, 640, 1280 et 1920 pixels, sans agrandissement des petites images. Les transparences et les originaux sont conservés.

## Architecture et compatibilité

Le monorepo conserve React Router 8 / React 19, Hono, Nx et PostgreSQL. Les formulaires existants des clients, des offres et des projets passent par une session administrateur et un jeton CSRF côté web, puis une autorisation serveur côté API. Aucun identifiant S3 ne traverse le navigateur. Les fichiers de reprise des maquettes dans `apps/web/public/images/` restent versionnés ; ils initialisent le stockage du backend, dont les références sont ensuite utilisées par les pages publiques. Aucun upload n’est conservé sur le disque applicatif.

`Database.images` fournit l’écriture, la lecture et le nettoyage via `ObjectStorage`. Avec `MEDIA_STORAGE=s3`, les nouveaux fichiers sont déposés dans le bucket privé et PostgreSQL ne reçoit que l’UUID, la clé, le type réel, la taille, les dimensions et le SHA-256. Le contenu JSON des fiches conserve ses URL `/api/v1/*-images/<uuid>` ; aucun changement de référence n’est nécessaire. Les anciens binaires PostgreSQL restent lisibles pendant la transition.

Le SDK AWS signe les requêtes côté serveur. Le proxy vérifie en base l’existence de la référence et, pour les clients, la publication de la fiche avant de lire S3. Les brouillons ne sont disponibles que via le chemin administrateur, avec `private, no-store`. Les originaux publics des fiches, des offres et des projets ont un ETag SHA-256 et `public, max-age=0, must-revalidate` : le navigateur conserve les octets et peut recevoir une réponse 304, mais chaque réutilisation revalide la publication. Les suppressions et dépublications sont ainsi effectives sans attendre l’expiration d’un cache partagé. Cette stratégie économise le transfert vers le navigateur ; elle relit encore S3 pour calculer l’ETag.

Chaque upload reçoit une clé UUID unique. La validation utilise Sharp pour identifier et décoder réellement JPEG, PNG, WebP ou AVIF ; le nom et le MIME déclarés ne font pas foi. SVG, HEIC, animations, fichiers corrompus et images dépassant 40 millions de pixels sont refusés. La taille par défaut est 5 Mio, configurable jusqu’à 50 Mio. Les limites multipart des deux serveurs ajoutent 1 Mio pour les champs et en-têtes. Le back-office affiche la limite configurée et propose un aperçu local avant enregistrement ; il reste utilisable sans JavaScript.

Les originaux conservent leurs octets, leur résolution et leurs proportions, conformément au comportement photographique existant. Aucun réencodage avec perte ni agrandissement n’est appliqué aux originaux ; les versions WebP de diffusion sont générées séparément. Les formats WebP et AVIF permettent de fournir des images déjà optimisées. Le cadrage visuel existant de la vitrine reste inchangé.

## Connexion Railway

L’inspection distante a confirmé par `projectToken` le projet `ed8fc074-7306-4773-b03c-fd468da68e68` (nom Railway : `EPPIC`) et l’environnement `development`, identifiant `0be15747-de9f-4ba5-8dd8-0653e3e4280b`. Le jeton de projet est chargé depuis un fichier protégé hors dépôt, uniquement dans l’environnement des processus/API. Les identifiants S3 sont lus via l’API puis conservés en mémoire pour la recette ; aucun secret n’est affiché, intégré au build ou enregistré dans Git.

| Ressource            | État dans `development`                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Application          | Service `EPICC`, `18ea4b9e-e7eb-41c5-b15e-d83f26cc15f6`, domaine <https://epicc-development.up.railway.app>         |
| Base                 | Service `Postgres`, `64953ca0-24fe-4021-931b-78c8422c22e2`, volume préservé sur `/var/lib/postgresql/data`          |
| Bucket               | `epicc-medias`, `3cb5a3e9-84a1-48ce-aa2f-84ac89575a6c`, région Amsterdam (`ams`), instance `development` uniquement |
| Accès aux objets     | Bucket privé ; lecture anonyme d’un objet existant sur son URL exacte refusée avec HTTP 403                         |
| Configuration du SDK | URL virtual-host et région de signature `auto`, conformément aux identifiants fournis par Railway                   |

Le propriétaire a approuvé le coût et créé le bucket dans Railway. Il est réutilisé ici, sans création d’un autre bucket. Le jeton de projet a permis de lire l’inventaire et les identifiants S3, configurer le service et déployer dans `development`. Il avait refusé la création de la ressource bucket au niveau du projet (`Bad Access`) ; cela ne bloque plus l’intégration après la création manuelle.

### Variables configurées

Ces huit variables ont été ajoutées uniquement au service `EPICC` dans `development`, par mise à jour partielle (`replace: false`) et sans redéploiement automatique lors de l’écriture (`skipDeploys: true`). Les cinq références de connexion ont été relues et leur résolution a été vérifiée sans afficher leurs valeurs. Toutes les autres variables, dont `DATABASE_URL`, les identifiants administrateur et `SESSION_SECRET`, ont été préservées.

| Variable applicative   | Configuration appliquée               |
| ---------------------- | ------------------------------------- |
| `MEDIA_STORAGE`        | `s3`                                  |
| `S3_ENDPOINT`          | `${{epicc-medias.ENDPOINT}}`          |
| `S3_BUCKET`            | `${{epicc-medias.BUCKET}}`            |
| `S3_REGION`            | `${{epicc-medias.REGION}}`            |
| `S3_ACCESS_KEY_ID`     | `${{epicc-medias.ACCESS_KEY_ID}}`     |
| `S3_SECRET_ACCESS_KEY` | `${{epicc-medias.SECRET_ACCESS_KEY}}` |
| `S3_FORCE_PATH_STYLE`  | `false`                               |
| `IMAGE_MAX_BYTES`      | `5242880`                             |

Les fichiers `.env` et `.env.*` n’ont pas été modifiés. Aucun réglage CORS n’est nécessaire : le navigateur communique avec l’application et non avec S3. Ne pas préfixer ces variables par `VITE_` et ne pas les passer au build web.

En développement local, injecter les variables dans le processus depuis un gestionnaire de secrets ; un endpoint HTTP est accepté hors production pour un émulateur S3. L’absence de `MEDIA_STORAGE` garde le mode historique `database` pendant une transition. Une configuration `s3` incomplète échoue explicitement au démarrage. Après migration, conserver `MEDIA_STORAGE=s3` et les variables S3 pour lire les objets existants.

Sources officielles : [Railway Buckets, variables et styles d’URL](https://docs.railway.com/storage-buckets), [upload et diffusion](https://docs.railway.com/storage-buckets/uploading-serving).

## Migration et retour arrière

Sauvegarder PostgreSQL avant l’opération et utiliser les variables du même environnement que l’application. Le schéma est étendu automatiquement au démarrage, sans suppression des données historiques. L’import SQLite existant est préservé et peut être suivi de cette migration.

Dans un checkout avec les dépendances de développement :

```sh
npm run media:migrate
```

Dans l’image de production, où `tsx` n’est pas installé :

```sh
node dist/apps/api/migrate-images.mjs
```

La migration traite les images PostgreSQL une par une, sous verrou de ligne. Elle utilise la même clé déterministe `media/<uuid>` à chaque reprise, vérifie les octets relus depuis S3 par SHA-256, puis enregistre les métadonnées. Les UUID et références JSON restent identiques. Une image déjà migrée est ignorée ; une interruption ne nécessite pas de recommencer les copies validées. Les données sources ne sont pas supprimées.

Après validation visuelle, recette et sauvegarde, le propriétaire peut autoriser la purge séparée :

```sh
npm run media:migrate -- --purge-legacy
# ou dans l’image :
node dist/apps/api/migrate-images.mjs --purge-legacy
```

Cette commande relit et compare chaque copie S3 à sa source avant de mettre uniquement le binaire historique à NULL. Une comparaison en échec laisse la source concernée intacte. Ne pas exécuter avant validation. Après migration, conserver `MEDIA_STORAGE=s3` et les variables S3 : le proxy en a besoin pour lire les objets déjà migrés. Le mode `database` sert à la transition avant migration et ne constitue pas un retour arrière après migration. Un retour à une ancienne version du code nécessite une restauration de sauvegarde ; ne pas rétrograder vers une version qui suppose trois colonnes dans `images`.

## Pannes et fichiers orphelins

Avant chaque PUT, une réservation est enregistrée dans `media_deletions`, avec un délai d’une heure. Après validation transactionnelle de la référence, cette réservation disparaît. En cas d’échec de transaction, la référence précédente reste intacte et la nouvelle clé est programmée pour suppression immédiate. Même un arrêt brutal après le PUT laisse une réservation durable, qui sera nettoyée après le délai. Ce délai dépasse largement les délais maximum des requêtes S3.

Le remplacement, la suppression et la restauration des visuels déposent les anciennes clés inutilisées dans la même file, dans la transaction PostgreSQL qui enlève leur référence. La suppression distante ne démarre qu’après commit ; elle est idempotente. Un échec S3 ne transforme pas un enregistrement réussi en erreur : la tâche reste en base. Le nettoyage reprend au démarrage, toutes les minutes et après les écritures. Plusieurs réplicas utilisent `FOR UPDATE SKIP LOCKED`. Ne jamais supprimer la file pour « réparer » une indisponibilité S3. Surveiller sa taille et le journal « Nettoyage S3 différé ».

Nettoyage manuel, sans balayage destructif du bucket :

```sh
npm run media:cleanup
# ou dans l’image :
node dist/apps/api/migrate-images.mjs --cleanup
```

Une passe traite au maximum 20 tâches. Les objets déjà référencés en base ne sont pas supprimés. Les objets ajoutés manuellement hors application ne sont pas concernés. Les lectures/écritures S3 indisponibles renvoient HTTP 503 avec un message générique, sans journaliser les identifiants ni les erreurs brutes du SDK.

## Recette et limites de validation

Les paragraphes suivants décrivent l’intégration initiale du stockage. La validation des 26 visuels de réalisations est détaillée plus haut.

Les vérifications locales `npm run check` ont réussi : format, lint, TypeScript, tests unitaires et d’intégration, build. Les 13 tests ciblés du stockage et de la validation des images passent. La première recette navigateur complète a terminé avec 24 succès et un test réussi à la reprise après une erreur de flux ZIP de trace Playwright ; une nouvelle exécution des six parcours de gestion a ensuite passé sans échec.

Après connexion au bucket réel, les vérifications suivantes ont réussi :

- PUT, GET, nouvelle connexion et DELETE pour JPEG, PNG, WebP et AVIF avec les vrais identifiants Railway ; les octets relus correspondent aux sources.
- Refus HTTP 403 de la lecture anonyme d’un objet existant, sur l’URL virtual-host exacte du bucket.
- API Hono + base PostgreSQL éphémère + S3 Railway : autorisation, métadonnées sans binaire, lecture après réouverture, ETag/304, remplacement et suppression.
- Migration de données fictives PostgreSQL vers S3 réel : copie vérifiée, deuxième exécution sans doublon et source conservée.
- Les six parcours Playwright de gestion ont passé avec S3 Railway réellement activé, avec et sans JavaScript (`npx playwright test --project=gestion --no-deps`, 2,7 minutes). Les huit clés d’objets créées par ces parcours ont été suivies et nettoyées.
- Sur le domaine `development` : upload administrateur, brouillon invisible au public, aperçu administrateur protégé, publication, image publique, ETag/304 et affichage dans la fiche vitrine.
- Relecture après redéploiement réel : référence et SHA-256 inchangés ; refus des fichiers invalides et dépassant 5 Mo ; remplacement, suppression de l’ancienne référence et retrait de la fiche de test.

Les recettes utilisent exclusivement des contenus fictifs. Les comptes de test locaux restent `test@questboard.test` / `testtest` ; sur le service distant, aucune création ou réinitialisation de compte administrateur n’a été effectuée. Les écritures de recette distantes sont authentifiées côté serveur sans connexion interactive ni exposition du secret de session. Seules les fiches et images créées pour la recette sont supprimées à la fin. Aucun contenu existant, service, volume ou ressource d’un autre environnement n’a été supprimé.

### Déploiement et migration dans development

Le code de la branche a été déployé dans `development` sans push ni fusion de PR. Le premier déploiement `dac3fbeb-576a-48e7-b817-3b407962ddae` a réussi. Un redéploiement `370a2c7d-9338-40cc-ae25-c4f17fdb79fc` a permis de vérifier la persistance réelle des images. La commande préalable `node dist/apps/api/migrate-images.mjs`, avec délai de 300 secondes, a été configurée uniquement sur ce service dans `development` ; elle remplace une valeur initialement vide, sans modifier d’autre commande existante.

Le déploiement final `777e5e17-2c7b-449d-9624-be994a3fbab0` est en statut `SUCCESS` et applique cette commande de migration. Ses journaux confirment « Traitement des images terminé. Les références sont conservées. ». La relecture de l’image et de la fiche de test après ce déploiement a également réussi, avec référence et SHA-256 inchangés. La migration est idempotente et ne purge pas les binaires historiques. Aucune image téléversée n’était référencée dans les contenus existants lors de l’inventaire initial ; les images versionnées du site restent servies par le build. L’import historique vers S3 reste utilisable pour des données reprises ultérieurement.

À la fin de la recette, les fiches fictives ont été retirées, les anciennes et nouvelles URL de leurs images répondent 404, et la liste S3 confirme zéro objet restant. Les bases temporaires de test sont supprimées et le serveur local est arrêté. `/api/health`, `/`, `/clients`, `/connect` et `/sitemap.xml` répondent HTTP 200 sur le domaine `development`.

Aucun déploiement ni configuration de production n’a été effectué. Pour la production, prévoir une instance de bucket isolée et les mêmes références de variables dans l’environnement cible, puis valider les accès avant publication par le propriétaire. Ne pas réutiliser les identifiants de `development` pour la production. La purge historique reste une action séparée, soumise à validation et sauvegarde.

## Fichiers concernés

- API : `apps/api/src/object-storage.ts`, `images.store.ts`, `image-response.ts`, `image-upload.ts`, `migrate-images.ts` ; intégration dans `database.ts`, `main.ts`, `app.ts`, `clients.api.ts`, `clients.store.ts`, `offers.api.ts`, `projects.api.ts` et `import-sqlite.ts`.
- Back-office : `apps/web/app/components/image-input.tsx`, les routes `manage-client.tsx`, `manage-offer.tsx`, `manage-project-image.tsx` et `services/admin.server.ts`.
- Contrat partagé : `libs/content/contracts/src/index.ts` pour la limite de taille.
- Build et dépendances : `package.json`, `package-lock.json`, `tools/build-api.mjs` (inclut la commande de migration dans l’image).
- Tests : `apps/api/src/images-s3.test.ts`, `object-storage.test.ts`, `image-upload.test.ts` et `e2e/management.spec.ts`.
- Documentation : ce guide, `docs/railway.md`, `README.md` et `ARCHITECTURE.md`.

## Coûts indicatifs

Selon la [tarification Railway consultée le 6 novembre 2026](https://docs.railway.com/storage-buckets/billing), le stockage coûte 0,015 USD/Go-mois : environ 0,015 USD pour 1 Go, 0,15 USD pour 10 Go et 1,50 USD pour 100 Go sur un mois complet, hors abonnement et taxes. Railway arrondit la consommation cumulée de stockage au Go-mois supérieur. Les opérations S3 et le trafic sortant du bucket sont gratuits. Le trafic sortant du service applicatif, notamment les PUT et la diffusion via proxy, reste facturé au tarif du service et s’ajoute à ces montants. Le volume réel et le trafic du site n’ont pas été mesurés ; aucun montant total fiable ne peut être déduit sans ces données.
