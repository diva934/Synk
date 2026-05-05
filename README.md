# RandomChat — MVP Azar / Chatroulette

Appels vidéo aléatoires anonymes avec WebRTC, Socket.IO, React et Node.js.

---

## Stack

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Style | Tailwind CSS |
| Backend | Node.js + Express |
| Signaling | Socket.IO 4 |
| Vidéo / Audio | WebRTC (RTCPeerConnection) |

---

## Installation et lancement en local

### Prérequis

- Node.js ≥ 18
- npm ≥ 9

### 1. Installer les dépendances

```bash
# Serveur
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Lancer en développement

**Terminal 1 — serveur :**
```bash
cd server
npm run dev
# → http://localhost:3001
```

**Terminal 2 — client :**
```bash
cd client
npm run dev
# → http://localhost:5173
```

### 3. Tester localement

Ouvrez **deux onglets** (ou deux navigateurs différents) sur `http://localhost:5173`.  
Cliquez "Commencer" dans chaque onglet → les deux utilisateurs sont mis en relation automatiquement.

> **Note :** `getUserMedia` exige HTTPS hors `localhost`. En local, tout fonctionne sans HTTPS.  
> En production, vous **devez** servir l'application via HTTPS (voir section Production).

---

## Variables d'environnement

### Serveur (`server/.env`)

```env
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_SOCKET_URL=http://localhost:3001
```

---

## Architecture du signaling WebRTC

```
Navigateur A (initiateur)        Serveur Socket.IO        Navigateur B (receveur)
         |                              |                           |
         |──── join-queue ─────────────>|                           |
         |                              |<──── join-queue ──────────|
         |<── matched (initiator:true) ─|── matched (false) ───────>|
         |                              |                           |
         | createOffer()                |                           |
         |──── offer ──────────────────>|──── offer ───────────────>|
         |                              |           setRemoteDesc() |
         |                              |           createAnswer()  |
         |<──── answer ────────────────-|<──── answer ──────────────|
         | setRemoteDesc()              |                           |
         |                              |                           |
         |<══ ICE candidates ══════════>|<══ ICE candidates ════════|
         |                              |                           |
         |══════════ flux média P2P (direct, sans le serveur) ═════>|
```

### Rôles

- **Initiateur** : le nouvel arrivant dans la file. Il crée l'`offer` SDP.  
- **Receveur** : l'utilisateur déjà en attente. Il répond avec un `answer` SDP.  
- **Serveur** : relais uniquement pour l'échange SDP et ICE. Il ne touche pas aux médias.

### Buffering des candidats ICE

Les candidats ICE peuvent arriver *avant* que `setRemoteDescription()` soit terminé.  
Le composant `VideoRoom` les met en buffer (`iceCandidateBuffer`) et les applique  
juste après chaque `setRemoteDescription()`.

---

## Fonctionnalités

- [x] File d'attente côté serveur + matching aléatoire
- [x] Appel vidéo WebRTC P2P (STUN Google)
- [x] Bouton "Next" + swipe horizontal mobile
- [x] Animation de transition lors du swipe
- [x] Mute micro / caméra on-off
- [x] Compteur d'utilisateurs en ligne (Socket.IO broadcast)
- [x] Chat texte pendant l'appel
- [x] Bouton "Signaler" avec liste de raisons
- [x] Reconnexion automatique si le partenaire part
- [x] Gestion propre des erreurs caméra/micro
- [x] Nettoyage à la déconnexion / fermeture d'onglet

---

## Limitations du MVP

- **TURN absent** : la connexion P2P peut échouer si l'un des utilisateurs est derrière un NAT symétrique (certains réseaux d'entreprise, 4G strict). Ajouter un serveur TURN résout ce problème.
- **Aucune authentification** : n'importe qui peut se connecter. Prévoir JWT ou session pour un vrai produit.
- **Modération locale uniquement** : le bouton "Signaler" affiche une confirmation locale mais n'envoie rien au serveur. À compléter avec une API de modération.
- **Pas de persistance** : aucune base de données. Tout l'état est en mémoire Node.js (redémarrage = remise à zéro).
- **Un seul processus** : pas de Redis pub/sub → pas de scalabilité horizontale.

---

## Notes de production

### HTTPS obligatoire

`getUserMedia` est bloqué par les navigateurs sur HTTP non-localhost.  
Utilisez **nginx + Let's Encrypt** ou un service comme Fly.io / Railway (HTTPS automatique).

### Serveur TURN

```env
# Exemple avec Twilio NTS (payant) ou coturn (self-hosted)
TURN_URL=turn:your-turn.example.com:3478
TURN_USERNAME=xxx
TURN_CREDENTIAL=yyy
```

Ajoutez l'objet dans `ICE_SERVERS` dans `VideoRoom.tsx` :

```ts
{ urls: "turn:your-turn.example.com:3478", username: "xxx", credential: "yyy" }
```

### Scalabilité

Pour plusieurs instances Node.js, remplacez la Map en mémoire par Redis  
et utilisez `@socket.io/redis-adapter`.

---

## Ressources

- [WebRTC samples](https://webrtc.github.io/samples/)
- [Perfect negotiation pattern](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [Socket.IO docs](https://socket.io/docs/v4/)
- [coturn (serveur TURN open-source)](https://github.com/coturn/coturn)
