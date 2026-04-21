const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const chatList = document.getElementById('chat-list');
const currentChatName = document.getElementById('current-chat-name');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username-input');

let currentUser = null;
let currentSocket = null;
let allUsers = []; 

// ici on gère le login 
loginBtn.onclick = async () => {
    const name = usernameInput.value.trim();
    if (!name) return;

    try {
        const response = await fetch('/users');
        allUsers = await response.json();
        
        // On cherche l'utilisateur (on ignore la casse Majuscule/Minuscule)
        const user = allUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
        
        if (user) {
            currentUser = user;
            loginView.style.display = 'none';
            appView.style.display = 'flex';
            loadRooms();
        } else {
            alert("Utilisateur introuvable. Créez-le d'abord dans le terminal.");
        }
    } catch (err) {
        console.error("Erreur login:", err);
    }
};

// les fonctions pour charger les salons, rejoindre un salon, afficher les messages et envoyer un message
async function loadRooms() {
    const response = await fetch('/rooms');
    const rooms = await response.json();
    chatList.innerHTML = '';
    
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.classList.add('chat-item');
        li.textContent = room.name;
        li.onclick = () => joinRoom(room, li);
        chatList.appendChild(li);
    });
}

// ouverture d'une connexion WebSocket pour un salon donné
async function joinRoom(room, element) {
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    currentChatName.textContent = room.name;
    messagesContainer.innerHTML = '';
    const response = await fetch(`/rooms/${room.id}/messages`);
    const messages = await response.json();
    
    messages.forEach(msg => {
        const sender = allUsers.find(u => u.id === msg.sender_id);
        const senderName = sender ? sender.name : "Inconnu";
        displayMessage(senderName, msg.content, msg.sender_id === currentUser.id);
    });
    if (currentSocket) {
        currentSocket.close();
    }
    // On utilise window.location.host pour que l'adresse soit toujours bonne 
    currentSocket = new WebSocket(`ws://${window.location.host}/ws/${room.id}/${currentUser.id}`);

    currentSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        displayMessage(data.sender_name, data.content, data.sender_id === currentUser.id);
    };
}
// Affichage d'un message dans le conteneur de messages
function displayMessage(senderName, text, isSent) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (isSent) msgDiv.classList.add('sent');

    const nameDiv = document.createElement('div');
    nameDiv.style.fontSize = '0.75em';
    nameDiv.style.fontWeight = 'bold';
    nameDiv.style.marginBottom = '4px';
    nameDiv.style.color = isSent ? '#000000' : '#555555'; 
    nameDiv.textContent = isSent ? 'Moi' : senderName;

    const textDiv = document.createElement('div');
    textDiv.textContent = text;

    msgDiv.appendChild(nameDiv);
    msgDiv.appendChild(textDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// envoie d'un message via WebSocket au serveur
sendBtn.onclick = () => {
    const content = messageInput.value.trim();
    if (content && currentSocket && currentSocket.readyState === WebSocket.OPEN) {
        currentSocket.send(content);
        messageInput.value = '';
    }
};

// Touche Entrée pour envoyer
messageInput.onkeypress = (e) => {
    if (e.key === 'Enter') sendBtn.click();
};