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



--------------



# STAGE 2.

## DB Selection :-
selecting PostgreSQL as the primary DB for this system.

## REASONS:
-Relational DB.
-Supports strucured relational data.
-Efficient filtering and sorting
-Strong indexing support
-Reliable ACID compliance
Handles pagination queries efficiently

PostgreSQL handles these operations efficiently using indexes and optimized query planning.

# DB SCHEMAA-

## 1. students Table

Stores student information.

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## notifications table

Stores notifications sent to students.

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    student_id INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student
        FOREIGN KEY(student_id)
        REFERENCES students(id)
        ON DELETE CASCADE  (also removed from parent)
);
```
---


# Notification Type Values

The `types`:

- Placement
- Event
- Result

## DB relationships

one student many notification  (1->many)
each notification belongs to one student (1->1)

# Indexing Strategy

To improve query performance, indexes are added on frequently queried fields.

## Index on student_id

```sql
CREATE INDEX idx_notifications_student_id
ON notifications(student_id);
```

Used for:
- fetching notifications of a specific student

---

# Index on created_at

```sql
CREATE INDEX idx_notifications_created_at
ON notifications(created_at DESC);
```

Used for:
- sorting notifications by latest first

---


# Scalability Challenges

As the number of notifications grows, the following issues may occur:

- Slow unread notification queries
- Increased database read load
- Expensive sorting operations
- Higher response times during peak usage

# Scalability Improvements

## 1. Proper Indexing

Indexes reduce full table scans and improve filtering speed.

---

# 2. Pagination

Pagination reduces:
- response payload size
- database load
- reduces load on frontendd


## 5. Redis Caching

Frequently accessed unread notification counts can be cached using Redis.

This reduces repeated database reads.

---


# Example SQL Queries

## Fetch Notifications for a Student

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC
LIMIT 10;
```


## Fetch Unread Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 5;
```



## Mark Notification as Read

```sql
UPDATE notifications
SET is_read = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'notification-uuid';
```

---

## Delete Notification

```sql
DELETE FROM notifications
WHERE id = 'notification-uuid';
```



# Conclusion

The proposed PostgreSQL schema provides:

- structured relational storage
- efficient querying
- scalable notification retrieval
- optimized unread notification handling
- support for future scaling strategies

The schema is designed to work efficiently overall.
