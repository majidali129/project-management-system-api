# Advanced NestJS Assignment – Project Management System API

## Objective

Build a production-style REST API using NestJS, MongoDB, JWT Authentication, Role-Based Authorization, File Uploads, Pagination, Validation, and API Documentation.

This assignment is intentionally more advanced than the Task Management API and is designed to strengthen real-world backend development skills using NestJS.

---

## Tech Stack Requirements

- NestJS
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Class Validator
- Swagger / OpenAPI
- File Uploads
- Environment Variables
- Git + GitHub

---

## Project Title

### Project Management System API

A backend system where:

- Users can register / login
- Admins can manage all users and projects
- Users can create projects
- Projects can contain tasks
- Tasks can have comments and attachments
- APIs support pagination, filtering, and searching

---

## Required Folder Structure

```
src/
│
├── auth/
├── users/
├── projects/
├── tasks/
├── comments/
├── uploads/
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
│
├── config/
├── database/
└── main.ts
```

---

## Features & Requirements

### 1. Authentication Module

#### Endpoints

| Method | Endpoint       | Description               |
| ------ | -------------- | ------------------------- |
| POST   | `/auth/signup` | Register new user         |
| POST   | `/auth/login`  | Login user and return JWT |

#### User Schema

```ts
{
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  avatar?: string;
}
```

#### Validation Rules

- `name` — required
- `email` — valid email format
- `password` — minimum 8 characters
- `role` — enum validation

---

### 2. Role-Based Authorization

Implement:

- Admin role
- User role

Use:

- Custom decorators
- Guards
- Metadata reflection

Examples:

- Only admin can delete users
- Only project owner or admin can update a project

---

### 3. Projects Module

#### Project Schema

```ts
{
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  ownerId: ObjectId;
  members: ObjectId[];
}
```

#### Endpoints

| Method | Endpoint                | Description        |
| ------ | ----------------------- | ------------------ |
| POST   | `/projects`             | Create project     |
| GET    | `/projects`             | Get all projects   |
| GET    | `/projects/:id`         | Get single project |
| PATCH  | `/projects/:id`         | Update project     |
| DELETE | `/projects/:id`         | Delete project     |
| POST   | `/projects/:id/members` | Add member         |

---

### 4. Tasks Module

#### Task Schema

```ts
{
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: Date;
  assignedTo: ObjectId;
  projectId: ObjectId;
}
```

#### Requirements

- Only project members can create tasks
- Support filtering by `status` and `priority`
- Support pagination
- Support sorting

#### Example Query

```
GET /tasks?page=1&limit=10&status=done&sort=desc
```

---

### 5. Comments Module

#### Comment Schema

```ts
{
  content: string;
  taskId: ObjectId;
  userId: ObjectId;
}
```

#### Endpoints

- Add comment
- Get task comments
- Delete own comment

---

### 6. File Uploads

Users can upload:

- Profile avatar
- Task attachments

#### Requirements

- Use Multer
- Validate file type
- Validate file size
- Store uploaded files online

---

### 7. Pagination & Search

Implement reusable pagination:

```
GET /projects?page=1&limit=5
```

Implement search:

```
GET /projects?search=nestjs
```

---

### 8. Global Exception Handling

Create:

- Custom exception filter
- Standardized API response format

#### Example Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

### 9. API Documentation

Use Swagger / OpenAPI.

#### Requirements

- Group endpoints by module
- Add bearer authentication
- Add request and response examples
- Add endpoint descriptions

#### Swagger Route

```
/api
```

---

### 10. Security Requirements

Must implement:

- Password hashing
- JWT expiration
- Protected routes
- Validation pipes
- CORS
- Environment variables
- Secure DTO validation

---

### 11. Bonus Features (Optional)

- Refresh Tokens
- Email Verification
- Docker Setup
- Unit Testing
- Redis Caching
- WebSockets Notifications

---

## Required DTO Validation

Examples to use across DTOs:

```ts
@IsEmail()
@MinLength(8)
@IsEnum()
@IsMongoId()
@IsOptional()
@IsDateString()
```

---

## Evaluation Criteria

| Area                           | Marks |
| ------------------------------ | ----- |
| Clean Architecture             | 20    |
| Authentication & Authorization | 20    |
| CRUD Functionality             | 20    |
| Validation & Error Handling    | 15    |
| MongoDB Relationships          | 10    |
| Swagger Documentation          | 10    |
| Code Quality                   | 5     |

---

## Submission Requirements

Submit:

- GitHub Repository
- `README.md`
- `.env.example`
- Swagger Screenshots
- API Documentation
- Database Schema Explanation

---

## README Must Include

- Setup steps
- Environment variables
- API base URL
- Swagger URL
- Authentication instructions
- Sample requests
- Folder structure

---

## Deadline Recommendation

Recommended completion time: **2–3 days**

---

## Learning Goals

By completing this assignment, you should understand:

- Modular NestJS architecture
- Advanced authentication systems
- Role-based access control
- MongoDB relationships
- Production-grade validation
- File handling
- Pagination and filtering
- Clean backend architecture
- API documentation standards
