// server/index.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');
const path = require('path');

// ======================
// НАСТРОЙКА SUPABASE
// ======================
const supabaseUrl = process.env.SUPABASE_URL || 'https://hdbhlbxmomqfdkdjqabw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_nZLMzhJcHEMjmfEYBLK7xg_TaHIqa0Y';

// Проверка ключей
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: SUPABASE_URL или SUPABASE_ANON_KEY не указаны в .env файле');
  console.log('Создайте файл .env в папке server/ и добавьте:');
  console.log('SUPABASE_URL=https://hdbhlbxmomqfdkdjqabw.supabase.co');
  console.log('SUPABASE_ANON_KEY=sb_publishable_nZLMzhJcHEMjmfEYBLK7xg_TaHIqa0Y');
  process.exit(1);
}

console.log('🔗 Подключаемся к Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// ======================
// НАСТРОЙКА EXPRESS
// ======================
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// РАЗДАЧА СТАТИЧЕСКИХ ФАЙЛОВ
// ======================
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log(`📁 Статические файлы из: ${publicPath}`);

// ======================
// API МАРШРУТЫ
// ======================

// 1. Главная страница API
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 Node.js + Supabase API работает!',
    version: '1.0.0',
    endpoints: {
      home: 'GET /',
      health: 'GET /api/health',
      users: 'GET /api/users',
      addUser: 'POST /api/users',
      products: 'GET /api/products',
      addProduct: 'POST /api/products',
      searchUser: 'GET /api/users/search?email=...'
    },
    supabase: {
      url: supabaseUrl,
      status: 'connected'
    }
  });
});

// 2. Проверка соединения с Supabase
app.get('/api/health', async (req, res) => {
  try {
    // Простой запрос для проверки соединения
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = таблица пустая (но существует)
      throw error;
    }
    
    res.json({
      status: '✅ healthy',
      supabase: 'connected',
      timestamp: new Date().toISOString(),
      server: `Node.js ${process.version}`,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    });
  } catch (error) {
    console.error('❌ Ошибка здоровья:', error.message);
    res.status(500).json({
      status: '❌ error',
      message: error.message,
      details: 'Проверьте соединение с Supabase или создайте таблицы'
    });
  }
});

// 3. ПОЛУЧИТЬ всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    console.log('📥 Запрос пользователей...');
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (error) {
      // Если таблицы не существует, создадим её
      if (error.code === '42P01') {
        console.log('📋 Таблица users не найдена, создаём...');
        return res.status(404).json({
          success: false,
          error: 'Таблица users не найдена',
          hint: 'Создайте таблицу в Supabase Table Editor'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      count: count || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// 4. ДОБАВИТЬ нового пользователя
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    
    // Валидация
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Имя и email обязательны'
      });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный email'
      });
    }
    
    console.log(`➕ Добавление пользователя: ${name} (${email})`);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          age: age ? parseInt(age) : null,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      if (error.code === '23505') { // Ошибка уникальности
        return res.status(409).json({
          success: false,
          error: 'Пользователь с таким email уже существует'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      message: '👤 Пользователь успешно добавлен!',
      data: data[0]
    });
  } catch (error) {
    console.error('❌ Ошибка добавления пользователя:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// 5. РАБОТА С ПРОДУКТАМИ
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === '42P01') {
        return res.status(404).json({
          success: false,
          error: 'Таблица products не найдена'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Название и цена обязательны'
      });
    }
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Цена должна быть положительным числом'
      });
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: name.trim(),
          price: priceNum,
          description: description?.trim() || '',
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: '🛒 Продукт успешно добавлен!',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 6. ПОИСК пользователя по email
app.get('/api/users/search', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Укажите email для поиска (параметр ?email=...)'
      });
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      found: data.length > 0,
      data: data[0] || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 7. УДАЛИТЬ пользователя (только для демонстрации)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: `Пользователь #${id} удалён`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 8. Создать тестовую таблицу (для удобства)
app.post('/api/setup', async (req, res) => {
  try {
    console.log('⚙️  Настройка тестовых данных...');
    
    // Проверяем существование таблиц
    const tables = ['users', 'products'];
    const results = {};
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      results[table] = error ? 'отсутствует' : 'существует';
    }
    
    res.json({
      success: true,
      message: 'Проверка таблиц завершена',
      tables: results,
      instructions: {
        users: 'Создайте таблицу "users" с колонками: id (int8, primary), name (text), email (text), age (int4), created_at (timestamptz)',
        products: 'Создайте таблицу "products" с колонками: id (int8, primary), name (text), price (numeric), description (text), created_at (timestamptz)'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================
// ОБРАБОТКА ОШИБОК
// ======================

// Ошибка 404 для API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '🚫 API маршрут не найден',
    path: req.originalUrl
  });
});

// Все остальные запросы → index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ======================
// ЗАПУСК СЕРВЕРА
// ======================
app.listen(port, () => {
  console.log(`
  🚀 Сервер успешно запущен!
  
  📍 Локальный доступ:
      http://localhost:${port}
      http://127.0.0.1:${port}
  
  📁 Статические файлы:
      ${publicPath}
  
  🔧 API эндпоинты:
      👉 GET  /                   - Главная страница (HTML)
      👉 GET  /api               - Информация об API
      👉 GET  /api/health       - Проверка здоровья
      👉 GET  /api/users        - Все пользователи
      👉 POST /api/users        - Добавить пользователя
      👉 GET  /api/products     - Все продукты
      👉 POST /api/products     - Добавить продукт
      👉 GET  /api/users/search - Поиск по email
      👉 POST /api/setup        - Настройка тестовых данных
  
  ⚙️  Настройка Supabase:
      1. Откройте: ${supabaseUrl}
      2. Table Editor → Create new table
      3. Создайте таблицы 'users' и 'products'
  
  ⚠️  Для остановки сервера нажмите: Ctrl+C
  `);
});

// Обработка завершения
process.on('SIGINT', () => {
  console.log('\n👋 Сервер остановлен');
  process.exit(0);
});