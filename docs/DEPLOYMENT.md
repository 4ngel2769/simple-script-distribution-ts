# Production Deployment Guide

This guide covers deploying the Script Distribution Server to production environments.

## Deployment Options

### Docker Compose (Recommended)

1. **Clone the repository on your server:**
   ```bash
   git clone https://github.com/yourusername/script-distribution.git
   cd script-distribution
   ```

2. **Set up environment variables:**
   ```bash
   cp example.env.local .env.local
   ```
   Edit `.env.local` with your production settings:
   ```
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate-a-secure-random-string
   CONFIG_PATH=./data/config.json
   SCRIPTS_DIR=./scripts
   ```

3. **Create data directory structure:**
   ```bash
   mkdir -p data scripts
   ```

4. **Set up a secure admin password:**
   ```bash
   docker run --rm node:alpine node -e "console.log(require('bcrypt').hashSync(process.argv[1], 10))" "your-secure-password"
   ```

5. **Create initial config:**
   ```bash
   echo '{
     "admin": {
       "username": "admin",
       "passwordHash": "PASTE_HASH_HERE"
     },
     "scripts": []
   }' > data/config.json
   ```

6. **Build and start the container:**
   ```bash
   docker compose up -d
   ```

### Reverse Proxy Configuration

For production deployments, it's recommended to put the application behind a reverse proxy like Nginx or Caddy to handle SSL and domain routing.

#### Nginx Example

```nginx
server {
    listen 80;
    server_name script-server.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy Example

```
script-server.yourdomain.com {
    reverse_proxy localhost:3000
}
```

## Security Considerations

### HTTPS

Always use HTTPS in production. Update your `NEXTAUTH_URL` to use `https://` and configure SSL in your reverse proxy.

### Environment Variables

- Generate a secure random string for `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```

### File Permissions

Ensure the data and scripts directories have appropriate permissions:

```bash
chown -R 1000:1000 data scripts
chmod -R 750 data scripts
```

## Resource Scaling

The application is lightweight and should run on minimal hardware:

- **CPU**: 1 core
- **RAM**: 512MB minimum, 1GB recommended
- **Disk**: Depends on script storage needs, minimum 1GB

## Monitoring & Maintenance

### Health Check

The application provides a health check endpoint at `/api/health`.

### Backups

Regularly backup your data directory:

```bash
tar -czf script-server-backup-$(date +%Y%m%d).tar.gz data scripts
```

### Logs

View logs with:

```bash
docker compose logs -f
```

## Update Procedure

1. **Pull the latest code:**
   ```bash
   git pull
   ```

2. **Rebuild and restart:**
   ```bash
   docker compose down
   docker compose up -d --build
   ```
