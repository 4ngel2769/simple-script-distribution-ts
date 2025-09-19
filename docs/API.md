# API Documentation

This document outlines the REST API endpoints for the Script Distribution Server.

## Authentication

Most API endpoints require authentication using NextAuth.js session cookies. To authenticate:

1. Login through the `/login` page
2. API requests will use the session cookie automatically

## Scripts Management

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
    "scriptPath": "/app/scripts/docker-install/docker-install.sh",
    "createdAt": "2023-11-15T12:00:00.000Z",
    "updatedAt": "2023-11-15T12:00:00.000Z"
  },
  {
    "name": "github-runner",
    "description": "Install GitHub Actions Runner",
    "icon": "🏃",
    "type": "redirect",
    "redirectUrl": "https://example.com/github-runner.sh",
    "createdAt": "2023-11-15T12:30:00.000Z",
    "updatedAt": "2023-11-15T12:30:00.000Z"
  }
]
```

### Create Script

```http
POST /api/scripts
Content-Type: application/json

{
  "name": "docker-install",
  "description": "Install Docker CE",
  "icon": "🐳",
  "type": "local"
}
```

**Response:**
```json
{
  "name": "docker-install",
  "description": "Install Docker CE",
  "icon": "🐳",
  "type": "local",
  "scriptPath": "/app/scripts/docker-install/docker-install.sh",
  "createdAt": "2023-11-15T12:00:00.000Z",
  "updatedAt": "2023-11-15T12:00:00.000Z"
}
```

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
  "scriptPath": "/app/scripts/docker-install/docker-install.sh",
  "createdAt": "2023-11-15T12:00:00.000Z",
  "updatedAt": "2023-11-15T12:00:00.000Z"
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
  "scriptPath": "/app/scripts/docker-install/docker-install.sh",
  "createdAt": "2023-11-15T12:00:00.000Z",
  "updatedAt": "2023-11-15T14:30:00.000Z"
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

### Update Script Content

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

## Raw Script Access

### Get Raw Script

```http
GET /api/raw/{name}
```

**Response:**
```
#!/bin/bash

echo "Hello World"
```

This endpoint returns the raw script content with Content-Type: text/plain or redirects to an external URL if the script type is "redirect".

## Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2023-11-15T12:00:00.000Z"
}
```

## Error Responses

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Resource created successfully
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Resource not found
- `500` - Server error

Error responses include a JSON body with an error message:

```json
{
  "error": "Detailed error message"
}
```
