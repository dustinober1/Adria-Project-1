# Project Structure# Project Structure



This repository is organized into clear, functional directories:This repository is organized into clear, functional directories:



## Directory Organization## Directory Organization



``````

..

├── public/                 # Frontend static files served by Express├── public/                 # Frontend static files served by Express

│   ├── index.html         # Landing page│   ├── index.html         # Landing page

│   ├── admin.html         # Admin dashboard│   ├── admin.html         # Admin dashboard

│   ├── blog.html          # Blog listing page│   ├── blog.html          # Blog listing page

│   ├── login.html         # Login page│   ├── login.html         # Login page

│   ├── register.html      # Registration page│   ├── register.html      # Registration page

│   ├── matcher.html       # Outfit matching tool│   ├── matcher.html       # Outfit matching tool

│   ├── css/              # Stylesheets│   ├── css/              # Stylesheets

│   │   ├── landing.css   # Landing page styles│   │   ├── landing.css   # Landing page styles

│   │   ├── matcher.css   # Matcher page styles│   │   ├── matcher.css   # Matcher page styles

│   │   └── admin.css     # Admin dashboard styles│   │   └── admin.css     # Admin dashboard styles

│   ├── js/               # Client-side JavaScript│   ├── js/               # Client-side JavaScript

│   │   ├── auth.js       # Authentication utilities│   │   ├── auth.js       # Authentication utilities

│   │   ├── landing.js    # Landing page logic│   │   ├── landing.js    # Landing page logic

│   │   ├── admin.js      # Admin dashboard logic│   │   ├── admin.js      # Admin dashboard logic

│   │   └── matcher.js    # Outfit matcher logic│   │   └── matcher.js    # Outfit matcher logic

│   ├── assets/           # Media and static resources│   ├── assets/           # Media and static resources

│   │   ├── images/       # Image files│   │   ├── images/       # Image files

│   │   └── ...│   │   └── ...

│   └── *.md              # Blog articles in Markdown│   └── *.md              # Blog articles in Markdown

││

├── server/                # Backend Node.js/Express application├── server/                # Backend Node.js/Express application

│   ├── server.js         # Main Express server configuration│   ├── server.js         # Main Express server configuration

│   ├── controllers/      # Route handlers and business logic│   ├── controllers/      # Route handlers and business logic

│   │   ├── authController.js│   │   ├── authController.js

│   │   ├── adminController.js│   │   ├── adminController.js

│   │   ├── blogController.js│   │   ├── blogController.js

│   │   └── emailController.js│   │   └── emailController.js

│   ├── models/           # Data models (CSV-based)│   ├── models/           # Data models (CSV-based)

│   │   ├── User.js│   │   ├── User.js

│   │   ├── Admin.js│   │   ├── Admin.js

│   │   ├── BlogArticle.js│   │   ├── BlogArticle.js

│   │   └── EmailList.js│   │   └── EmailList.js

│   ├── routes/           # API route definitions│   ├── routes/           # API route definitions

│   │   ├── auth.js│   │   ├── auth.js

│   │   ├── admin.js│   │   ├── admin.js

│   │   ├── blog.js│   │   ├── blog.js

│   │   └── email.js│   │   └── email.js

│   ├── middleware/       # Custom middleware│   ├── middleware/       # Custom middleware

│   │   └── auth.js       # JWT authentication middleware│   │   └── auth.js       # JWT authentication middleware

│   └── database/         # Database utilities (legacy, not used)│   └── database/         # Database utilities (legacy, not used)

││

├── scripts/              # Setup and utility scripts├── scripts/              # Setup and utility scripts

│   ├── setup.sh         # Initial project setup│   ├── setup.sh         # Initial project setup

│   ├── QUICK_START_ADMIN.sh  # Quick admin setup│   ├── QUICK_START_ADMIN.sh  # Quick admin setup

│   └── generate-secret.js    # JWT secret generation│   └── generate-secret.js    # JWT secret generation

││

├── docs/                # Documentation├── docs/                # Documentation

│   ├── START_HERE.md         # Getting started guide│   ├── START_HERE.md         # Getting started guide

│   ├── SETUP.md              # Detailed setup instructions│   ├── SETUP.md              # Detailed setup instructions

│   ├── ADMIN_SETUP.md        # Admin setup guide│   ├── ADMIN_SETUP.md        # Admin setup guide

│   ├── QUICK_REFERENCE.txt   # Quick reference guide│   ├── QUICK_REFERENCE.txt   # Quick reference guide

│   ├── QUICK_START_ADMIN.sh  # Quick admin setup script│   ├── QUICK_START_ADMIN.sh  # Quick admin setup script

│   └── Z-INDEX_HIERARCHY.md  # Z-index conventions│   └── Z-INDEX_HIERARCHY.md  # Z-index conventions

││

├── data/               # User and application data (CSV-based)├── data/               # User and application data (CSV-based)

│   ├── users.csv       # User accounts│   ├── users.csv       # User accounts

│   ├── email_list.csv  # Email subscriptions│   ├── email_list.csv  # Email subscriptions

│   └── blog_articles.csv # Blog article metadata│   └── blog_articles.csv # Blog article metadata

││

├── .env               # Environment variables (create from .env.example)├── .env               # Environment variables (create from .env.example)

├── .env.example      # Example environment variables├── .env.example      # Example environment variables

├── .gitignore        # Git ignore rules├── .gitignore        # Git ignore rules

├── package.json      # NPM dependencies and scripts├── package.json      # NPM dependencies and scripts

└── README.md         # Project README└── README.md         # Project README

``````



## Key Points## Key Points



- **Public Directory**: Contains all frontend-facing static files (HTML, CSS, JS, images, blog articles)- **Public Directory**: Contains all frontend-facing static files (HTML, CSS, JS, images, blog articles)

- **Server Directory**: Contains the Express backend with routes, controllers, middleware, and models- **Server Directory**: Contains the Express backend with routes, controllers, middleware, and models

- **Scripts Directory**: Utility scripts for setup and configuration- **Scripts Directory**: Utility scripts for setup and configuration

- **Docs Directory**: Documentation files for reference and setup- **Docs Directory**: Documentation files for reference and setup

- **Data Directory**: CSV files for storing user data (not committed to git)- **Data Directory**: CSV files for storing user data (not committed to git)



## Running the Application## Running the Application



```bash```bash

# Install dependencies# Install dependencies

npm installnpm install



# Start the server# Start the server

npm startnpm start



# Or use development mode with auto-reload# Or use development mode with auto-reload

npm run devnpm run dev

``````



The server will serve all static files from the `public/` directory at `http://localhost:3000`.The server will serve all static files from the `public/` directory at `http://localhost:3000`.



## API Routes## API Routes



All API endpoints are prefixed with `/api/`:All API endpoints are prefixed with `/api/`:



- `/api/auth` - Authentication endpoints- `/api/auth` - Authentication endpoints

- `/api/admin` - Admin dashboard endpoints- `/api/admin` - Admin dashboard endpoints

- `/api/blog` - Blog-related endpoints- `/api/blog` - Blog-related endpoints

- `/api/email` - Email subscription endpoints- `/api/email` - Email subscription endpoints



## Frontend Relative Paths## Frontend Relative Paths



Since all frontend files are in the `public/` directory, relative paths work correctly:Since all frontend files are in the `public/` directory, relative paths work correctly:

- CSS: `href="css/landing.css"`- CSS: `href="css/landing.css"`

- JavaScript: `src="js/auth.js"`- JavaScript: `src="js/auth.js"`

- Assets: `src="assets/images/photo.jpg"`- Assets: `src="assets/images/photo.jpg"`

