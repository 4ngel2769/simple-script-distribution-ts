#!/bin/bash

# Script Distribution Server - Installation Script
# Installs and deploys the server using Docker on Linux

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "This script is running as root. This is not recommended."
        read -p "Do you want to continue? (y/N): " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "You can install Docker using: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Installing git..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y git
        elif command -v yum &> /dev/null; then
            sudo yum install -y git
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y git
        else
            print_error "Could not install git. Please install it manually."
            exit 1
        fi
    fi
    
    # Check if openssl is installed
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed. Installing openssl..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y openssl
        elif command -v yum &> /dev/null; then
            sudo yum install -y openssl
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y openssl
        else
            print_error "Could not install openssl. Please install it manually."
            exit 1
        fi
    fi
    
    print_success "System requirements check passed."
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 32
}

# Validate port number
validate_port() {
    local port=$1
    if [[ ! $port =~ ^[0-9]+$ ]] || [ $port -lt 1 ] || [ $port -gt 65535 ]; then
        print_error "Invalid port number: $port"
        return 1
    fi
    
    # Check if port is already in use
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_warning "Port $port is already in use."
        return 1
    fi
    
    return 0
}

# Validate URL format
validate_url() {
    local url=$1
    if [[ $url =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$ ]]; then
        return 0
    else
        print_error "Invalid URL format: $url"
        return 1
    fi
}

# Generate password hash
hash_password() {
    local password=$1
    python3 -c "
import bcrypt
import sys
password = sys.argv[1].encode('utf-8')
hash = bcrypt.hashpw(password, bcrypt.gensalt())
print(hash.decode('utf-8'))
" "$password" 2>/dev/null || {
        # Fallback if python3-bcrypt is not available
        echo "bcrypt not available, using openssl (less secure)"
        echo -n "$password" | openssl passwd -1 -stdin
    }
}

# Main installation function
main() {
    print_info "=== Script Distribution Server Installation ==="
    echo
    
    # Check if running as root
    check_root
    
    # Check system requirements
    check_requirements
    
    # Get installation directory
    echo
    print_info "Configuration Setup"
    echo
    DEFAULT_INSTALL_DIR="$HOME/script-server"
    read -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR < /dev/tty
    INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}
    
    # Expand tilde to home directory
    INSTALL_DIR="${INSTALL_DIR/#\~/$HOME}"
    
    # Create installation directory
    if [ ! -d "$INSTALL_DIR" ]; then
        print_info "Creating installation directory: $INSTALL_DIR"
        mkdir -p "$INSTALL_DIR"
    fi
    
    # Get admin username
    read -p "Admin username [admin]: " ADMIN_USERNAME < /dev/tty
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    
    # Get admin password
    while true; do
        read -s -p "Admin password (leave empty for 'admin123'): " ADMIN_PASSWORD
        echo
        if [ -z "$ADMIN_PASSWORD" ]; then
            ADMIN_PASSWORD="admin123"
            print_warning "Using default password 'admin123'. Please change this after installation!"
            break
        elif [ ${#ADMIN_PASSWORD} -lt 8 ]; then
            print_error "Password must be at least 8 characters long."
        else
            read -s -p "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
            echo
            if [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD_CONFIRM" ]; then
                break
            else
                print_error "Passwords do not match. Please try again."
            fi
        fi
    done
    
    # Get host port
    while true; do
        read -p "Host port [3000]: " HOST_PORT < /dev/tty
        HOST_PORT=${HOST_PORT:-3000}
        if validate_port "$HOST_PORT"; then
            break
        fi
        print_error "Please choose a different port."
    done
    
    # Get external URL
    while true; do
        read -p "External URL [http://localhost:$HOST_PORT]: " EXTERNAL_URL < /dev/tty
        EXTERNAL_URL=${EXTERNAL_URL:-http://localhost:$HOST_PORT}
        if validate_url "$EXTERNAL_URL"; then
            break
        fi
        print_error "Please enter a valid URL (e.g., https://scripts.yourdomain.com)"
    done
    
    # Clone repository
    print_info "Cloning Script Distribution Server repository..."
    cd "$INSTALL_DIR"
    
    if [ -d ".git" ]; then
        print_info "Repository already exists, pulling latest changes..."
        git pull origin main
    else
        git clone https://github.com/yourusername/simple-script-distribution-ts.git .
    fi
    
    # Generate secrets
    print_info "Generating secure secrets..."
    NEXTAUTH_SECRET=$(generate_secret)
    
    # Hash admin password
    print_info "Hashing admin password..."
    
    # Check if python3-bcrypt is available, install if not
    if ! python3 -c "import bcrypt" 2>/dev/null; then
        print_info "Installing python3-bcrypt for password hashing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y python3-bcrypt
        elif command -v yum &> /dev/null; then
            sudo yum install -y python3-bcrypt
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y python3-bcrypt
        elif command -v pip3 &> /dev/null; then
            pip3 install bcrypt
        else
            print_warning "Could not install bcrypt, using less secure fallback"
        fi
    fi
    
    ADMIN_PASSWORD_HASH=$(hash_password "$ADMIN_PASSWORD")
    
    # Create .env file
    print_info "Creating environment configuration..."
    cat > .env << EOF
# Next Auth Configuration
NEXTAUTH_URL=$EXTERNAL_URL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Script Configuration
CONFIG_PATH=/app/data/config.json
SCRIPTS_DIR=/app/scripts

# Server Configuration
PORT=3000
HOST_PORT=$HOST_PORT
NODE_ENV=production
EOF
    
    # Create data directory
    mkdir -p data scripts
    chmod 755 data scripts
    
    # Create initial config.json
    print_info "Creating initial configuration..."
    cat > data/config.json << EOF
{
  "admin": {
    "username": "$ADMIN_USERNAME",
    "passwordHash": "$ADMIN_PASSWORD_HASH"
  },
  "scripts": []
}
EOF
    
    # Set proper permissions
    chmod 600 data/config.json
    
    # Create example scripts folder structure
    mkdir -p scripts/examples
    cat > scripts/examples/hello-world.sh << 'EOF'
#!/bin/bash
echo "Hello World from Script Distribution Server!"
echo "This is an example script."
echo "Edit this file or create new ones in the admin panel."
EOF
    chmod +x scripts/examples/hello-world.sh
    
    # Build and start containers
    print_info "Building and starting Docker containers..."
    
    # Stop existing containers if running
    if sudo docker compose ps | grep -q "script-server"; then
        print_info "Stopping existing containers..."
        sudo docker compose down
    fi
    
    # Build and start
    sudo docker compose up -d --build
    
    # Wait for container to be ready
    print_info "Waiting for server to start..."
    sleep 10
    
    # Check if container is running
    if sudo docker compose ps | grep -q "Up"; then
        print_success "Script Distribution Server installed successfully!"
        echo
        print_info "=== Installation Summary ==="
        print_info "Installation Directory: $INSTALL_DIR"
        print_info "Admin Username: $ADMIN_USERNAME"
        print_info "Host Port: $HOST_PORT"
        print_info "External URL: $EXTERNAL_URL"
        echo
        print_info "=== Access Information ==="
        print_info "Main Page: $EXTERNAL_URL"
        print_info "Admin Panel: $EXTERNAL_URL/admin"
        print_info "Health Check: $EXTERNAL_URL/api/health"
        echo
        print_info "=== Docker Commands ==="
        print_info "View logs: sudo docker compose logs -f"
        print_info "Stop server: sudo docker compose down"
        print_info "Start server: sudo docker compose up -d"
        print_info "Restart server: sudo docker compose restart"
        echo
        print_info "=== Next Steps ==="
        print_info "1. Access the admin panel at $EXTERNAL_URL/admin"
        print_info "2. Login with username: $ADMIN_USERNAME"
        print_info "3. Create your first script"
        print_info "4. Test script access: curl $EXTERNAL_URL/script-name"
        echo
        if [ "$EXTERNAL_URL" = "http://localhost:$HOST_PORT" ]; then
            print_warning "You're using localhost. For external access, update NEXTAUTH_URL in .env"
            print_warning "and restart with: sudo docker compose up -d"
        fi
        echo
        print_success "Installation complete!"
        
        # Test health endpoint
        sleep 5
        if curl -s "$EXTERNAL_URL/api/health" >/dev/null; then
            print_success "Health check passed - server is responding!"
        else
            print_warning "Health check failed - server might still be starting up"
            print_info "Check logs with: sudo docker compose logs -f"
        fi
        
    else
        print_error "Failed to start containers. Check logs with: sudo docker compose logs"
        exit 1
    fi
}

# Create systemd service (optional)
create_systemd_service() {
    read -p "Create systemd service for auto-start on boot? (y/N): " -n 1 -r < /dev/tty
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Creating systemd service..."
        
        sudo tee /etc/systemd/system/script-server.service > /dev/null << EOF
[Unit]
Description=Script Distribution Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable script-server.service
        print_success "Systemd service created and enabled!"
        print_info "You can now use:"
        print_info "  sudo systemctl start script-server"
        print_info "  sudo systemctl stop script-server"
        print_info "  sudo systemctl status script-server"
    fi
}

# Create backup script
create_backup_script() {
    read -p "Create backup script? (y/N): " -n 1 -r < /dev/tty
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Creating backup script..."
        
        cat > "$INSTALL_DIR/backup.sh" << 'EOF'
#!/bin/bash
# Backup script for Script Distribution Server

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$HOME/script-server-backups"
INSTALL_DIR=$(dirname "$0")

mkdir -p "$BACKUP_DIR"

# Backup data and scripts
tar -czf "$BACKUP_DIR/script-server-backup-$DATE.tar.gz" \
    -C "$INSTALL_DIR" \
    data scripts .env

echo "Backup created: $BACKUP_DIR/script-server-backup-$DATE.tar.gz"

# Keep only last 10 backups
cd "$BACKUP_DIR"
ls -t script-server-backup-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "Backup completed successfully!"
EOF
        
        chmod +x "$INSTALL_DIR/backup.sh"
        print_success "Backup script created at $INSTALL_DIR/backup.sh"
        print_info "Run with: $INSTALL_DIR/backup.sh"
    fi
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Installation failed!"
        print_info "Check the error messages above for details."
        print_info "You can try running the script again or install manually."
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Run main installation
main

# Optional services
echo
create_systemd_service
create_backup_script

print_success "All done! Your Script Distribution Server is ready to use."