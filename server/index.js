require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');
const path = require('path'); // Добавьте эту строку

// Настройка Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hdbhlbxmomqfdkdjqabw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_nZLMzhJcHEMjmfEYBLK7xg_TaHIqa0Y';

const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================== ВАЖНО! ======================
// Раздача статических файлов (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));
// ===================================================

// ... остальные маршруты (как в предыдущем коде) ...

// Запуск сервера
app.listen(port, () => {
  console.log(`
  ✅ Сервер запущен!
  📍 Локальный URL: http://localhost:${port}
  📁 Статические файлы: ${path.join(__dirname, '../public')}
  
  Откройте в браузере: http://localhost:${port}
  `);
});