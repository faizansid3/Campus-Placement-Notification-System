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


---

# STAGE-3

Query Optimization and Performance

According to the scenario-
the database contains :
-50,000 students,
-50,00,000 notifications.

which is a huge amount of data.

The following query is being used to fetch unread notifications:

```sql
SELECT * FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at ASC;
```

Lets answer each question systematically-

# IS IT ACCURATE?
Technically YES, the query would fetch the unread notifications ordered by creation time.
BUT, this query is not optimized .

# WHY IS IT SLOW?
Since the data is so large , with so many rows , after the query hits-

There will be a full table scan that is O(N) where N being the number of rows in the database, since, there is no indexing .
- Expensive.

# COST
Since ,the query mentions sorting in ASC , even sorting a large db is very costly.

# LIMIT
There is not limit clause , 
if a student has many unread notifications , all of them will be fetched will will increase the cost , and increase the response time .

# SELECT * 
He did select * , basically checking every columns in the notifications table , some could have been un necessary

 Optimized Query

```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 20
```

# BETTER HOW?
Improvements:
- Fetches only required columns
- Limits response size
- Better API response time



A composite index can significantly improve this query.

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at DESC);
```

---

# Why This Index Helps

The query:
- filters using `student_id`
- filters using `is_read`
- sorts using `created_at`

# Computational Cost

Without indexes:
- Time complexity is close to O(n)
- Database scan millions of rows

With proper composite indexing:
- Query performance improves significantly
- Matching rows can be found much faster using index traversal

---


# should indexes be added at every columns ?

No, adding at each column is bad .

Although indexing reduces the time complexity it has fair trade-off: 

- Indexes consume addition disc space.
- whenever a new row ./data is added to the DB , it would be added to the columns and their respective indexes as well 
- In this case, since notification has to be send to many users at once , so it needs to be faster and if indexing is at every column then it will be very slow as creation and updation time will increase.


# Better way for indexing-

- should be added to columns which are frequently used .
- sorting /join columns

# Query to Find Students Who Received Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notificationType = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

(my schema contained 'type' as column)

# Additional improvements :
Redis caching
pagination

--- 

# STAGE 4.
DB optimization strategies

# THE PROBLEM :
this is a very common problem, while building the MVP the website or system being basic always has this which is that on every frontend api call to fetch notification ,it asks the DB and displays and on refresh it again asks the server or DB

- bad response time
- server load(since many users can be active and maybe refershing at the same time)
- heavy traffic 
- BAD UX

# SOLUTIONS- 

# (PAGINATION)
- A very simple user experience friendly optimization is PAGINATION, it would not fetch all the x many records from the DB, only the what the limit is given for example -10 on page=1.
(basically in batches because the user does not want to see all the notifications at once right.)

-Faster API response
-Reduce db query size
-better UX as faster frontend response

# TRADE-OFFS :
- it gets slower if the page number increases basically if the page=10000 and you set the LIMIT to 10, still it will find and count till 10000th row just to get the 10001st row , increasing query time.

# Real time notification using SOCKET.IO

- instead of constant polling to check for updates , socket.io is used so that whenever there are updates in DB, it automatically renders them .
# Trade-off
Maintaining persistent socket connections increases backend complexity and memory usage.


# REDIS Caching

Caching  - used to cache or locally store the frequently accessed data so that the frontend does not have to request the DB(server) everytime.

for eg:- 
-latest notifications.
-unread count.
-tracking if user is logged-in

- Faster response times
- Reduces database load

# trade-off
everytime you update something inside your DB , it has to be updated inside the REDIS as well because RACE conditions can happen.Basically keeping them in sync, writing twice : once in DB and once in Redis is a little complex 


# Laze Loading :
Notifications should be loaded only when user scrolls to the botttom, basicallt when needed instead of rendering large data immediately.

- Reduces frontend rendering overhead
- Smaller API responses

# Tradeoff

implementation is kind of complex.


# 5. Database Index Optimization

Proper indexes should continue to be maintained on:
- student_id
- is_read

This improves notification retrieval speed.

### Tradeoff

Additional indexes increase storage usage and slightly slow down insert operations.

---

# CONCLUSION

Using:
- caching
- pagination
- real-time communication
- optimized queries
can  significantly improve both system performance and UX while reducing traffic on the database 

----


# STAGE 5.

The current implementation processes notifications sequentially for every student.
```python
for student_id in student_ids:
    send_email(student_id, message)
    save_to_db(student_id, message)
    push_to_app(student_id, message)
```

works for small data but not when you have to send for 50K students all together.

# Problems in Current Implementation

## 1. Sequential Processing

Each operation is executed one after another.

This significantly increases total processing time for large notification batches.

---

## 2. Third Party dependency

Since SMTP or any other third party api would be used : 
unreliable
can timeout
server error.

affects the whole notification flow.

## 3. No retry mechanism
If email delivery fails midway, notifications may never reach some students.
The current implementation has no retry handling.

----


# RECOMMENDED DESIGN 

The notification system should always be a asynchronous job since an email taking a large amount of time can slow down/starve the other emails which is bad performance.

# Worflow

```
    HR click 'SEND ALL"
    - >
    Notification data saved to DB
    - >
    Notification jobs added to a queue
    - >
    Worker would process the job asynchronously
    - >
    Email sent + real time notification(socket.io)
```
---

# DB FIRST?

Since DB is the main storage, source of TRUTH :
if you send the email first and it fails to send , it is lost forever even if you try to retry and send it back , since it was never stored inside the DB ,you cannot find it .

# QUEUE system

Workers process the jobs that is sending emails, pushing them to the queue,and the emails which fail are pushed back to the queue.
more the workers more jobs/emails are done simultaneously/

# Benefits of Queue System

- Faster API response
- Better scalability
- Retry support

# Retry Mechanism

Failed email jobs should automatically retry after a delay.

Example:
- retry after 30 seconds
- maximum 3 retry attempts


# Revised Pseudocode


```python
function notfiy_all(student_ids, message):

    for student_id in student_ids:

        save_to_db(student_id, message)

        add_job_to_queue({
            student_id,
            message
        }) 
    worker_process(job):
            try:
                send_email(job.student_id, job.message)

                push_to_app(job.student_id, job.message)

            except Exception:
                retry_job(job)

```

# Should DB Save and Email Sending Happen Together?

No, they should be separated.

Reason:
- Database operations are critical
- Email delivery is asynchronous and unreliable

Separating them improves:
- reliability
- fault tolerance


---

The original implementation is slow and unreliable for large-scale notification delivery.

Using:
- asynchronous queues
- background workers
- retries
creates a more scalable and fault-tolerant notification system.