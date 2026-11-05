# Hébergement Railway

Le Dockerfile à la racine construit la vitrine et l’API avec Node 22.23.4. L’image finale contient les dépendances de production et `dist/` ; elle démarre sans privilèges avec `node dist/apps/api/main.mjs`. Les fichiers `.env` sont exclus du contexte de construction. Aucun secret n’est nécessaire au build.

## Configuration du service

Dans le projet Railway choisi, préparer un service PostgreSQL et un service applicatif relié à ce dépôt. Conserver la racine du dépôt comme répertoire du service : les deux applications et les bibliothèques sont nécessaires au build. Railway [détecte le Dockerfile](https://docs.railway.com/builds/dockerfiles). Ne pas définir de commande de build ou de démarrage qui remplacerait celles de l’image.

Configurer les variables du service applicatif dans Railway :

| Variable          | Configuration                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Référence à la variable `DATABASE_URL` du service PostgreSQL, par exemple `${{Postgres.DATABASE_URL}}` si ce service s’appelle `Postgres`.               |
| `PUBLIC_SITE_URL` | Origine HTTPS exacte du domaine public retenu, sans chemin. Elle doit correspondre au domaine utilisé pour accéder à la gestion.                         |
| `SESSION_SECRET`  | Secret aléatoire stable d’au moins 32 caractères, généré dans un gestionnaire de secrets.                                                                |
| `ADMIN_EMAIL`     | Adresse du propriétaire du compte administrateur initial.                                                                                                |
| `ADMIN_PASSWORD`  | Mot de passe initial unique d’au moins huit caractères, conservé dans un gestionnaire de mots de passe. Retirer cette variable après création du compte. |
| `CONTACT_EMAIL`   | Adresse de contact publique validée avant publication. Une valeur vide désactive le formulaire.                                                          |

Railway fournit `PORT` ; le serveur l’utilise et écoute sur `0.0.0.0`. Ne pas définir `INTERNAL_API_ORIGIN` : le rendu serveur appelle l’API sur le port local du même processus. `NODE_ENV=production` est défini dans l’image.

Les [références de variables Railway](https://docs.railway.com/variables) évitent de recopier les identifiants PostgreSQL. Ne pas importer un `.env` local ni utiliser une base de test pour cet hébergement.

Configurer le [contrôle de démarrage](https://docs.railway.com/deployments/healthchecks) sur `/api/health`, avec un délai de 120 secondes. Le serveur initialise les tables avant d’écouter ; ce contrôle confirme ensuite le fonctionnement HTTP, sans surveiller en continu la base. Aucun script de migration supplémentaire ni volume applicatif n’est nécessaire : les fiches, les images et les comptes sont stockés dans PostgreSQL.

Les sauvegardes manuelles et planifiées de volumes nécessitent une offre Railway Pro. Un volume persistant conserve les données entre redémarrages, mais ne remplace pas une sauvegarde. Si l’offre ne permet pas les sauvegardes Railway, prévoir un export PostgreSQL régulier vers un stockage distinct avant d’y confier des données importantes.

## Vérifications avant et après publication

Avant publication, confirmer le projet, l’environnement, le domaine, les variables et la base cible. Une base neuve reçoit automatiquement des fiches fictives : remplacer ou dépublier les exemples avant une ouverture commerciale.

Une fois la publication déclenchée par le propriétaire :

1. Vérifier les journaux de build et de démarrage sans partager leurs secrets.
2. Vérifier que `/api/health`, `/` et `/clients` répondent correctement sur le domaine HTTPS.
3. Se connecter sur `/connect` avec le compte initial ; vérifier l’enregistrement d’une modification et sa persistance après redémarrage.
4. Vérifier les liens canoniques, le sitemap et l’adresse du formulaire de contact.

## Vérification locale de l’image

Sur une machine disposant de Docker :

```sh
docker build -t epicc .
```

Pour exécuter l’image, fournir les variables depuis un gestionnaire de secrets ou un fichier local non versionné via `docker run --env-file`, et publier le port 3100. La base PostgreSQL doit être accessible depuis le conteneur. Ne jamais intégrer les secrets à l’image.

## Environnement development

L’hébergement préparé le 5 novembre 2026 utilise uniquement l’environnement `development` du [projet Railway](https://railway.com/project/ed8fc074-7306-4773-b03c-fd468da68e68), avec les ressources suivantes :

| Ressource             | Configuration                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Application           | Service `EPICC`, identifiant `18ea4b9e-e7eb-41c5-b15e-d83f26cc15f6`, Dockerfile à la racine.                         |
| Domaine               | <https://epicc-development.up.railway.app>                                                                           |
| Base                  | Service `Postgres`, identifiant `64953ca0-24fe-4021-931b-78c8422c22e2`, volume monté sur `/var/lib/postgresql/data`. |
| Contrôle de démarrage | `/api/health`, délai de 120 secondes.                                                                                |
| Contact               | Désactivé par `CONTACT_EMAIL` vide, en attente d’une adresse publique validée.                                       |
| Sauvegardes           | Non activées : Railway a refusé la configuration car l’espace ne dispose pas d’une offre Pro.                        |

Le code applicatif du commit `1a7055a` a été envoyé par CLI. Les mises à jour peuvent être envoyées depuis la racine du dépôt avec un jeton du projet injecté dans `RAILWAY_TOKEN` :

```sh
railway up --project ed8fc074-7306-4773-b03c-fd468da68e68 \
  --environment development \
  --service 18ea4b9e-e7eb-41c5-b15e-d83f26cc15f6 --detach
```

Attendre ensuite le statut `SUCCESS` et vérifier le domaine public : la commande détachée revient avant la fin du déploiement. Les mises à jour automatiques depuis GitHub ne sont pas configurées. Ne pas injecter simultanément `RAILWAY_API_TOKEN`.

### Recette du déploiement

Le build Docker distant et le contrôle de démarrage ont réussi. Le déploiement `278c2309-f039-4d41-a25e-795c6dcdc684` a été validé sur le domaine public : réponses HTTP 200 sur `/`, `/clients`, `/api/health`, `/connect` et `/sitemap.xml`, URLs canoniques HTTPS et connexion administrateur fonctionnelle.

Une fiche fictive non publiée a été créée et modifiée depuis la gestion. La modification a été relue après redémarrage effectif de PostgreSQL et de l’application, puis la fiche a été supprimée. Les parcours de connexion, de création, de modification et de suppression ont été vérifiés avec et sans JavaScript. Le compte administrateur reste utilisable après retrait d’`ADMIN_PASSWORD` des variables Railway et redéploiement. Le secret de session reste stable ; les identifiants ne figurent pas dans le dépôt.
