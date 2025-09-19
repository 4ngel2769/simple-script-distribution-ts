# Setup Guide

This guide covers the initial setup of the Script Distribution Server.

## Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized deployment)

## Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/script-distribution.git
   cd script-distribution
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp example.env.local .env.local
   ```
   Edit `.env.local` with your specific configuration.

4. **Generate a password hash** (if you want to change the default admin password):
   ```bash
   npm run hash-password "your-secure-password"
   ```
   Copy the hash output for the next step.

5. **Initialize configuration:**
   ```bash
   mkdir -p data
   cp example.config.json data/config.json
   ```
   Edit `data/config.json` and replace the password hash with the one you generated.

6. **Create scripts directory:**
   ```bash
   mkdir -p scripts
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   ```

8. **Access the application:**
   - Main page: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## Docker Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/script-distribution.git
   cd script-distribution
   ```

2. **Set up environment variables:**
   ```bash
   cp example.env.local .env.local
   ```
   Edit `.env.local` with your specific configuration.

3. **Build and start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the application:**
   - Main page: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## Configuration Options

### Environment Variables

- `NEXTAUTH_URL` - The base URL of your application (required for NextAuth)
- `NEXTAUTH_SECRET` - Secret for NextAuth JWT encryption
- `CONFIG_PATH` - Path to the configuration file
- `SCRIPTS_DIR` - Directory for storing script files

### Default Admin User

The default admin credentials are:
- Username: `admin`
- Password: `admin123`

To change the default password:
1. Generate a new password hash:
   ```bash
   npm run hash-password "your-new-password"
   ```
2. Update the `admin.passwordHash` value in your config file.

## Directory Structure

```
script-distribution/
├── data/             # Configuration data (created during setup)
│   └── config.json   # Main configuration file
├── scripts/          # Script files directory
├── src/              # Application source code
└── docker-compose.yml # Docker Compose configuration
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Change the port in docker-compose.yml if 3000 is already in use

2. **Permission issues**
   - Ensure the application has write permissions to data/ and scripts/ directories

3. **Authentication issues**
   - Verify NEXTAUTH_URL and NEXTAUTH_SECRET are correctly set
   - Check the admin username and password hash in config.json
