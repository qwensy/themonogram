// Подключение к Supabase напрямую из браузера
const SUPABASE_URL = 'https://hdbhlbxmomqfdkdjqabw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nZLMzhJcHEMjmfEYBLK7xg_TaHIqa0Y';

// Инициализация Supabase клиента
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Загрузка пользователей при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
});

// Функция загрузки пользователей
async function loadUsers() {
    const list = document.getElementById('users-list');
    list.innerHTML = '<p>⌛ Загрузка...</p>';
    
    try {
        // Используем ваш серверный API, а не прямое подключение к Supabase
        const response = await fetch('/users');
        const result = await response.json();
        
        if (result.success) {
            if (result.data.length === 0) {
                list.innerHTML = '<p>👤 Пользователей пока нет</p>';
            } else {
                list.innerHTML = result.data.map(user => `
                    <div class="user-card">
                        <strong>${user.name || 'Без имени'}</strong><br>
                        📧 ${user.email}<br>
                        ${user.age ? `🎂 ${user.age} лет` : ''}
                    </div>
                `).join('');
            }
        } else {
            list.innerHTML = `<p style="color: red;">❌ Ошибка: ${result.error}</p>`;
        }
    } catch (error) {
        list.innerHTML = `<p style="color: red;">❌ Ошибка сети: ${error.message}</p>`;
    }
}

// Функция добавления пользователя
async function addUser() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    
    if (!name || !email) {
        alert('Заполните имя и email');
        return;
    }
    
    try {
        const response = await fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Пользователь добавлен!');
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            await loadUsers(); // Обновляем список
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        alert(`❌ Ошибка сети: ${error.message}`);
    }
}