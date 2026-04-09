const chatList = document.getElementById('chat-list');
const currentChatName = document.getElementById('current-chat-name');
const messagesContainer = document.getElementById('messages-container');

async function loadUsers() {
    const response = await fetch('/api/users');
    const users = await response.json();

    chatList.innerHTML = '';

    users.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('chat-item');
        li.textContent = user.username;
        
        li.addEventListener('click', () => {
            selectUser(user, li);
        });

        chatList.appendChild(li);
    });
}

function selectUser(user, element) {
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    
    currentChatName.textContent = user.username;
    
    messagesContainer.innerHTML = '';
    const info = document.createElement('div');
    info.style.textAlign = 'center';
    info.style.color = 'gray';
    info.textContent = `Discussion avec ${user.username} (ID: ${user.id})`;
    messagesContainer.appendChild(info);
}

loadUsers();