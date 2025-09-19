# Production Deployment Guide

This guide covers deploying the Script Distribution Server to production environments.

## Deployment Options

### Docker Compose (Recommended)

1. **Clone the repository on your server:**
   ```bash
   git clone https://github.com/4ngel2769/simple-script-distribution-ts.git
   cd simple-script-distribution-ts
   ```

2. **Set up environment variables:**
   ```bash
   cp .env .env.production
   ```
   Edit `.env.production` with your production settings:
   ```env
   # Next Auth Configuration
   NEXTAUTH_URL=https://scripts.yourdomain.com
   NEXTAUTH_SECRET=generate-a-secure-random-string-here
   
   # Script Configuration
   CONFIG_PATH=/app/data/config.json
   SCRIPTS_DIR=/app/scripts
   
   # Server Configuration
   PORT=3000
   HOST_PORT=80
   NODE_ENV=production
   ```

3. **Create data directory structure:**
   ```bash
   mkdir -p data scripts
   chmod 755 data scripts
   ```

4. **Set up a secure admin password:**
   ```bash
   npm run hash-password "your-secure-password"
   ```
   Copy the hash output for the next step.

5. **Create initial config:**
   ```bash
   cat > data/config.json << EOF
   {
     "admin": {
       "username": "admin",
       "passwordHash": "PASTE_HASH_HERE"
     },
     "scripts": []
   }
   EOF
   ```

6. **Build and start the container:**
   ```bash
   docker compose up -d
   ```

7. **Verify deployment:**
   ```bash
   curl http://localhost/api/health
   ```

### Reverse Proxy Configuration

For production deployments, use a reverse proxy for SSL termination and domain routing.

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name scripts.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name scripts.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for large scripts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### Caddy Configuration

```caddyfile
scripts.yourdomain.com {
    reverse_proxy localhost:3000
    
    # Security headers
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

#### Traefik Configuration

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  script-server:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.script-server.rule=Host(`scripts.yourdomain.com`)"
      - "traefik.http.routers.script-server.tls=true"
      - "traefik.http.routers.script-server.tls.certresolver=letsencrypt"
      - "traefik.http.services.script-server.loadbalancer.server.port=3000"
```

## Security Considerations

### HTTPS (Required)

Always use HTTPS in production:
- Update `NEXTAUTH_URL` to use `https://`
- Configure SSL in your reverse proxy
- Use security headers (shown in nginx config above)

### Environment Variables

Generate secure random strings:

```bash
# For NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Alternative method
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### File Permissions

Ensure proper permissions for data persistence:

```bash
# If running with Docker
chown -R 1000:1000 data scripts
chmod -R 750 data scripts

# If running directly
chown -R www-data:www-data data scripts
chmod -R 750 data scripts
```

### Script Security

- **Unmanaged Scripts**: Ensure CI/CD systems pushing scripts have appropriate access controls
- **File Validation**: Consider adding file size limits and content validation
- **Access Logs**: Monitor script access patterns

## High Availability Setup

### Load Balancing

For multiple instances, use shared storage for data and scripts:

```yaml
# docker-compose.ha.yml
version: '3.8'
services:
  script-server-1:
    build: .
    volumes:
      - shared-data:/app/data
      - shared-scripts:/app/scripts
    environment:
      - INSTANCE_ID=1
      
  script-server-2:
    build: .
    volumes:
      - shared-data:/app/data
      - shared-scripts:/app/scripts
    environment:
      - INSTANCE_ID=2

volumes:
  shared-data:
    driver: nfs
    driver_opts:
      share: nfs-server.example.com:/path/to/data
  shared-scripts:
    driver: nfs
    driver_opts:
      share: nfs-server.example.com:/path/to/scripts
```

## Resource Requirements

### Minimum Requirements

- **CPU**: 1 vCPU
- **RAM**: 512MB
- **Disk**: 2GB (more for script storage)
- **Network**: 100 Mbps

### Recommended (Production)

- **CPU**: 2 vCPU
- **RAM**: 1GB
- **Disk**: 10GB SSD
- **Network**: 1 Gbps

### Scaling Considerations

The application is stateless except for file storage:
- Multiple instances can share NFS/GlusterFS storage
- Database not required - uses JSON config file
- Scales horizontally behind load balancer

## Monitoring & Maintenance

### Health Monitoring

Set up monitoring for the health endpoint:

```bash
# Uptime check
curl -f https://scripts.yourdomain.com/api/health || alert

# Detailed monitoring with response time
curl -w "@curl-format.txt" -o /dev/null -s https://scripts.yourdomain.com/api/health
```

Create `curl-format.txt`:
```
time_namelookup:  %{time_namelookup}s\n
time_connect:     %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer: %{time_pretransfer}s\n
time_redirect:    %{time_redirect}s\n
time_starttransfer: %{time_starttransfer}s\n
time_total:       %{time_total}s\n
```

### Log Management

Configure log rotation and monitoring:

```bash
# View application logs
docker compose logs -f script-server

# Set up log rotation
echo '/var/lib/docker/containers/*/*-json.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 644 root root
}' > /etc/logrotate.d/docker
```

### Backup Strategy

**Critical Data to Backup:**
- `data/config.json` - Script configurations and admin credentials
- `scripts/` - All script files (especially managed scripts)

**Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/script-server"
mkdir -p "$BACKUP_DIR"

# Backup configuration and scripts
tar -czf "$BACKUP_DIR/script-server-$DATE.tar.gz" \
  -C /path/to/script-server \
  data scripts

# Keep only last 30 days
find "$BACKUP_DIR" -name "script-server-*.tar.gz" -mtime +30 -delete

# Optional: Upload to remote storage
# aws s3 cp "$BACKUP_DIR/script-server-$DATE.tar.gz" s3://your-backup-bucket/
```

### Performance Tuning

**Docker Settings:**
```yaml
services:
  script-server:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

**Node.js Optimization:**
```bash
# In Dockerfile or docker-compose.yml
ENV NODE_OPTIONS="--max-old-space-size=512"
```

## Update Procedure

### Rolling Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Build new image
docker compose build

# 3. Update with zero downtime (if using load balancer)
docker compose up -d --no-deps script-server

# 4. Verify health
curl -f https://scripts.yourdomain.com/api/health
```

### Rollback Procedure

```bash
# 1. Identify last working commit
git log --oneline -10

# 2. Revert to previous version
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker compose down
docker compose up -d --build
```

## Troubleshooting

### Common Issues

1. **404 on script access**
   - Check if script name conflicts with reserved names
   - Verify script exists in config.json
   - Check file permissions on scripts directory

2. **Authentication failures**
   - Verify `NEXTAUTH_SECRET` is set and consistent
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure admin password hash is correct

3. **Script content not updating (unmanaged)**
   - Verify file permissions in script folders
   - Check that .sh files exist in the specified folder
   - Ensure newest file has recent modification time

4. **Performance issues**
   - Monitor CPU and memory usage
   - Check disk I/O for script directory
   - Review access logs for abuse

### Debug Mode

Enable debug logging:

```yaml
environment:
  - NODE_ENV=production
  - DEBUG=nextjs:*
  - NEXTAUTH_DEBUG=1
```

This comprehensive deployment guide covers production-ready setup with security, monitoring, and maintenance procedures for the Script Distribution Server.
