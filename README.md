# Project Management System API

An advanced, production-grade RESTful API built with NestJS, MongoDB (Mongoose), and TypeScript. This system features robust JWT Authentication, Role-Based Access Control (RBAC), File Upload capabilities, dynamic pagination, filtering, searching, and complete OpenAPI/Swagger documentation.

---

## Table of Contents

1. [Features](#features)
2. [Folder Structure](#folder-structure)
3. [Prerequisites](#prerequisites)
4. [Setup Steps](#setup-steps)
5. [Environment Variables](#environment-variables)
6. [API Base URL & Swagger Documentation](#api-base-url--swagger-documentation)
7. [Authentication Instructions](#authentication-instructions)
8. [Sample Requests & Endpoints](#sample-requests--endpoints)
9. [Database Schema Overview](#database-schema-overview)

---

## Features

- **Modular Architecture:** Strictly follows NestJS design principles for highly decoupled modules.
- **Authentication & RBAC:** Custom guards and decorators utilizing metadata reflection to restrict access based on roles (`admin` vs. `user`) and resource ownership.
- **Advanced Querying:** Reusable pagination, multi-field filtering, and text-search implementation.
- **File Uploads:** Secure local storage handling for user avatars and task attachments using integrated Multer configuration and file type validation.
- **Global Resilience:** Centralized validation pipes (`class-validator`) paired with a custom unified global exception interceptor/filter.

---

## Folder Structure

The project conforms exactly to the required industry-standard feature-based domain module layout:

```text
src/
├── auth/                 # Authentication handlers (Sign up, Login, JWT strategies)
├── users/                # User profile management and database interactions
├── projects/             # Core project tracking domains and permissions
├── tasks/                # Granular task allocation, statuses, and priorities
├── comments/             # Collaborative discussion threads tied to specific tasks
├── uploads/              # Local storage configuration for profile images/attachments
│
├── common/               # Shared cross-cutting application concerns
│   ├── guards/           # Role-based and ownership verification guards
│   ├── decorators/       # Metadata annotations (e.g., @Roles, @CurrentUser)
│   ├── filters/          # Custom global error formatting interceptors
│   ├── interceptors/     # Unified API response mapping
│   └── pipes/            # Data transformers and strict validation pipelines
│
├── config/               # App and environment variable configuration schemas
├── database/             # Mongoose connection layer, hooks, and extensions
└── main.ts               # Application entrypoint & global configuration bootstrap
```
