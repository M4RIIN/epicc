# Servir la vitrine statique sur Railway

Railway peut construire le Dockerfile à la racine du dépôt. L’image finale contient les fichiers statiques et le serveur qui les sert. Le serveur respecte le port `PORT` fourni par Railway et utilise 3100 par défaut.

Renseignez `PUBLIC_SITE_URL` et `CONTACT_EMAIL` comme variables disponibles à la construction pour générer les métadonnées et activer le contact. Les arguments correspondants sont déclarés dans le Dockerfile. Si un contrôle de démarrage utilise l’ancienne API, remplacez son chemin par `/`.

Le build utilise les contenus et médias versionnés. Les éventuelles personnalisations enregistrées uniquement dans l’ancienne gestion doivent être reportées dans ces fichiers pour apparaître sur la vitrine.
