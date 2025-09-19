# Setup Guide

This guide covers the initial setup of the Script Distribution Server with support for managed and unmanaged scripts.

## Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized deployment)

## Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/simple-script-distribution-ts.git
   cd simple-script-distribution-ts
   ```

2. **Start with Docker Compose:**
   ```bash
   docker compose up -d
   ```

3. **Access the application:**
   - Main page: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin
   - Default login: `admin` / `admin123`

## Local Development Setup

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/simple-script-distribution-ts.git
   cd simple-script-distribution-ts
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # The .env file should already exist with defaults
   # Edit if needed for custom configuration
   ```

4. **Initialize directories:**
   ```bash
   mkdir -p data scripts
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Main page: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

### Default Configuration

The application initializes with:
- **Username:** `admin`
- **Password:** `admin123`
- **Config file:** `data/config.json` (created automatically)
- **Scripts directory:** `scripts/` (for local script files)

## Script Types

### 1. Redirect Scripts

Redirect to external URLs for script content.

**Example:**
- **Name:** `docker-install`
- **Type:** Redirect
- **URL:** `https://get.docker.com`
- **Access:** `curl -fsSL http://localhost:3000/docker-install | bash`

### 2. Managed Local Scripts

Script content is created and edited through the web interface.

**Example:**
- **Name:** `hello-world`
- **Type:** Local
- **Mode:** Managed
- **Access:** `curl -fsSL http://localhost:3000/hello-world | bash`

**Features:**
- Built-in code editor with syntax highlighting
- Content stored in individual script directories
- Version controlled through the web interface

### 3. Unmanaged Local Scripts

Script content is read from the file system, automatically using the newest .sh file in a specified folder.

**Example Setup:**
1. Create folder: `mkdir -p scripts/my-app`
2. Add script: `echo '#!/bin/bash\necho "Hello from CI/CD"' > scripts/my-app/deploy-v1.0.sh`
3. Create unmanaged script in admin panel:
   - **Name:** `my-app`
   - **Type:** Local
   - **Mode:** Unmanaged
   - **Folder:** `my-app`
4. **Access:** `curl -fsSL http://localhost:3000/my-app | bash`

**Features:**
- Perfect for CI/CD integration
- Automatically serves the newest .sh file in the folder
- No web interface editing (content managed externally)

## Configuration

### Environment Variables

Create or modify `.env` file:

```env
# Next Auth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-secret-key-change-this

# Script Configuration
CONFIG_PATH=./data/config.json
SCRIPTS_DIR=./scripts

# Server Configuration
PORT=3000
HOST_PORT=3000
NODE_ENV=production
```

### Custom Admin Credentials

1. **Generate a password hash:**
   ```bash
   npm run hash-password "your-secure-password"
   ```

2. **Update config file:**
   ```json
   {
     "admin": {
       "username": "yourusername",
       "passwordHash": "paste-generated-hash-here"
     },
     "scripts": []
   }
   ```

### Directory Structure

```
simple-script-distribution-ts/
├── data/                    # Configuration data
│   └── config.json         # Main configuration file
├── scripts/                # Script files directory
│   ├── managed-script-1/   # Managed script folder
│   │   └── managed-script-1.sh
│   ├── unmanaged-app/      # Unmanaged script folder
│   │   ├── deploy-v1.0.sh  # Older script
│   │   └── deploy-v1.1.sh  # Newest script (automatically used)
│   └── tor/                # Example unmanaged folder
│       └── install-tor.sh
├── src/                    # Application source code
├── docker-compose.yml      # Docker configuration
└── .env                    # Environment variables
```

## Setting Up CI/CD Integration

### For Unmanaged Scripts

1. **Create a script folder:**
   ```bash
   mkdir -p scripts/my-deployment
   ```

2. **Add to your CI/CD pipeline:**
   ```yaml
   # Example GitHub Actions
   - name: Deploy Script
     run: |
       # Generate script with timestamp
       SCRIPT_NAME="deploy-$(date +%Y%m%d-%H%M%S).sh"
       echo '#!/bin/bash' > scripts/my-deployment/$SCRIPT_NAME
       echo 'echo "Deploying version $VERSION"' >> scripts/my-deployment/$SCRIPT_NAME
       chmod +x scripts/my-deployment/$SCRIPT_NAME
       
       # Sync to server
       rsync -av scripts/ user@server:/path/to/script-server/scripts/
   ```

3. **Create unmanaged script in admin panel:**
   - Navigate to admin dashboard
   - Click "Add New Script"
   - Set type to "Local" and mode to "Unmanaged"
   - Set folder path to `my-deployment`

4. **Users can now access:**
   ```bash
   curl -fsSL https://your-domain.com/my-deployment | bash
   ```

### SSH Integration Example

```bash
#!/bin/bash
# deploy-script.sh - Run this from your CI/CD

SERVER="your-script-server.com"
USER="deploy"
SCRIPT_DIR="/opt/script-server/scripts"
APP_NAME="$1"
VERSION="$2"

# Create timestamped script
SCRIPT_FILE="${APP_NAME}/deploy-${VERSION}-$(date +%Y%m%d-%H%M%S).sh"

# Upload new script
ssh $USER@$SERVER "mkdir -p $SCRIPT_DIR/$APP_NAME"
scp ./generated-script.sh $USER@$SERVER:$SCRIPT_DIR/$SCRIPT_FILE
ssh $USER@$SERVER "chmod +x $SCRIPT_DIR/$SCRIPT_FILE"

echo "Script deployed: https://$SERVER/$APP_NAME"
```

## Usage Examples

### Basic Script Access

```bash
# Direct execution
curl -fsSL http://localhost:3000/script-name | bash

# Download only
curl -o install.sh http://localhost:3000/script-name

# With sudo
curl -fsSL http://localhost:3000/script-name | sudo bash

# With parameters (if script supports them)
curl -fsSL http://localhost:3000/script-name | bash -s arg1 arg2
```

### Admin Operations

```bash
# Check server health
curl http://localhost:3000/api/health

# Get all scripts (requires authentication)
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/scripts
```

## Folder Explorer Usage

When creating unmanaged scripts:

1. **Click "Browse" button** in the script creation modal
2. **Navigate folders** by clicking on folder names
3. **Go up** by clicking ".." 
4. **Select folder** by clicking "Select Current Folder"
5. **Folder path** is automatically filled in the form

The system will automatically create folders if they don't exist when accessed.

## Security Considerations

### Script Name Validation

Script names automatically:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Must be 2-50 characters
- Cannot use reserved names (`admin`, `login`, `api`, etc.)

### Reserved URLs

These URLs cannot be used as script names:
- `/admin` - Admin dashboard
- `/login` - Login page
- `/api/*` - API endpoints
- `/health` - Health check
- `/_next/*` - Next.js internals

## Troubleshooting

### Common Issues

1. **Permission denied on script files:**
   ```bash
   chmod -R 755 scripts/
   ```

2. **Config file not found:**
   ```bash
   mkdir -p data
   # The app will create config.json automatically
   ```

3. **Authentication not working:**
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure `NEXTAUTH_SECRET` is set
   - Verify admin password hash is correct

4. **Scripts not updating (unmanaged):**
   - Check file permissions
   - Ensure .sh files exist in the folder
   - Verify folder path is correct

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Port Conflicts

Change the port in `.env`:
```env
PORT=3001
HOST_PORT=3001
```

## Development Tips

### Adding Custom Script Validation

Extend the validation in `src/lib/db.ts`:

```typescript
export function validateScriptName(name: string): void {
  // Add custom validation rules here
  if (name.includes('custom-forbidden-word')) {
    throw new Error('Custom validation error');
  }
}
```

### Custom Script Processing

For unmanaged scripts, modify `getScriptContent()` in `src/lib/db.ts` to add custom processing:

```typescript
// Add preprocessing before serving
const content = await fs.readFile(newestFile, 'utf8');
const processedContent = content.replace('{{VERSION}}', process.env.APP_VERSION);
return processedContent;
```

This setup guide provides everything needed to get started with the Script Distribution Server, from basic setup to advanced CI/CD integration.
