# Project Management System API

A production-ready RESTful API built with NestJS, TypeScript, MongoDB, and Mongoose for managing projects, tasks, and comments. The API implements JWT Authentication, Role-Based Access Control (RBAC), project-based permissions, task assignment workflows, filtering, searching, pagination, and complete OpenAPI/Swagger documentation.

---

## Features

### Authentication & Authorization

- JWT-based authentication
- Secure login and logout
- Role-Based Access Control (RBAC)
- Roles:
  - `admin`
  - `user`

### Project Management

- Create projects
- Update project information
- Delete projects
- Archive or activate projects
- Manage project members
- View project details
- Project ownership controls

### Task Management

- Create tasks within projects
- Update task details
- Delete tasks
- Assign tasks to project members
- Unassign tasks
- Track task status
- Track task priority
- Add attachement to task

### Comments System

- Create comments on tasks
- View comments
- Update comments
- Delete comments
- Ownership-based comment permissions

### Advanced Querying

- Pagination
- Search
- Filtering
- Sorting

Supported task filters:

- Status
- Priority
- Assigned User

Supported sorting:

- Created Date
- Due Date
- Any supported task field

### API Documentation

- OpenAPI 3.0 Specification
- Interactive Swagger UI
- Request and response examples
- Error response documentation

---

## Folder Structure

```text
src/
├── auth/                 # Authentication and JWT strategies
├── users/                # User management
├── projects/             # Project management
├── tasks/                # Task management
├── comments/             # Comment management
├── uploads/             # File upload management
│
├── common/
│   ├── guards/           # Authorization guards
│   ├── decorators/       # Custom decorators
│   └── pipes/            # Validation pipes
│
├── config/               # Application configuration
├── database/             # Database configuration
└── main.ts               # Application bootstrap
```

---

## Tech Stack

- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Class Validator
- Swagger / OpenAPI

---

## Prerequisites

Before running the project, make sure you have installed:

- Node.js (v18 or later recommended)
- pnpm
- typescript

---

## Setup Steps

### 1. Clone Repository

```bash
git clone https://github.com/majidali129/project-management-system-api.git
cd project-management-system-api
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

DB_URI=mongodb://localhost:27017/project-management

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=2d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
DEFAULT_LIMIT=5
DEFAULT_PAGE=1
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

```

> Replace above values with your own configuration.

### 5. Run Application

Development mode:

```bash
pnpm run start:dev
```

Production build:

```bash
pnpm run build
pnpm run start:prod
```

---

## API Base URL

Local Development:

```text
http://localhost:3000
```

---

## Swagger Documentation

Once the server is running, access Swagger UI:

```text
http://localhost:3000/api
```

OpenAPI Specification:

```text
http://localhost:3000/api-docs-json
```

> Update URLs if your Swagger configuration uses different routes.

---

## Authentication Instructions

### Register

Endpoint:

```http
POST /auth/signup
```

Example Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret1234",
  "role": "user"
}
```

---

### Login

Endpoint:

```http
POST /auth/login
```

Example Request:

```json
{
  "email": "john@example.com",
  "password": "secret1234"
}
```

Successful response:

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "<jwt-token>",
  "refreshToken": "<refresh-token>"
}
```

---

### Using Protected Routes

Include the access token in the Authorization header:

```http
Authorization: Bearer <access-token>
```

Example:

```http
GET /projects
Authorization: Bearer eyJhbGciOi...
```

---

## Sample Requests

### Create Project

```http
POST /projects
Authorization: Bearer <token>
```

```json
{
  "title": "Implement User Authentication",
  "description": "Allow project owners to invite members and manage access."
}
```

---

### Get All Projects

```http
GET /projects
Authorization: Bearer <token>
```

---

### Create Task

```http
POST /projects/{projectId}/tasks
Authorization: Bearer <token>
```

```json
{
  "title": "Add Activity Logging",
  "description": "Track user actions",
  "priority": "high",
  "dueDate": "2026-04-05T00:00:00.000Z"
}
```

---

### Get Tasks With Filtering

```http
GET /projects/{projectId}/tasks?page=1&limit=5&status=todo&priority=high&sortBy=dueDate&sortOrder=asc
```

---

### Assign Task

```http
PATCH /projects/{projectId}/tasks/{taskId}/assign-task
```

```json
{
  "assigneeId": "userId",
  "projectId": "projectId"
}
```

---

### Create Comment

```http
POST /tasks/{taskId}/comments
```

```json
{
  "content": "Looks good, merging now."
}
```

---

## Roles & Permissions

### Admin

Can:

- Access all projects
- Manage all projects
- Manage all tasks
- Assign tasks
- Manage project members

### User

Can:

- Access projects they own
- Access projects where they are a member
- Create tasks within accessible projects
- Manage tasks they created or are assigned to
- Manage their own comments

---

## Error Responses

Common HTTP status codes used by the API:

| Status Code | Description        |
| ----------- | ------------------ |
| 200         | Success            |
| 201         | Resource Created   |
| 400         | Validation Error   |
| 401         | Unauthorized       |
| 403         | Forbidden          |
| 404         | Resource Not Found |
| 500         | Server Error       |

Example validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "email": ["Email must be a valid email address"]
  }
}
```

---

## API Modules

### Authentication

- Sign Up
- Login
- Logout
- Refresh Tokens

### Projects

- Create Project
- Get Projects
- Get Project Details
- Update Project
- Delete Project
- Toggle Status
- Add Members
- Get Members
- Remove Members

### Tasks

- Create Task
- Get Tasks
- Get Task Details
- Update Task
- Delete Task
- Assign Task
- Unassign Task
- Add attachment

### Comments

- Create Comment
- Get Comments
- Get Comment
- Update Comment
- Delete Comment
