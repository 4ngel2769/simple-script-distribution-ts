# Script Distribution Server

A modern, TypeScript-based application for distributing and managing shell scripts with an intuitive admin dashboard and support for both managed and automated script deployment.

## 🚀 Overview

The Script Distribution Server simplifies script distribution for system administrators, DevOps teams, and developers. It provides clean URLs for script access, an admin interface for management, and seamless CI/CD integration.

**Key Use Case:** Enable users to install software or run configurations with simple one-liners:
```bash
curl -fsSL https://your-server.com/docker-install | bash
curl -fsSL https://your-server.com/setup-dev-env | bash
```

## ✨ Features

### 🌐 **Simple Script Distribution**
- **Clean URLs**: Access scripts at `https://your-domain.com/script-name`
- **One-line execution**: `curl -fsSL https://your-domain.com/script | bash`
- **No complex paths**: Direct root-level access to all scripts

### 🎯 **Three Script Types**

1. **🔗 Redirect Scripts**
   - Point to external URLs (GitHub, CDNs, etc.)
   - Perfect for maintaining existing script locations
   - Automatic redirection with proper HTTP codes

2. **📝 Managed Local Scripts**
   - Create and edit content through web interface
   - Built-in code editor with syntax highlighting
   - Version control through admin dashboard

3. **🔄 Unmanaged Local Scripts**
   - Content automatically sourced from file system
   - Always serves the newest `.sh` file in specified folder
   - Perfect for CI/CD integration and automated deployments

### 🛡️ **Security & Management**
- **Password-protected admin panel** with secure authentication
- **Reserved name protection** (prevents conflicts with system routes)
- **Automatic script name sanitization** (spaces → hyphens, invalid chars removed)
- **File permission management** for secure script execution

### 🐳 **Deployment Ready**
- **Docker & Docker Compose support** for easy deployment
- **Environment-based configuration** for different environments
- **Health check endpoints** for monitoring
- **Reverse proxy ready** (Nginx, Caddy, Traefik examples included)

### 💻 **Developer Experience**
- **Built with TypeScript** for type safety and maintainability
- **Next.js 15** with modern React features
- **Hot reload** for development
- **API documentation** for integration

## 🚦 Quick Start

### Using Docker (Recommended)

```bash
# Clone and start
git clone https://github.com/yourusername/simple-script-distribution-ts.git
cd simple-script-distribution-ts
docker compose up -d

# Access the application
open http://localhost:3000
```

**Default login:** `admin` / `admin123`

### Local Development

```bash
# Install and run
git clone https://github.com/yourusername/simple-script-distribution-ts.git
cd simple-script-distribution-ts
npm install
npm run dev
```

## 📋 Usage Examples

### For End Users

```bash
# Execute script directly
curl -fsSL https://scripts.company.com/setup-docker | bash

# Download and inspect first
curl https://scripts.company.com/setup-docker > setup-docker.sh
cat setup-docker.sh  # Review the script
chmod +x setup-docker.sh && ./setup-docker.sh

# Pass arguments (if script supports them)
curl -fsSL https://scripts.company.com/deploy | bash -s -- --env=prod --version=1.2.3
```

### For Administrators

1. **Create Redirect Script:**
   - Name: `docker-install`
   - Type: `Redirect`
   - URL: `https://get.docker.com`
   - Result: `curl -fsSL https://your-domain.com/docker-install | bash`

2. **Create Managed Script:**
   - Name: `setup-dev-env`
   - Type: `Local` + `Managed`
   - Edit content through web interface
   - Built-in syntax highlighting and validation

3. **Create Unmanaged Script (CI/CD):**
   - Name: `deploy-api`
   - Type: `Local` + `Unmanaged`
   - Folder: `api-deployment`
   - CI/CD pushes new scripts to `scripts/api-deployment/`
   - Always serves the newest `.sh` file automatically

## 🏗️ CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Script
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate deployment script
        run: |
          mkdir -p deployment-scripts
          cat > deployment-scripts/deploy-$(date +%Y%m%d-%H%M%S).sh << EOF
          #!/bin/bash
          echo "Deploying ${GITHUB_SHA}"
          # Your deployment commands here
          EOF
          
      - name: Deploy to script server
        run: |
          rsync -av deployment-scripts/ \
            ${{ secrets.DEPLOY_USER }}@${{ secrets.SCRIPT_SERVER }}:/opt/script-server/scripts/api-deployment/
```

### SSH Push Example

```bash
#!/bin/bash
# CI script to push new deployment script

APP_NAME="my-api"
VERSION="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SCRIPT_NAME="deploy-${VERSION}-${TIMESTAMP}.sh"

# Generate the script
cat > "$SCRIPT_NAME" << EOF
#!/bin/bash
echo "Deploying $APP_NAME version $VERSION"
docker pull myregistry/$APP_NAME:$VERSION
docker service update --image myregistry/$APP_NAME:$VERSION $APP_NAME
EOF

# Upload to script server
scp "$SCRIPT_NAME" deploy@script-server:/opt/script-server/scripts/$APP_NAME/

# Now users can run:
# curl -fsSL https://script-server.com/my-api | bash
```

## 🏢 Production Deployment

### Basic Production Setup

```bash
# 1. Clone on your server
git clone https://github.com/yourusername/simple-script-distribution-ts.git
cd simple-script-distribution-ts

# 2. Configure environment
cat > .env << EOF
NEXTAUTH_URL=https://scripts.yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CONFIG_PATH=/app/data/config.json
SCRIPTS_DIR=/app/scripts
PORT=3000
HOST_PORT=80
NODE_ENV=production
EOF

# 3. Set up admin credentials
npm run hash-password "your-secure-password"
# Update data/config.json with the hash

# 4. Deploy
docker compose up -d
```

### With Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name scripts.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring

### Health Check

```bash
# Basic health check
curl https://your-domain.com/api/health

# Detailed monitoring
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/health
```

### Usage Analytics

Monitor script access in your reverse proxy logs:

```bash
# Most accessed scripts
tail -f /var/log/nginx/access.log | grep -E "GET /[^/\s]+ HTTP" | grep -v "/api/" | grep -v "/admin"

# Script access frequency
awk '$7 ~ /^\/[^\/]+$/ && $7 !~ /^\/(api|admin|login)/ {print $7}' access.log | sort | uniq -c | sort -nr
```

## 📁 Project Structure

```
simple-script-distribution-ts/
├── 🗂️ src/
│   ├── 📱 app/                  # Next.js App Router
│   │   ├── 🏠 page.tsx          # Homepage with script list
│   │   ├── 👤 admin/            # Admin dashboard
│   │   ├── 🔐 login/            # Authentication
│   │   ├── 📡 api/              # API endpoints
│   │   └── 📜 [script]/         # Dynamic script routes
│   ├── 🧩 components/           # React components
│   ├── 📚 lib/                  # Utilities and business logic
│   └── 🔧 providers/            # Context providers
├── 📋 data/                     # Configuration storage
│   └── config.json             # Main configuration file
├── 📜 scripts/                  # Script file storage
│   ├── managed-script-1/       # Managed script folders
│   └── unmanaged-app/          # Unmanaged script folders
├── 🐳 docker-compose.yml       # Docker configuration
├── 📖 docs/                     # Documentation
│   ├── API.md                  # API documentation
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── SETUP.md                # Setup instructions
└── 🔧 tools/                    # Utility scripts
    └── hash-password.js        # Password hash generator
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with appropriate tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/simple-script-distribution-ts.git
cd simple-script-distribution-ts
npm install

# Run in development mode
npm run dev

# Run tests (when available)
npm test

# Build for production
npm run build
```

## 📖 Documentation

- **[Setup Guide](docs/SETUP.md)** - Installation and configuration
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[API Documentation](docs/API.md)** - REST API reference

## 🔧 Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code editor)
- **File System**: fs-extra for file operations
- **Security**: bcrypt for password hashing
- **HTTP Client**: Axios for API calls
- **Notifications**: React Hot Toast
- **Runtime**: Node.js 20+

## 🐛 Troubleshooting

### Common Issues

**Q: Scripts return 404 errors**
- Check if script name conflicts with reserved names (`admin`, `login`, `api`)
- Verify script exists in admin panel
- Ensure file permissions are correct (`755` for script directories)

**Q: Authentication fails**
- Verify `NEXTAUTH_URL` matches your domain exactly
- Ensure `NEXTAUTH_SECRET` is set and secure
- Check admin password hash in `data/config.json`

**Q: Unmanaged scripts don't update**
- Verify `.sh` files exist in the specified folder
- Check file modification times (newest file is served)
- Ensure proper file permissions

**Q: Docker container won't start**
- Check port conflicts (default: 3000)
- Verify volume mounts for `data` and `scripts` directories
- Review environment variables in `.env`

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# For Docker
docker compose -f docker-compose.yml -f docker-compose.debug.yml up
```

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js team** for the excellent framework
- **Vercel** for hosting and deployment tools
- **Open source community** for the amazing packages that make this possible

---

**Made with ❤️ for the DevOps and System Administration community**

*Simplifying script distribution, one curl command at a time.*
