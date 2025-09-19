# Script Distribution Server

A modern application for distributing and managing shell scripts with an admin dashboard.

## Overview

Script Distribution Server is a Next.js application designed to help system administrators and DevOps teams distribute shell scripts to users and systems. It provides:

- A public page where users can access scripts
- An admin dashboard for managing scripts
- Support for both local scripts and redirects to external script URLs
- Script content editor with syntax highlighting
- Simple authentication for administrative access

## Features

- 🚀 **Simple Script Distribution** - Easy access to scripts via clean URLs
- 🔒 **Secure Admin Panel** - Password-protected admin dashboard
- 📝 **Script Content Management** - Built-in editor for script content
- 🔄 **Redirect Support** - Option to redirect to external script URLs
- 🐳 **Docker Support** - Easy deployment via Docker or Docker Compose
- 💻 **Local Development** - Full support for local development

## Getting Started

See the [Setup Guide](docs/SETUP.md) for installation instructions.

## Documentation

- [Setup Guide](docs/SETUP.md) - Installation and initial setup
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [API Documentation](docs/API.md) - REST API endpoints reference

## Development

### Prerequisites

- Node.js 18+ and npm

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/script-distribution.git
   cd script-distribution
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp example.env.local .env.local
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Access the app at http://localhost:3000

### Default Login

- Username: `admin`
- Password: `admin123`

## License

MIT
