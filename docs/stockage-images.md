# Stockage des images

## Architecture et compatibilité

Le monorepo conserve React Router 8 / React 19, Hono, Nx et PostgreSQL. Les formulaires existants des clients, des offres et des projets passent par une session administrateur et un jeton CSRF côté web, puis une autorisation serveur côté API. Aucun identifiant S3 ne traverse le navigateur. Les images livrées avec le site dans `apps/web/public/images/` sont des ressources versionnées du build : elles restent en place. Aucun upload n’est conservé sur le disque applicatif.

`Database.images` fournit l’écriture, la lecture et le nettoyage via `ObjectStorage`. Avec `MEDIA_STORAGE=s3`, les nouveaux fichiers sont déposés dans le bucket privé et PostgreSQL ne reçoit que l’UUID, la clé, le type réel, la taille, les dimensions et le SHA-256. Le contenu JSON des fiches conserve ses URL `/api/v1/*-images/<uuid>` ; aucun changement de référence n’est nécessaire. Les anciens binaires PostgreSQL restent lisibles pendant la transition.

Le SDK AWS signe les requêtes côté serveur. Le proxy vérifie en base l’existence de la référence et, pour les clients, la publication de la fiche avant de lire S3. Les brouillons ne sont disponibles que via le chemin administrateur, avec `private, no-store`. Les images publiques ont un ETag SHA-256 et `public, max-age=0, must-revalidate` : le navigateur conserve les octets et peut recevoir une réponse 304, mais chaque réutilisation revalide la publication. Les suppressions et dépublications sont ainsi effectives sans attendre l’expiration d’un cache partagé. Cette stratégie économise le transfert vers le navigateur ; elle relit encore S3 pour calculer l’ETag.

Chaque upload reçoit une clé UUID unique. La validation utilise Sharp pour identifier et décoder réellement JPEG, PNG, WebP ou AVIF ; le nom et le MIME déclarés ne font pas foi. SVG, HEIC, animations, fichiers corrompus et images dépassant 40 millions de pixels sont refusés. La taille par défaut est 5 Mio, configurable jusqu’à 50 Mio. Les limites multipart des deux serveurs ajoutent 1 Mio pour les champs et en-têtes. Le back-office affiche la limite configurée et propose un aperçu local avant enregistrement ; il reste utilisable sans JavaScript.

Les originaux conservent leurs octets, leur résolution et leurs proportions, conformément au comportement photographique existant. Aucun réencodage avec perte ni agrandissement n’est appliqué. Les formats WebP et AVIF permettent de fournir des images déjà optimisées. Le cadrage visuel existant de la vitrine reste inchangé.

## Connexion Railway

La documentation historique du dépôt indique un projet Railway avec un service `EPICC` et un service `Postgres` dans `development` (voir [railway.md](railway.md)). Ces informations ne constituent pas une inspection distante actuelle. Aucun accès Railway ni identifiant S3 n’était disponible lors de cette modification ; aucun bucket n’a été vérifié, créé ou modifié, aucune variable distante n’a été configurée, aucun service, volume ou déploiement distant n’a été touché.

Avec un accès au projet, vérifier d’abord les buckets existants dans l’environnement cible. Réutiliser un bucket réservé à ces médias ; demander l’accord du propriétaire avant toute création payante. Ne pas partager un bucket de production avec les tests. Railway isole les instances de buckets par environnement. Conserver le bucket privé ; aucun réglage CORS n’est nécessaire, les navigateurs ne communiquent pas avec S3.

Configurer uniquement sur le service applicatif, idéalement par références Railway (remplacer `Medias` par le nom réel de la ressource) :

| Variable applicative   | Valeur / référence                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `MEDIA_STORAGE`        | `s3` pour activer les nouveaux uploads S3                                                                                    |
| `S3_ENDPOINT`          | `${{Medias.ENDPOINT}}`, endpoint exact des Credentials ; HTTPS obligatoire en production                                     |
| `S3_BUCKET`            | `${{Medias.BUCKET}}`, nom technique, pas le nom d’affichage                                                                  |
| `S3_REGION`            | `${{Medias.REGION}}`                                                                                                         |
| `S3_ACCESS_KEY_ID`     | `${{Medias.ACCESS_KEY_ID}}`, secret serveur                                                                                  |
| `S3_SECRET_ACCESS_KEY` | `${{Medias.SECRET_ACCESS_KEY}}`, secret serveur                                                                              |
| `S3_FORCE_PATH_STYLE`  | `false` par défaut pour les buckets récents ; `true` seulement si les Credentials indiquent path-style pour un ancien bucket |
| `IMAGE_MAX_BYTES`      | Optionnel : `5242880` par défaut                                                                                             |

Ne pas modifier les fichiers `.env`, ne pas préfixer ces variables par `VITE_` et ne pas les passer au build web. En développement, les injecter dans le processus depuis un gestionnaire de secrets ; un endpoint HTTP est accepté hors production pour un émulateur S3 local. L’absence de `MEDIA_STORAGE` garde le mode historique `database` pour permettre un déploiement progressif. Une configuration `s3` incomplète échoue explicitement au démarrage ; elle ne revient pas silencieusement à la base. Pour utiliser S3 en production, `MEDIA_STORAGE=s3` doit donc bien être configuré.

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

Les tests automatisés couvrent PostgreSQL éphémère, S3 simulé injecté pour les scénarios de panne, ainsi que PUT/GET/DELETE du vrai SDK contre un serveur HTTP de test. Ils vérifient les métadonnées, le rollback, la reprise de nettoyage, la migration réexécutable, la purge vérifiée, les brouillons, l’autorisation, les formats, les tailles et les ETag. Les parcours Playwright existants valident l’intégration des formulaires et de la vitrine avec et sans JavaScript en stockage historique local de test ; ils ne constituent pas une recette d’un bucket Railway.

Avant activation finale sur Railway, il reste à vérifier avec les véritables identifiants : upload puis lecture, remplacement/suppression, copie des images existantes, relecture après redéploiement, absence d’accès public direct au bucket et absence de secrets dans le navigateur. Aucun déploiement en production ne doit être déclenché sans accord du propriétaire.

Résultats locaux du 6 novembre 2026 : `npm run check` réussi (format, lint, TypeScript, tests et build). Les 13 tests ciblés du stockage, de l’adaptateur S3 et de la validation des images passent. La suite navigateur complète a terminé avec 24 succès et un test réussi à la reprise après une erreur de flux ZIP de trace Playwright. Une nouvelle exécution des six parcours de gestion, incluant le contrôle du nouvel aperçu, passe ensuite sans échec : `npx playwright test --project=gestion --no-deps` (2,6 minutes). Les tests utilisent uniquement les bases éphémères autorisées ; aucun accès au stockage Railway réel n’a été testé.

## Fichiers concernés

- API : `apps/api/src/object-storage.ts`, `images.store.ts`, `image-response.ts`, `image-upload.ts`, `migrate-images.ts` ; intégration dans `database.ts`, `main.ts`, `app.ts`, `clients.api.ts`, `clients.store.ts`, `offers.api.ts`, `projects.api.ts` et `import-sqlite.ts`.
- Back-office : `apps/web/app/components/image-input.tsx`, les routes `manage-client.tsx`, `manage-offer.tsx`, `manage-project-image.tsx` et `services/admin.server.ts`.
- Contrat partagé : `libs/content/contracts/src/index.ts` pour la limite de taille.
- Build et dépendances : `package.json`, `package-lock.json`, `tools/build-api.mjs` (inclut la commande de migration dans l’image).
- Tests : `apps/api/src/images-s3.test.ts`, `object-storage.test.ts`, `image-upload.test.ts` et `e2e/management.spec.ts`.
- Documentation : ce guide, `docs/railway.md`, `README.md` et `ARCHITECTURE.md`.

## Coûts indicatifs

Selon la [tarification Railway consultée le 6 novembre 2026](https://docs.railway.com/storage-buckets/billing), le stockage coûte 0,015 USD/Go-mois : environ 0,015 USD pour 1 Go, 0,15 USD pour 10 Go et 1,50 USD pour 100 Go sur un mois complet, hors abonnement et taxes. Railway arrondit la consommation cumulée de stockage au Go-mois supérieur. Les opérations S3 et le trafic sortant du bucket sont gratuits. Le trafic sortant du service applicatif, notamment les PUT et la diffusion via proxy, reste facturé au tarif du service et s’ajoute à ces montants. Le volume réel et le trafic du site n’ont pas été mesurés ; aucun montant total fiable ne peut être déduit sans ces données.
