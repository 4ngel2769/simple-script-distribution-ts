#!/bin/bash

# Script Distribution Server - Uninstallation Script
# Removes all files, containers, images, and services created by install.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

confirm() {
    read -p "$1 (y/N): " -n 1 -r < /dev/tty
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

main() {
    print_info "=== Script Distribution Server Uninstallation ==="
    echo

    # Confirm uninstall
    print_warning "This will stop and remove all Docker containers, images, volumes, and files for the Script Distribution Server."
    print_warning "It will also remove the systemd service and backup scripts if present."
    if ! confirm "Are you sure you want to continue?"; then
        print_info "Uninstallation cancelled."
        exit 0
    fi

    # Detect install directory
    DEFAULT_INSTALL_DIR="$HOME/script-server"
    read -p "Enter installation directory to remove [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR < /dev/tty
    INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}
    INSTALL_DIR="${INSTALL_DIR/#\~/$HOME}"

    if [ ! -d "$INSTALL_DIR" ]; then
        print_error "Directory $INSTALL_DIR does not exist."
        exit 1
    fi

    cd "$INSTALL_DIR"

    # List containers to be stopped/removed
    if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
        print_info "Detecting Docker containers managed by this project..."
        # Get project name as used by docker compose
        PROJECT_NAME=$(basename "$INSTALL_DIR" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_')
        # List containers for this compose project
        CONTAINERS=$(sudo docker compose ps -q 2>/dev/null || true)
        if [ -n "$CONTAINERS" ]; then
            print_info "The following containers will be stopped and removed:"
            sudo docker compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Service}}"
            if confirm "Proceed to stop and remove these containers?"; then
                sudo docker compose down
            else
                print_warning "Skipping container removal."
            fi
        else
            print_info "No running containers detected for this project."
        fi
    fi

    # Remove Docker images (optional)
    if confirm "Remove Docker images for script-server?"; then
        # Only remove images built from this directory's Dockerfile
        IMAGE_IDS=$(sudo docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep script-server | awk '{print $2}')
        if [ -n "$IMAGE_IDS" ]; then
            print_info "Removing Docker image(s):"
            sudo docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | grep script-server
            sudo docker rmi $IMAGE_IDS || true
        else
            print_info "No script-server Docker images found."
        fi
    fi

    # Remove systemd service if present
    if [ -f /etc/systemd/system/script-server.service ]; then
        if confirm "Remove systemd service (script-server.service)?"; then
            print_info "Disabling and removing systemd service..."
            sudo systemctl stop script-server.service || true
            sudo systemctl disable script-server.service || true
            sudo rm -f /etc/systemd/system/script-server.service
            sudo systemctl daemon-reload
        fi
    fi

    # Remove backup scripts and backups
    if [ -f "$INSTALL_DIR/backup.sh" ]; then
        if confirm "Remove backup script and backups?"; then
            rm -f "$INSTALL_DIR/backup.sh"
            BACKUP_DIR="$HOME/script-server-backups"
            if [ -d "$BACKUP_DIR" ]; then
                rm -rf "$BACKUP_DIR"
                print_info "Removed backup directory: $BACKUP_DIR"
            fi
        fi
    fi

    # Remove all files in install directory
    if confirm "Delete ALL files in $INSTALL_DIR? (This cannot be undone)"; then
        cd ..
        rm -rf "$INSTALL_DIR"
        print_success "Removed $INSTALL_DIR and all its contents."
    else
        print_info "Skipped deleting $INSTALL_DIR."
    fi

    print_success "Uninstallation complete."
}

main
