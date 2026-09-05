// ==========================================
// 2GETHER ❤️
// ==========================================

let myName = "";
let partnerName = "Partenaire";
let currentRoomCode = "";
let isHost = false;

let points = 0;
let streak = 1;
let level = 1;


// ==========================================
// ELEMENTS
// ==========================================

const welcomeScreen = document.getElementById("welcomeScreen");
const connectionScreen = document.getElementById("connectionScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

const usernameInput = document.getElementById("usernameInput");
const continueBtn = document.getElementById("continueBtn");

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");

const createArea = document.getElementById("createArea");
const joinArea = document.getElementById("joinArea");

const roomCode = document.getElementById("roomCode");
const copyBtn = document.getElementById("copyBtn");

const codeInput = document.getElementById("codeInput");
const connectBtn = document.getElementById("connectBtn");

const connectionStatus = document.getElementById("connectionStatus");

const disconnectBtn = document.getElementById("disconnectBtn");

const gameModal = document.getElementById("gameModal");
const closeModal = document.getElementById("closeModal");

const gameIcon = document.getElementById("gameIcon");
const gameTitle = document.getElementById("gameTitle");
const gameDescription = document.getElementById("gameDescription");
const completeGameBtn = document.getElementById("completeGameBtn");

const toast = document.getElementById("toast");


// ==========================================
// AFFICHER UNE NOTIFICATION
// ==========================================

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}


// ==========================================
// AFFICHER UN ECRAN
// ==========================================

function showScreen(screen) {

    welcomeScreen.style.display = "none";
    connectionScreen.style.display = "none";
    dashboardScreen.style.display = "none";

    screen.style.display = "block";
}


// ==========================================
// GENERER UN CODE
// ==========================================

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        const random =
            Math.floor(Math.random() * characters.length);

        code += characters[random];
    }

    return code;
}


// ==========================================
// CONTINUER
// ==========================================

continueBtn.addEventListener("click", function () {

    const name = usernameInput.value.trim();

    if (name === "") {

        showToast("Entre ton pseudo ❤️");

        usernameInput.focus();

        return;
    }

    myName = name;

    localStorage.setItem(
        "2gether_name",
        myName
    );

    showScreen(connectionScreen);

    connectionStatus.textContent = "";

    showToast(
        "Bienvenue " + myName + " ❤️"
    );
});


// ==========================================
// PSEUDO SAUVEGARDE
// ==========================================

const savedName =
    localStorage.getItem("2gether_name");

if (savedName) {

    myName = savedName;

    usernameInput.value = savedName;
}


// ==========================================
// CREER UNE PARTIE
// ==========================================

createBtn.addEventListener("click", function () {

    createArea.classList.remove("hidden");
    joinArea.classList.add("hidden");

    createParty();
});


async function createParty() {

    if (myName === "") {

        showToast("Entre ton pseudo d'abord.");

        return;
    }

    const code = generateRoomCode();

    currentRoomCode = code;
    isHost = true;

    roomCode.textContent = code;

    connectionStatus.textContent =
        "Création de la partie...";

    try {

        const result =
            await supabaseClient
                .from("couples")
                .insert([
                    {
                        code: code,
                        player1: myName,
                        player2: null
                    }
                ]);

        if (result.error) {

            console.error(
                "ERREUR SUPABASE :",
                result.error
            );

            connectionStatus.textContent =
                "Erreur : " +
                result.error.message;

            showToast(
                result.error.message
            );

            return;
        }

        localStorage.setItem(
            "2gether_room",
            code
        );

        connectionStatus.textContent =
            "En attente de ton partenaire...";

        showToast(
            "Partie créée ❤️"
        );

        startCheckingPartner();

    } catch (error) {

        console.error(error);

        connectionStatus.textContent =
            "Erreur : " +
            error.message;

        showToast(
            error.message
        );
    }
}


// ==========================================
// REJOINDRE UNE PARTIE
// ==========================================

joinBtn.addEventListener("click", function () {

    joinArea.classList.remove("hidden");
    createArea.classList.add("hidden");

    connectionStatus.textContent = "";

    codeInput.focus();
});


connectBtn.addEventListener("click", function () {

    joinParty();
});


codeInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        joinParty();
    }
});


async function joinParty() {

    const code =
        codeInput.value.trim().toUpperCase();

    if (myName === "") {

        showToast(
            "Entre ton pseudo d'abord."
        );

        return;
    }

    if (code.length !== 6) {

        showToast(
            "Le code doit contenir 6 caractères."
        );

        return;
    }

    connectionStatus.textContent =
        "Recherche de la partie...";

    try {

        const result =
            await supabaseClient
                .from("couples")
                .select("*")
                .eq("code", code)
                .maybeSingle();

        if (result.error) {

            console.error(
                "ERREUR SUPABASE :",
                result.error
            );

            connectionStatus.textContent =
                "Erreur : " +
                result.error.message;

            showToast(
                result.error.message
            );

            return;
        }

        const party = result.data;

        if (!party) {

            connectionStatus.textContent =
                "Partie introuvable ❌";

            showToast(
                "Code incorrect."
            );

            return;
        }

        if (party.player2) {

            connectionStatus.textContent =
                "Cette partie est complète ❌";

            showToast(
                "Cette partie est déjà complète."
            );

            return;
        }

        const updateResult =
            await supabaseClient
                .from("couples")
                .update({
                    player2: myName
                })
                .eq("code", code);

        if (updateResult.error) {

            console.error(
                "ERREUR UPDATE :",
                updateResult.error
            );

            connectionStatus.textContent =
                "Erreur : " +
                updateResult.error.message;

            showToast(
                updateResult.error.message
            );

            return;
        }

        currentRoomCode = code;
        isHost = false;

        partnerName = party.player1;

        localStorage.setItem(
            "2gether_room",
            code
        );

        connectionStatus.textContent =
            "Connexion réussie ❤️";

        showToast(
            "Vous êtes connectés ! ❤️"
        );

        setTimeout(function () {

            openDashboard();

        }, 1000);

    } catch (error) {

        console.error(error);

        connectionStatus.textContent =
            "Erreur : " +
            error.message;

        showToast(
            error.message
        );
    }
}


// ==========================================
// ATTENDRE LE PARTENAIRE
// ==========================================

let partnerTimer = null;

function startCheckingPartner() {

    if (partnerTimer) {

        clearInterval(partnerTimer);
    }

    partnerTimer =
        setInterval(
            checkPartner,
            2000
        );

    checkPartner();
}


async function checkPartner() {

    if (currentRoomCode === "") {
        return;
    }

    try {

        const result =
            await supabaseClient
                .from("couples")
                .select("*")
                .eq("code", currentRoomCode)
                .maybeSingle();

        if (result.error) {

            console.error(
                "ERREUR VERIFICATION :",
                result.error
            );

            return;
        }

        const party = result.data;

        if (!party) {
            return;
        }

        if (party.player2) {

            clearInterval(partnerTimer);

            partnerTimer = null;

            partnerName = party.player2;

            connectionStatus.textContent =
                "Partenaire connecté ❤️";

            showToast(
                partnerName +
                " a rejoint la partie !"
            );

            setTimeout(function () {

                openDashboard();

            }, 1000);
        }

    } catch (error) {

        console.error(error);
    }
}


// ==========================================
// COPIER LE CODE
// ==========================================

copyBtn.addEventListener("click", async function () {

    const code =
        roomCode.textContent.trim();

    if (
        code === "" ||
        code === "------"
    ) {

        showToast(
            "Aucun code disponible."
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(code);

        showToast(
            "Code copié 📋"
        );

    } catch (error) {

        showToast(
            "Code : " + code
        );
    }
});


// ==========================================
// OUVRIR LE DASHBOARD
// ==========================================

function openDashboard() {

    if (partnerTimer) {

        clearInterval(partnerTimer);

        partnerTimer = null;
    }

    showScreen(dashboardScreen);

    updateDashboard();

    addActivity(
        "❤️ Votre aventure commence..."
    );
}


// ==========================================
// METTRE A JOUR LE DASHBOARD
// ==========================================

function updateDashboard() {

    document.getElementById("myName").textContent =
        myName;

    document.getElementById("partnerName").textContent =
        partnerName;

    document.getElementById("points").textContent =
        points;

    document.getElementById("streak").textContent =
        streak;

    document.getElementById("level").textContent =
        level;

    document.getElementById("levelText").textContent =
        level;

    document.getElementById("levelPoints").textContent =
        points;

    document.getElementById("progress").style.width =
        points + "%";
}


// ==========================================
// AJOUTER DES POINTS
// ==========================================

function addPoints(amount) {

    points += amount;

    if (points >= 100) {

        points = 0;

        level++;

        showToast(
            "Niveau supérieur 🏆"
        );
    }

    streak++;

    updateDashboard();
}


// ==========================================
// ACTIVITE RECENTE
// ==========================================

function addActivity(text) {

    const feed =
        document.getElementById("activityFeed");

    const item =
        document.createElement("p");

    item.textContent = text;

    feed.prepend(item);
}


// ==========================================
// QUESTIONS
// ==========================================

const quizQuestions = [

    "Quelle est la couleur préférée de ton partenaire ?",

    "Quel est le plus grand rêve de ton partenaire ?",

    "Quel est son plat préféré ?",

    "Quelle est sa chanson préférée ?",

    "Quelle destination aimerait-il visiter ?",

    "Qu'est-ce qui le fait le plus rire ?"

];


const challengeQuestions = [

    "Envoie un compliment à ton partenaire ❤️",

    "Fais une photo drôle 😂",

    "Envoie un vocal de 10 secondes 🎤",

    "Dis 3 choses que tu aimes chez l'autre ❤️",

    "Fais un cœur avec tes mains ❤️",

    "Envoie ton emoji préféré."

];


const coupleQuestions = [

    "Quel est votre meilleur souvenir ensemble ?",

    "Si vous pouviez voyager demain, où iriez-vous ?",

    "Quel rêve voulez-vous réaliser ensemble ?",

    "Quelle activité aimeriez-vous faire ensemble ?",

    "Quelle chanson représente votre couple ?",

    "Où aimeriez-vous être dans 5 ans ?"

];


function randomQuestion(list) {

    const index =
        Math.floor(
            Math.random() * list.length
        );

    return list[index];
}


// ==========================================
// BOUTONS ACTIVITES
// ==========================================

const activityButtons =
    document.querySelectorAll(".activity");


activityButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const game =
            button.dataset.game;

        openGame(game);
    });
});


// ==========================================
// OUVRIR UN JEU
// ==========================================

function openGame(game) {

    let icon = "❤️";
    let title = "Activité";
    let description = "";
    let reward = 10;

    if (game === "quiz") {

        icon = "🧠";

        title =
            "Qui connaît mieux l'autre ?";

        description =
            randomQuestion(
                quizQuestions
            );

        reward = 10;
    }

    if (game === "challenge") {

        icon = "⚡";

        title =
            "Défi rapide";

        description =
            randomQuestion(
                challengeQuestions
            );

        reward = 15;
    }

    if (game === "question") {

        icon = "💬";

        title =
            "Question à deux";

        description =
            randomQuestion(
                coupleQuestions
            );

        reward = 10;
    }

    gameIcon.textContent = icon;

    gameTitle.textContent = title;

    gameDescription.textContent =
        description;

    completeGameBtn.dataset.reward =
        reward;

    completeGameBtn.dataset.title =
        title;

    gameModal.classList.remove("hidden");

    gameModal.style.display =
        "flex";
}


// ==========================================
// TERMINER UN JEU
// ==========================================

completeGameBtn.addEventListener(
    "click",
    function () {

        const reward =
            Number(
                completeGameBtn.dataset.reward
            );

        const title =
            completeGameBtn.dataset.title;

        addPoints(reward);

        addActivity(
            "🎮 " +
            title +
            " terminé +" +
            reward +
            " points"
        );

        closeGame();

        showToast(
            "+" +
            reward +
            " points ❤️"
        );
    }
);


// ==========================================
// FERMER LE JEU
// ==========================================

closeModal.addEventListener(
    "click",
    function () {

        closeGame();
    }
);


gameModal.addEventListener(
    "click",
    function (event) {

        if (event.target === gameModal) {

            closeGame();
        }
    }
);


function closeGame() {

    gameModal.classList.add("hidden");

    gameModal.style.display =
        "none";
}


// ==========================================
// DECONNEXION
// ==========================================

disconnectBtn.addEventListener(
    "click",
    async function () {

        if (
            isHost &&
            currentRoomCode !== ""
        ) {

            try {

                await supabaseClient
                    .from("couples")
                    .delete()
                    .eq(
                        "code",
                        currentRoomCode
                    );

            } catch (error) {

                console.error(error);
            }
        }

        if (partnerTimer) {

            clearInterval(partnerTimer);

            partnerTimer = null;
        }

        currentRoomCode = "";
        isHost = false;
        partnerName = "Partenaire";

        localStorage.removeItem(
            "2gether_room"
        );

        showScreen(
            connectionScreen
        );

        createArea.classList.add("hidden");
        joinArea.classList.add("hidden");

        connectionStatus.textContent = "";

        showToast(
            "Déconnecté ❤️"
        );
    }
);


// ==========================================
// DEMARRAGE
// ==========================================

showScreen(
    welcomeScreen
);

console.log(
    "2GETHER ❤️ fonctionne correctement"
);