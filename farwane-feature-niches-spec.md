# Feature FarWane : "Niches" (thèmes perso / private jokes)

## 1. Résumé du besoin

Aujourd'hui, une manche de FarWane = un template (image/meme/vidéo) + une légende à inventer dessus.
On veut ajouter un **modificateur "Niche"** : le template (image/meme/vidéo) reste **toujours présent**, rien ne le remplace. En plus de ce template, le round affiche un **thème texte** défini par les joueurs eux-mêmes (référence de groupe, private joke, running gag interne), et la légende doit avoir un lien avec ce thème tout en légendant le template affiché.

Exemples de "niche" :
- "Quand Kevin arrive en retard pour la 5e fois"
- "La fois où on a cru que Sarah avait un accent belge"
- "Réunion Zoom où personne ne veut allumer sa caméra"

## 2. Vocabulaire

- **Niche** : une chaîne de texte courte (thème/private joke) créée par un joueur.
- **Pool de niches** : la liste de niches disponibles pour une partie donnée.
- **Bibliothèque perso** : la liste de niches sauvegardées dans le navigateur d'un joueur, réutilisable d'une partie à l'autre.
- **Round "niche"** : un round classique (template image/meme/vidéo, pioché exactement comme aujourd'hui) auquel on associe *en plus* une niche piochée dans le pool. Le template n'est jamais remplacé par la niche — les deux sont toujours affichés ensemble.

## 3. Où ça vit dans le produit

### A. Page d'accueil — "Ma bibliothèque de niches"
- Section (accordéon ou onglet) où l'utilisateur peut :
  - Ajouter une niche (texte libre, ~80 caractères max)
  - Voir / éditer / supprimer ses niches existantes
  - Optionnel : les regrouper en "packs perso" (ex: "Soirée du 14/08", "Private jokes taff")
- Cette bibliothèque est **personnelle au navigateur** (pas de compte), donc stockée en `localStorage`, indépendamment de toute partie en cours.

### B. Lobby (avant de lancer la partie)
- Un panneau "Niches pour cette partie" visible par tous les joueurs du salon.
- Le host (ou n'importe quel joueur, selon vos règles de permission actuelles) peut :
  - Piocher dans sa bibliothèque perso et les ajouter au **pool de la partie**
  - Ou taper une niche à la volée directement pour cette partie
- Toute niche ajoutée en lobby doit se synchroniser en temps réel à tous les joueurs connectés (comme le reste de l'état du lobby aujourd'hui — même mécanisme websocket/socket.io que pour le choix de packs d'images).
- Checkbox "Sauvegarder ces niches dans ma bibliothèque" → si cochée, la niche tapée en live est aussi ajoutée au localStorage du joueur qui l'a créée (pas juste au pool de la partie).

### C. Sélection du mode de round
- Ajouter une option dans la config de partie (à côté du choix des packs d'images) : **"Ajouter des niches aux rounds"**, avec un curseur/ratio ou un simple toggle (ex: ~1 round sur 3 aura une niche en plus du template, ou bien "sur tous les rounds" si le pool est assez fourni).
- Important : ce toggle ne change jamais la façon dont le template (image/meme/vidéo) est choisi. Il ajoute simplement une niche piochée en parallèle, affichée à côté du template pendant ce round.
- **Le tirage est aléatoire, pas un pattern fixe.** Ce n'est pas "round 3, 6, 9...", mais un tirage au sort à chaque round (probabilité = ratio configuré) pour décider si CE round aura une niche en plus. Les joueurs ne doivent pas pouvoir deviner à l'avance quels rounds seront concernés.

## 4. Modèle de données

### Côté client (localStorage) — bibliothèque perso
```json
{
  "farwane_niches_v1": [
    { "id": "n_ab12cd", "text": "Quand Kevin arrive en retard", "createdAt": 1735000000 },
    { "id": "n_ef34gh", "text": "La réunion Zoom caméra éteinte", "createdAt": 1735000500 }
  ]
}
```
- Clé versionnée (`_v1`) pour pouvoir migrer le format plus tard sans tout casser.
- `id` généré côté client (uuid court suffit, pas besoin de collision-proof strict).

### Côté serveur (état de la partie / pool de la manche)
Ajouter au state existant du lobby/room, à côté de la liste des packs d'images sélectionnés :
```json
{
  "roomId": "abcd1234",
  "nichePool": [
    { "id": "n_ab12cd", "text": "Quand Kevin arrive en retard", "addedBy": "playerId_123" }
  ],
  "roundConfig": {
    "nicheRoundRatio": 0.33
  }
}
```
- Le pool de la partie est **éphémère**, il vit avec la room et disparaît à la fin (contrairement à la bibliothèque perso qui persiste).

## 5. Déroulé d'un round "Niche"

1. Le serveur pioche un template (image/meme/vidéo) exactement comme aujourd'hui — aucun changement à cette logique.
2. Le serveur tire au sort (selon le ratio configuré) si CE round aura une niche en plus — ce tirage se fait round par round, pas selon un pattern fixe ou prévisible. Si le tirage est positif, le serveur pioche **en plus** une niche non encore utilisée dans `nichePool`.
3. Tous les joueurs voient le template **et** le texte de la niche affichés ensemble (ex: niche au-dessus ou à côté du template).
4. Timer identique au round classique. Les joueurs écrivent une légende sur le template, en lien avec la niche affichée (aucune validation automatique du "lien" n'est faite côté serveur, c'est purement déclaratif/incitatif pour les joueurs).
5. Phase de vote anonyme identique à l'existant.
6. Marquer la niche comme "utilisée" pour éviter les répétitions dans la même partie.

## 6. Garde-fous / cas limites

- Pool vide au lancement de la partie → désactiver automatiquement le mode "Niche" pour cette manche (fallback silencieux sur templates image), avec un message clair dans le lobby ("Ajoutez au moins 1 niche pour activer ce mode").
- Limiter la longueur d'une niche (ex: 100 caractères) pour l'affichage.
- Dédupliquer les niches identiques dans le pool d'une même partie.
- Pas de modération de contenu poussée à prévoir dans un premier temps (jeu entre amis / salon privé), mais prévoir un filtre basique anti-vide/anti-spam (chaîne non vide, pas que des espaces).

## 7. Composants UI à ajouter (à adapter aux conventions du projet)

- `NicheLibraryPanel` (page d'accueil) : liste + formulaire d'ajout + édition/suppression.
- `NichePoolLobby` (lobby) : liste partagée temps réel + bouton "ajouter depuis ma bibliothèque" + input rapide.
- `NicheRoundPrompt` (écran de jeu) : bandeau/encart affiché **en complément** du composant existant de rendu du template (image/meme/vidéo), visible quand le round a une niche associée. Ne remplace rien, s'ajoute à l'écran de jeu actuel.
- Hook/util `useNicheLibrary()` : wrapper autour de localStorage (get/add/edit/delete), à réutiliser entre la home et le lobby.

## 8. Découpage suggéré (ordre d'implémentation)

1. `useNicheLibrary` + persistance localStorage (aucune dépendance serveur, testable seul).
2. UI page d'accueil (bibliothèque perso).
3. Sync serveur du pool de partie (event socket "niche:add", "niche:remove") + UI lobby.
4. Logique de pioche dans le moteur de round existant (type "niche" vs type "image").
5. Toggle/ratio de config de partie pour activer le mode.

