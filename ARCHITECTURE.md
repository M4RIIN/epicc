# Architecture

## Choix du socle

Nx orchestre deux applications TypeScript et quatre bibliothèques. React Router 8 en mode framework assure le routage React, le chargement serveur des données, le SSR et l’hydratation. Hono porte les routes HTTP de l’API et, en production, le serveur commun. Vite construit le client et le serveur React ; esbuild assemble l’application Hono.

En développement, le proxy Vite préserve la même origine pour le navigateur. En production, Hono reçoit toutes les requêtes. Ce choix permet de conserver `/`, `/connect` et `/api` sous un même domaine sans imposer de fournisseur d’hébergement.

Le SSR est activé explicitement. Le contenu de l’accueil est chargé à chaque requête HTML : ce n’est ni une coquille vide remplie en JavaScript, ni une page uniquement pré-générée. Les métadonnées sont construites avec ce contenu. React Router enlève les modules `.server.ts` et les loaders du bundle client.

## Sens des dépendances

```text
web ────────────────────────────────────> contracts
  │ HTTP, depuis le loader serveur
  ▼
api (assemblage et contrôleurs) ─────────> contracts
  ├──> application ──> domain
  └──> infrastructure ──> application, domain
```

- **Domaine** : `Page` garantit les invariants de création et reste immuable. Aucune dépendance vers un framework, un transport ou un stockage.
- **Application** : `GetPublishedPage` exprime la lecture d’une page publiable. Il utilise le port minimal `PageRepository`, qui appartient à cette couche. Il masque les pages non publiées.
- **Infrastructure** : `InMemoryPageRepository` implémente le port. Il ne décide pas des règles de publication.
- **Contrats** : DTO HTTP public validé par Zod, sans dépendance vers les entités. Il n’expose pas les propriétés internes.
- **API** : le contrôleur adapte les paramètres HTTP, appelle le cas d’usage et traduit les résultats ou erreurs. `composition-root.ts` est le seul endroit qui choisit le dépôt concret et le contenu initial.
- **Web** : les routes sont des adaptateurs de présentation ; leur loader serveur lit et valide le contrat HTTP. Le front n’importe ni l’infrastructure ni les entités métier du serveur.

Les tags `layer:*` et la règle `@nx/enforce-module-boundaries` interdisent les dépendances inversées, les imports directs entre applications et les cycles. Les couches intérieures n’acceptent aucune dépendance npm dans leur code de production ; les fichiers de test peuvent importer Vitest. Les alias `@epicc/content-*` ciblent exclusivement les points d’entrée publics `src/index.ts`.

## Principes de conception

- **Responsabilité unique** : invariants dans l’entité, orchestration dans le cas d’usage, transport dans le contrôleur et assemblage à part.
- **Ouvert/fermé et substitution** : un dépôt SQL doit pouvoir remplacer le dépôt en mémoire en respectant le même comportement `Page | null`, sans changer le cas d’usage.
- **Ségrégation des interfaces** : le port de lecture ne contient qu’une méthode. Une future écriture ajoutera un port adapté à ses besoins.
- **Inversion des dépendances** : l’application définit son port, l’infrastructure l’implémente ; les dépendances concrètes sont injectées au constructeur.
- **Lisibilité** : noms métier, fonctions courtes, types stricts, exports explicites, validations aux frontières et erreurs intentionnelles. Pas de conteneur d’injection ni de classe générique tant qu’ils ne résolvent pas un besoin concret.

### Gestion des clients

Les clients disposent d’un contrat Zod partagé (`clientSchema`). Leur module API est distinct des pages : `clients.api.ts` assure le transport et l’autorisation, `clients.store.ts` encapsule le dépôt SQLite, ses transactions et sa migration initiale, et `clients.seed.ts` fournit les exemples fictifs. Le point d’assemblage choisit et injecte le dépôt. Ce module reste local à l’API ; le front ne l’importe jamais. Les bibliothèques historiques `content` conservent leur rôle pour les pages éditoriales.

Les loaders et actions React Router utilisent `clients.server.ts` pour communiquer avec l’API. Les actions exigent une session administrateur valide et un jeton CSRF. L’API privée exige indépendamment un jeton dérivé du secret serveur. Les fichiers `.server.ts` et leurs secrets sont exclus du bundle navigateur. La durée des sessions est contrôlée côté serveur, les tentatives de connexion sont limitées et la taille des formulaires est bornée.

Les fiches et leurs images sont enregistrées dans une même transaction SQLite, sur un volume persistant. Le dépôt filtre les brouillons avant toute lecture publique. Les images orphelines sont supprimées et les images de brouillons ne sont accessibles que par un relais administrateur authentifié. Le HTML public, les métadonnées, la navigation entre fiches, les univers et le sitemap sont dérivés des fiches publiées lors de chaque requête SSR.

## Ajouter une fonctionnalité

1. Décrire la règle métier dans le domaine et tester ses invariants.
2. Écrire le cas d’usage dans `application`, en définissant les ports nécessaires à cet endroit.
3. Ajouter les adaptateurs sortants et leurs tests de contrat.
4. Injecter les adaptateurs dans le point d’assemblage de l’API.
5. Exposer un contrôleur Hono et un contrat public, puis brancher le loader ou l’action React Router.
6. Tester les refus d’accès, les erreurs et le parcours navigateur, puis exécuter `npm run check` et `npm run test:e2e`.

Pour une nouvelle capacité métier indépendante, créer un autre groupe de bibliothèques plutôt que transformer `content` en dossier partagé universel. Ajouter ses projets au graphe et étendre les contraintes Nx.

## Vérification

Vitest teste les invariants, les cas d’usage, le dépôt, le contrat public, les réponses HTTP et la traduction des erreurs côté SSR. Playwright teste le serveur de production complet : contenu sans JavaScript, métadonnées, hydratation, navigation vers `/connect`, ressources CSS, réponses 404, SEO et affichage mobile. La CI vérifie aussi le formatage, le lint et tous les projets TypeScript.

Documentation de référence : [SSR React Router](https://reactrouter.com/start/framework/rendering), [Node.js avec Hono](https://hono.dev/docs/getting-started/nodejs), [frontières de modules Nx](https://nx.dev/docs/features/enforce-module-boundaries).
