const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'templates'));

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: './db',
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
}));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Database setup
const db = new sqlite3.Database('voar.db');

// Initialize database
function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      media_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
  });
}

// Routes
app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  db.all(`
    SELECT p.id, p.content, p.media_filename, p.created_at, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC
  `, (err, posts) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching posts');
    }
    res.render('index', { posts });
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).send('Username or email already exists');
          }
          return res.status(500).send('Error creating user');
        }
        res.redirect('/login');
      }
    );
  } catch (error) {
    res.status(500).send('Error creating user');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    'SELECT id, password_hash FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).send('Error logging in');
      }
      
      if (!user || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(401).send('Invalid username or password');
      }
      
      req.session.userId = user.id;
      req.session.username = username;
      res.redirect('/');
    }
  );
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/create_post', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('create_post');
});

app.post('/create_post', upload.single('media'), (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const { content } = req.body;
  const mediaFilename = req.file ? req.file.filename : null;

  db.run(
    'INSERT INTO posts (user_id, content, media_filename) VALUES (?, ?, ?)',
    [req.session.userId, content, mediaFilename],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send('Error creating post');
      }
      res.redirect('/');
    }
  );
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Initialize database and start server
initDB();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
