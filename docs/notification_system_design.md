# Stage1- 

NOTIFICATION SYSTEM DESIGN

# Overview

The Campus Notification System is designed to deliver real-time notifications to students about:

- Placements
- Events
- Results

The system supports:
- Notification retrieval
- Notification creation
- Read/unread tracking
- Filtering
- Pagination
- Real-time delivery

# Authentication

All APIs are protected routes.

## Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

# 1 .Fetching Notification

Returns notification for a specific user(student).
## Endpoint -
```http
GET /api/v1/notifications
```

## REquest example
```http
GET /api/v1/notifications?page=1&limit=10&type=Placement
```
## RESPONSE example

```json
{
    "success": true,
    "page": 1,
  "limit": 10,
  "total": 50,
  "notifications": [
    {
      "id": "uuid",
      "studentId": 1042,
      "type": "Placement",
      "message": "Amazon hiringg drive",
      "isRead": false,
      "createdAt": "the time"
    }
  ]
}
```

# 2. Create Notification

Creates new notification

## endpoint
```http
POST /api/v1/notifications
```

## Request Body

```json
{
  "studentId": 1042,
  "type": "Placement",
  "message": "Google hiring drive announced"
}
```
```json
{
    ```json
{
  "success": true,
  "message": "Notification created successfully",
  "notification": {
    "id": "uuid",
    "studentId": 1042,
    "type": "Placement",
    "message": "Google hiring drive announced",
    "isRead": false,
    "createdAt": "some time"
  }
}
```

# mark notification as read 
Marks notification as read.

## Endpoint

```http
PATCH /api/v1/notifications/:id/read
```

## Response

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

# 4. Delete Notification

Deletes a notification.

## Endpoint

```http
DELETE /api/v1/notifications/:id
```

---

## Response

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

# Error(if missing notification)

```json
{
  "success": false,
  "error": {
    "message": "Notification not found",
    "statusCode": 404
  }
}
```


# Real-Time Notification Design

The system uses Socket.IO over WebSockets for real-time notification delivery.

## Workflow

1. User connects to Socket.IO server after login.
2. Backend maintains active socket connections.
3. When notifcation created :
    - Notification stored in DB.
    - Notification event is started for that specif student.
4. Frontend instantly updates notification UI without refresh.

# Socket Events

## Client Connection

```javascript
socket.emit("join", {
  studentId: 1042
});

## Receive Notification

```javascript
socket.on("new_notification", (data) => {
  console.log(data);
});
```



# LOGGING MIDDLEWARE
Every API request will pass through centralized logging middleware.

The middleware logs:
-Request method
-API endpoint
-Response status

# Pagination 
easy implementation using 
'page'
'limit'

# Future Scalablity
Redis for caching 
Message queues for async floww
