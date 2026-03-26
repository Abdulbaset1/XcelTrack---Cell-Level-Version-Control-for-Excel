# XcelTrack Backend API Documentation

## Overview

XcelTrack backend provides a comprehensive REST API for managing Excel workbooks with version control, real-time collaboration, and administrative features.

**Base URL**: `http://localhost:5000/api`

**Authentication**: Firebase Authentication tokens required for most endpoints

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes  
- **OTP Requests**: 3 requests per 15 minutes
- **File Uploads**: 10 requests per hour
- **Admin Operations**: 50 requests per 15 minutes
- **Commits**: 30 requests per 15 minutes

## Authentication Endpoints

### Send OTP
Send verification code to user's email.

```http
POST /send-otp
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "message": "OTP sent successfully"
}
```

**Rate Limit**: 3 requests per 15 minutes

---

### Verify OTP
Verify the OTP code sent to user's email.

```http
POST /verify-otp
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "message": "OTP verified successfully"
}
```

**Rate Limit**: 3 requests per 15 minutes

---

### Sync User
Sync Firebase user with PostgreSQL database.

```http
POST /sync-user
```

**Request Body**:
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "user": {
    "firebase_uid": "firebase_uid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

## User Endpoints

### Get User Role
Retrieve user's role from database.

```http
GET /user-role/:uid
```

**Response**:
```json
{
  "role": "user"
}
```

---

### Get All Users
Retrieve all users (admin only).

```http
GET /users
```

**Response**:
```json
[
  {
    "firebase_uid": "uid1",
    "email": "user1@example.com",
    "name": "User One",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## Workbook Endpoints

### Upload Workbook
Upload an Excel file and create a new workbook.

```http
POST /workbooks/upload
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: Excel file (.xlsx, .xls)
- `owner_id`: Firebase UID of the owner
- `owner_name`: Name of the owner

**Response**:
```json
{
  "message": "Workbook uploaded and initialized successfully",
  "workbook": {
    "id": 1,
    "name": "example.xlsx",
    "owner_id": "firebase_uid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "stats": {
    "totalSheets": 3,
    "totalCells": 1500
  }
}
```

**Rate Limit**: 10 requests per hour

**File Limits**:
- Maximum file size: 50MB
- Supported formats: .xlsx, .xls

---

### Get User's Workbooks
Retrieve all workbooks owned by a user.

```http
GET /workbooks?owner_id=firebase_uid
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "example.xlsx",
    "owner_id": "firebase_uid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Cache**: 2 minutes

---

### Get Workbook Details
Retrieve full workbook data including all worksheets and cells.

```http
GET /workbooks/:id
```

**Response**:
```json
{
  "id": "1",
  "name": "example.xlsx",
  "appVersion": "3.0.0",
  "sheets": {
    "1": {
      "id": "1",
      "name": "Sheet1",
      "cellData": {
        "0": {
          "0": { "v": "Hello" },
          "1": { "v": "World" }
        }
      },
      "rowCount": 1000,
      "columnCount": 26
    }
  },
  "sheetOrder": ["1"],
  "styles": {}
}
```

---

## Version Control Endpoints

### Create Commit
Create a snapshot of the current workbook state.

```http
POST /commits
```

**Request Body**:
```json
{
  "workbook_id": 1,
  "user_id": "firebase_uid",
  "message": "Updated sales data"
}
```

**Response**:
```json
{
  "commit": {
    "id": 1,
    "workbook_id": 1,
    "user_id": "firebase_uid",
    "message": "Updated sales data",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "hash": "abc123..."
  },
  "cells_snapshotted": 150
}
```

**Rate Limit**: 30 requests per 15 minutes

---

### Get Commit History
Retrieve commit history for a workbook.

```http
GET /workbooks/:id/commits?limit=50&offset=0
```

**Response**:
```json
{
  "commits": [
    {
      "id": 1,
      "message": "Updated sales data",
      "user_id": "firebase_uid",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "hash": "abc123...",
      "changes_count": 150
    }
  ]
}
```

---

### Get Commit Details
Retrieve detailed information about a specific commit.

```http
GET /commits/:id
```

**Response**:
```json
{
  "commit": {
    "id": 1,
    "workbook_id": 1,
    "user_id": "firebase_uid",
    "message": "Updated sales data",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "hash": "abc123..."
  },
  "changes": [
    {
      "id": 1,
      "cell_id": 1,
      "value": "100",
      "formula": null,
      "style": {},
      "address": "A1",
      "row_idx": 0,
      "col_idx": 0,
      "worksheet_name": "Sheet1"
    }
  ]
}
```

---

### Rollback Workbook
Rollback workbook to a previous commit state.

```http
POST /workbooks/:id/rollback
```

**Request Body**:
```json
{
  "commit_id": 5,
  "user_id": "firebase_uid"
}
```

**Response**:
```json
{
  "message": "Rollback successful",
  "new_commit": {
    "id": 10,
    "message": "Rolled back to commit 5",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "cells_restored": 150
}
```

---

## Admin Endpoints

All admin endpoints require admin role.

### Create User
Create a new user (admin only).

```http
POST /admin/users
```

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User",
  "role": "user"
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "user": {
    "firebase_uid": "new_uid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user"
  }
}
```

**Rate Limit**: 50 requests per 15 minutes

---

### Update User
Update user information (admin only).

```http
PUT /admin/users/:uid
```

**Request Body**:
```json
{
  "email": "updated@example.com",
  "name": "Updated Name",
  "role": "admin"
}
```

**Response**:
```json
{
  "message": "User updated successfully",
  "user": {
    "firebase_uid": "uid",
    "email": "updated@example.com",
    "name": "Updated Name",
    "role": "admin"
  }
}
```

**Rate Limit**: 50 requests per 15 minutes

---

### Delete User
Delete a user (admin only).

```http
DELETE /admin/users/:uid
```

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

**Rate Limit**: 50 requests per 15 minutes

---

## WebSocket Events

### Connection
Connect to WebSocket server for real-time collaboration.

```javascript
const socket = io('http://localhost:5000');
```

### Join Workbook
Join a workbook room for collaboration.

**Emit**:
```javascript
socket.emit('join-workbook', {
  workbookId: 1,
  userId: 'firebase_uid',
  userName: 'John Doe'
});
```

**Listen**:
```javascript
socket.on('user-joined', (userInfo) => {
  // { socketId, userId, userName, color }
});

socket.on('current-users', (users) => {
  // Array of current users in the workbook
});
```

---

### Leave Workbook
Leave a workbook room.

**Emit**:
```javascript
socket.emit('leave-workbook', {
  workbookId: 1,
  userId: 'firebase_uid'
});
```

**Listen**:
```javascript
socket.on('user-left', ({ socketId, userId }) => {
  // User left the workbook
});
```

---

### Cursor Movement
Broadcast cursor position to other users.

**Emit**:
```javascript
socket.emit('cursor-move', {
  workbookId: 1,
  position: { row: 5, col: 3, worksheetId: '1' }
});
```

**Listen**:
```javascript
socket.on('cursor-update', ({ socketId, position }) => {
  // Update other user's cursor position
});
```

---

### Cell Selection
Broadcast cell selection to other users.

**Emit**:
```javascript
socket.emit('cell-select', {
  workbookId: 1,
  selection: {
    startRow: 0,
    startCol: 0,
    endRow: 5,
    endCol: 3,
    worksheetId: '1'
  }
});
```

**Listen**:
```javascript
socket.on('cell-selection-update', ({ socketId, selection }) => {
  // Update other user's cell selection
});
```

---

### Cell Edit
Broadcast cell edits to other users.

**Emit**:
```javascript
socket.emit('cell-edit', {
  workbookId: 1,
  cellData: {
    row: 0,
    col: 0,
    value: 'New Value',
    formula: null,
    worksheetId: '1'
  }
});
```

**Listen**:
```javascript
socket.on('cell-changed', ({ socketId, cellData }) => {
  // Update cell with new data
});
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Caching

The following endpoints use Redis caching:

- **User Data**: 5 minutes TTL
- **User Workbooks**: 2 minutes TTL
- **User Role**: 5 minutes TTL

Cache is automatically invalidated when:
- User data is updated
- Workbooks are created/updated
- Commits are created

---

## Performance Optimizations

1. **Database Indexing**: All frequently queried columns are indexed
2. **Connection Pooling**: PostgreSQL pool with 5-20 connections
3. **Redis Caching**: Frequently accessed data cached
4. **Batch Processing**: Large file uploads processed in chunks
5. **Rate Limiting**: Prevents API abuse
6. **Structured Logging**: Winston logger with daily rotation

---

## Security

1. **Helmet**: Security headers enabled
2. **CORS**: Configured for client origin
3. **Rate Limiting**: IP-based throttling
4. **Input Validation**: All inputs validated
5. **Firebase Auth**: Secure authentication
6. **SQL Injection Prevention**: Parameterized queries
