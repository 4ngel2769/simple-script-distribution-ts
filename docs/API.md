# API Documentation

This document outlines the REST API endpoints for the Script Distribution Server.

## Authentication

Most API endpoints require authentication using NextAuth.js session cookies. To authenticate:

1. Login through the `/login` page
2. API requests will use the session cookie automatically

## Script Access (Public)

### Get Raw Script Content

```http
GET /{script-name}
```

**Description:** Serves raw script content directly at the root level for easy curl access.

**Examples:**
```bash
curl http://localhost:3000/docker-install
curl -fsSL http://localhost:3000/pi | sudo bash
```

**Response:**
- For local scripts: Raw script content with `Content-Type: text/plain`
- For redirect scripts: HTTP 302 redirect to the target URL

**Error Response:**
```json
{
  "error": "Script not found"
}
```

**Note:** Reserved names (`admin`, `login`, `api`, `health`, etc.) cannot be used as script names.

### Legacy Raw Script Access

```http
GET /api/raw/{name}
```

**Description:** Legacy endpoint for raw script access (still supported).

## Scripts Management (Admin)

### Get All Scripts

```http
GET /api/scripts
```

**Response:**
```json
[
  {
    "name": "docker-install",
    "description": "Install Docker CE",
    "icon": "🐳",
    "type": "local",
    "mode": "managed",
    "scriptPath": "scripts/docker-install/docker-install.sh",
    "createdAt": "2025-09-19T12:00:00.000Z",
    "updatedAt": "2025-09-19T12:00:00.000Z"
  },
  {
    "name": "tor",
    "description": "Tor installer (auto-updated)",
    "icon": "🕸️",
    "type": "local",
    "mode": "unmanaged",
    "folderPath": "tor",
    "createdAt": "2025-09-19T12:30:00.000Z",
    "updatedAt": "2025-09-19T12:30:00.000Z"
  },
  {
    "name": "github-runner",
    "description": "Install GitHub Actions Runner",
    "icon": "🏃",
    "type": "redirect",
    "redirectUrl": "https://example.com/github-runner.sh",
    "createdAt": "2025-09-19T12:45:00.000Z",
    "updatedAt": "2025-09-19T12:45:00.000Z"
  }
]
```

### Create Script

```http
POST /api/scripts
Content-Type: application/json

{
  "name": "docker install",
  "description": "Install Docker CE",
  "icon": "🐳",
  "type": "local",
  "mode": "managed"
}
```

**Script Types:**
- **local + managed**: Script content managed via web UI
- **local + unmanaged**: Script content from newest .sh file in specified folder
- **redirect**: Redirects to external URL

**Response:**
```json
{
  "name": "docker-install",
  "description": "Install Docker CE",
  "icon": "🐳",
  "type": "local",
  "mode": "managed",
  "scriptPath": "scripts/docker-install/docker-install.sh",
  "createdAt": "2025-09-19T12:00:00.000Z",
  "updatedAt": "2025-09-19T12:00:00.000Z"
}
```

**Note:** Script names are automatically sanitized (spaces become hyphens, special characters removed).

### Get Script

```http
GET /api/scripts/{name}
```

**Response:**
```json
{
  "name": "docker-install",
  "description": "Install Docker CE",
  "icon": "🐳",
  "type": "local",
  "mode": "managed",
  "scriptPath": "scripts/docker-install/docker-install.sh",
  "createdAt": "2025-09-19T12:00:00.000Z",
  "updatedAt": "2025-09-19T12:00:00.000Z"
}
```

### Update Script

```http
PUT /api/scripts/{name}
Content-Type: application/json

{
  "description": "Updated description",
  "icon": "📦"
}
```

**Response:**
```json
{
  "name": "docker-install",
  "description": "Updated description",
  "icon": "📦",
  "type": "local",
  "mode": "managed",
  "scriptPath": "scripts/docker-install/docker-install.sh",
  "createdAt": "2025-09-19T12:00:00.000Z",
  "updatedAt": "2025-09-19T14:30:00.000Z"
}
```

### Delete Script

```http
DELETE /api/scripts/{name}
```

**Response:**
```json
{
  "success": true
}
```

## Script Content Management

### Get Script Content

```http
GET /api/scripts/{name}/content
```

**Response:**
```json
{
  "content": "#!/bin/bash\n\necho \"Hello World\"\n"
}
```

**Note:** For unmanaged scripts, this returns the content of the newest .sh file in the specified folder.

### Update Script Content (Managed Scripts Only)

```http
PUT /api/scripts/{name}/content
Content-Type: application/json

{
  "content": "#!/bin/bash\n\necho \"Updated content\"\n"
}
```

**Response:**
```json
{
  "success": true
}
```

**Note:** This endpoint only works for managed local scripts. Unmanaged scripts return an error as their content is managed through the file system.

## Folder Management

### List Folders

```http
GET /api/scripts/folders?path=subfolder
```

**Description:** Lists directories in the scripts folder for unmanaged script setup.

**Query Parameters:**
- `path` (optional): Relative path within scripts directory

**Response:**
```json
[
  {
    "name": "tor",
    "isDirectory": true,
    "path": "tor"
  },
  {
    "name": "docker",
    "isDirectory": true,
    "path": "docker"
  }
]
```

## Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.1",
  "timestamp": "2025-09-19T12:00:00.000Z"
}
```

## Error Responses

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Resource created successfully
- `400` - Bad request (invalid parameters, reserved name, etc.)
- `401` - Unauthorized (authentication required)
- `404` - Resource not found
- `500` - Server error

Error responses include a JSON body with an error message:

```json
{
  "error": "Detailed error message"
}
```

## Reserved Script Names

The following names are reserved and cannot be used for scripts:
- `admin`
- `login`
- `api`
- `health`
- `_next`
- `favicon.ico`
- `robots.txt`
- `sitemap.xml`

## Script Name Validation

Script names must:
- Be 2-50 characters long
- Contain only lowercase letters, numbers, hyphens, and underscores
- Not be a reserved name
- Be unique

Names are automatically sanitized during creation (spaces become hyphens, invalid characters removed).
