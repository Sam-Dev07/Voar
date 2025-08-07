# Voar - Simple Social Media Platform

A minimal, yellow-themed social media platform built with Flask.

## Features
- ✅ User registration and login
- ✅ Create posts with text and optional media
- ✅ View all posts in chronological order
- ✅ Clean, responsive yellow-themed UI
- ✅ SQLite database for easy setup

## Quick Start

1. **Install Python dependencies:**
```bash
pip install flask werkzeug
```

2. **Run the application:**
```bash
python app.py
```

3. **Access the application:**
- Open your browser to `http://localhost:5000`
- Register a new account or login
- Start creating posts!

## Project Structure
```
Voar/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── voar.db               # SQLite database (created automatically)
├── templates/            # HTML templates
│   ├── base.html        # Base template
│   ├── index.html       # Home/feed page
│   ├── register.html    # Registration page
│   ├── login.html       # Login page
│   └── create_post.html # Post creation page
├── static/
│   ├── css/
│   │   └── style.css    # Yellow-themed CSS
│   ├── uploads/         # Uploaded media files
│   └── js/              # JavaScript files
└── README.md            # This file
```

## Usage

1. **Register**: Create a new account with username, email, and password
2. **Login**: Use your credentials to access the platform
3. **Create Posts**: Click "Create Post" to share text and media
4. **View Feed**: All posts appear in reverse chronological order

## Database Schema

The application uses SQLite with two main tables:
- **users**: Stores user information
- **posts**: Stores posts with optional media references

## Customization

- **Colors**: Modify the CSS variables in `static/css/style.css`
- **Database**: Change database settings in `config.py`
- **Upload limits**: Adjust file size and type restrictions in `app.py`

## Development

The application is ready to run with no additional configuration needed. The database will be created automatically on first run.
