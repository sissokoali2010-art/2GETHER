/* =====================================================
   2GETHER V1
   Connexion à deux avec PeerJS
===================================================== */


/* =========================
   VARIABLES
========================= */

let peer = null;
let connection = null;

let isHost = false;

let myName = "";
let partnerName = "";

let gameState = {
    points: 0,
    streak: 1,
    level: 1
};

let currentGame = null;


/* =========================
   ELEMENTS
========================= */

const welcomeScreen =
    document.getElementById("welcomeScreen");

const connectionScreen =
    document.getElementById("connectionScreen");

const dashboardScreen =
    document.getElementById("dashboardScreen");

const usernameInput =
    document.getElementById("usernameInput");

const continueBtn =
    document.getElementById("continueBtn");

const createBtn =
    document.getElementById("createBtn");

const joinBtn =
    document.getElementById("joinBtn");

const createArea =
    document.getElementById("createArea");

const joinArea =
    document.getElementById("joinArea");

const roomCode =
    document.getElementById("roomCode");

const copyBtn =
    document.getElementById("copyBtn");

const codeInput =
    document.getElementById("codeInput");

const connectBtn =
    document.getElementById("connectBtn");

const connectionStatus =
    document.getElementById("connectionStatus");

const myNameElement =
    document.getElementById("myName");

const partnerNameElement =
    document.getElementById("partnerName");

const pointsElement =
    document.getElementById("points");

const streakElement =
    document.getElementById("streak");

const levelElement =
    document.getElementById("level");

const levelText =
    document.getElementById("levelText");

const levelPoints =
    document.getElementById("levelPoints");

const progress =
    document.getElementById("progress");

const activityFeed =
    document.getElementById("activityFeed");

const gameModal =
    document.getElementById("gameModal");

const gameIcon =
    document.getElementById("gameIcon");

const gameTitle =
    document.getElementById("gameTitle");

const gameDescription =
    document.getElementById("gameDescription");

const completeGameBtn =
    document.getElementById("completeGameBtn");

const closeModal =
    document.getElementById("closeModal");

const toast =
    document.getElementById("toast");

const disconnectBtn =
    document.getElementById("disconnectBtn");


/* =========================
   ÉCRAN
========================= */

function showScreen(screen) {

    document.querySelectorAll(".screen")
        .forEach(s => s.classList.remove("active"));

    screen.classList.add("active");
}


/* =========================
   PROFIL
========================= */

continueBtn.addEventListener("click", () => {

    const name = usernameInput.value.trim();

    if (!name) {
        showToast("Entre ton pseudo 👤");
        return;
    }

    myName = name;

    localStorage.setItem(
        "2gether_name",
        myName
    );

    showScreen(connectionScreen);
});


/* =========================
   CHARGER PROFIL
========================= */

const savedName =
    localStorage.getItem("2gether_name");

if (savedName) {

    myName = savedName;

    usernameInput.value = savedName;
}


/* =========================
   CRÉER UNE PARTIE
========================= */

createBtn.addEventListener("click", () => {

    if (!myName) {
        showToast("Choisis d'abord ton pseudo.");
        return;
    }

    isHost = true;

    createArea.classList.remove("hidden");
    joinArea.classList.add("hidden");

    connectionStatus.textContent =
        "Création de ta partie...";

    createPeer();
});


/* =========================
   CRÉER PEER
========================= */

function createPeer() {

    /*
       PeerJS génère un identifiant unique.
       Nous le transformons en code court.
    */

    peer = new Peer();

    peer.on("open", id => {

        const shortCode =
            id.substring(0, 6).toUpperCase();

        roomCode.textContent =
            shortCode;

        connectionStatus.textContent =
            "En attente de ton partenaire ❤️";

        /*
           On sauvegarde l'identifiant complet
           pour retrouver la connexion.
        */

        localStorage.setItem(
            "2gether_peer_id",
            id
        );

        localStorage.setItem(
            "2gether_room_code",
            shortCode
        );

    });


    peer.on("connection", conn => {

        connection = conn;

        setupConnection();

    });


    peer.on("error", error => {

        console.log(error);

        connectionStatus.textContent =
            "Erreur de connexion ❌";

    });

}


/* =========================
   REJOINDRE
========================= */

joinBtn.addEventListener("click", () => {

    createArea.classList.add("hidden");

    joinArea.classList.remove("hidden");

    connectionStatus.textContent = "";

    codeInput.focus();

});


/* =========================
   CONNEXION
========================= */

connectBtn.addEventListener("click", () => {

    const code =
        codeInput.value.trim().toUpperCase();

    if (code.length < 4) {

        showToast("Entre un code valide.");

        return;
    }

    connectionStatus.textContent =
        "Connexion en cours...";

    /*
       Important :
       Le code affiché correspond aux 6 premiers
       caractères du Peer ID.

       On doit retrouver le Peer ID complet.
       Pour une V1 simple, nous utilisons le code
       comme identifiant Peer.
    */

    connection = peerConnect(code);

});


/* =========================
   CONNEXION PEER
========================= */

function peerConnect(code) {

    /*
       PeerJS nécessite l'ID exact.

       Comme le Peer ID réel est plus long,
       cette V1 utilise un ID déterministe
       créé à partir du code.

       La fonction ci-dessous tente d'abord
       le code directement.
    */

    if (!peer) {

        peer = new Peer();

        peer.on("open", () => {

            connectToPeer(code);

        });

        return null;
    }

    return connectToPeer(code);
}


function connectToPeer(code) {

    const conn =
        peer.connect(code);

    conn.on("open", () => {

        connection = conn;

        setupConnection();

        sendData({
            type: "profile",
            name: myName
        });

    });

    conn.on("error", () => {

        connectionStatus.textContent =
            "Impossible de trouver cette partie ❌";

    });

    return conn;
}


/* =========================
   CONNEXION SETUP
========================= */

function setupConnection() {

    if (!connection) return;

    connection.on("open", () => {

        connectionStatus.textContent =
            "Connexion réussie ❤️";

        sendData({
            type: "profile",
            name: myName
        });

    });


    connection.on("data", data => {

        handleData(data);

    });


    connection.on("close", () => {

        showToast(
            "Ton partenaire s'est déconnecté."
        );

        document.getElementById(
            "onlineStatus"
        ).textContent =
            "● Partenaire déconnecté";

    });

}


/* =========================
   ENVOYER DONNÉES
========================= */

function sendData(data) {

    if (
        connection &&
        connection.open
    ) {

        connection.send(data);

    }

}


/* =========================
   RECEVOIR DONNÉES
========================= */

function handleData(data) {

    if (!data || !data.type) return;


    /* PROFILE */

    if (data.type === "profile") {

        partnerName =
            data.name;

        partnerNameElement.textContent =
            partnerName;

        /*
           Si nous sommes l'hôte,
           nous envoyons notre état.
        */

        if (isHost) {

            sendData({
                type: "state",
                state: gameState
            });

        }

        openDashboard();

    }


    /* STATE */

    if (data.type === "state") {

        gameState =
            data.state;

        updateStats();

    }


    /* POINTS */

    if (data.type === "points") {

        gameState.points =
            data.points;

        gameState.level =
            data.level;

        updateStats();

        addFeed(
            "❤️ " +
            (partnerName || "Ton partenaire") +
            " a gagné " +
            data.amount +
            " points !"
        );

    }


    /* ACTIVITY */

    if (data.type === "activity") {

        addFeed(
            data.message
        );

    }


    /* GAME */

    if (data.type === "game") {

        openGameFromPartner(
            data.game
        );

    }

}


/* =========================
   OUVRIR DASHBOARD
========================= */

function openDashboard() {

    myNameElement.textContent =
        myName;

    partnerNameElement.textContent =
        partnerName || "Partenaire";

    showScreen(
        dashboardScreen
    );

    updateStats();

    addFeed(
        "❤️ Vous êtes maintenant 2GETHER !"
    );

}


/* =========================
   STATS
========================= */

function updateStats() {

    pointsElement.textContent =
        gameState.points;

    streakElement.textContent =
        gameState.streak;

    levelElement.textContent =
        gameState.level;

    levelText.textContent =
        gameState.level;

    const current =
        gameState.points % 100;

    levelPoints.textContent =
        current;

    progress.style.width =
        current + "%";

}


/* =========================
   ACTIVITÉS
========================= */

document.querySelectorAll(".activity")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const game =
                    button.dataset.game;

                openGame(game);

                sendData({
                    type: "game",
                    game: game
                });

            }
        );

    });


/* =========================
   OUVRIR JEU
========================= */

function openGame(game) {

    currentGame = game;

    if (game === "quiz") {

        gameIcon.textContent =
            "🧠";

        gameTitle.textContent =
            "Qui connaît mieux l'autre ?";

        gameDescription.textContent =
            "Répondez chacun à une question et découvrez si vous vous connaissez vraiment.";

    }


    if (game === "challenge") {

        gameIcon.textContent =
            "⚡";

        gameTitle.textContent =
            "Défi rapide";

        gameDescription.textContent =
            "Faites un petit défi ensemble. Quand c'est terminé, validez pour gagner des points.";

    }


    if (game === "question") {

        gameIcon.textContent =
            "💬";

        gameTitle.textContent =
            "Question à deux";

        gameDescription.textContent =
            "Une question pour mieux découvrir votre partenaire.";

    }


    gameModal.classList.remove(
        "hidden"
    );

}


/* =========================
   JEU ENVOYÉ PAR PARTENAIRE
========================= */

function openGameFromPartner(game) {

    openGame(game);

    showToast(
        "❤️ Ton partenaire lance une activité !"
    );

}


/* =========================
   TERMINER JEU
========================= */

completeGameBtn.addEventListener(
    "click",
    () => {

        const amount = 20;

        gameState.points += amount;

        /*
           Niveau automatique
        */

        gameState.level =
            Math.floor(
                gameState.points / 100
            ) + 1;

        updateStats();

        addFeed(
            "⭐ " +
            myName +
            " a terminé une activité !"
        );

        sendData({
            type: "points",
            amount: amount,
            points: gameState.points,
            level: gameState.level
        });

        sendData({
            type: "activity",
            message:
                "⭐ " +
                myName +
                " a terminé une activité !"
        });

        closeGame();

        showToast(
            "+20 points ❤️"
        );

    }
);


/* =========================
   FERMER JEU
========================= */

closeModal.addEventListener(
    "click",
    closeGame
);


function closeGame() {

    gameModal.classList.add(
        "hidden"
    );

    currentGame = null;

}


/* =========================
   FEED
========================= */

function addFeed(message) {

    const item =
        document.createElement("div");

    item.className =
        "feedItem";

    item.textContent =
        message;

    activityFeed.prepend(item);

}


/* =========================
   COPIER CODE
========================= */

copyBtn.addEventListener(
    "click",
    async () => {

        const code =
            roomCode.textContent;

        try {

            await navigator.clipboard.writeText(
                code
            );

            showToast(
                "Code copié 📋"
            );

        } catch {

            showToast(
                "Code : " + code
            );

        }

    }
);


/* =========================
   TOAST
========================= */

function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2500);

}


/* =========================
   DÉCONNEXION
========================= */

disconnectBtn.addEventListener(
    "click",
    () => {

        if (connection) {

            connection.close();

        }

        if (peer) {

            peer.destroy();

        }

        connection = null;
        peer = null;

        showScreen(
            connectionScreen
        );

        createArea.classList.add(
            "hidden"
        );

        joinArea.classList.add(
            "hidden"
        );

        connectionStatus.textContent =
            "";

        showToast(
            "Partie quittée."
        );

    }
);