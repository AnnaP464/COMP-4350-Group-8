# HiveHand Backend Architecture & Dependency Injection Guide

This document explains the backend architecture, layer responsibilities, and how dependency injection and composition roots are used.  

---

## Architecture Overview

**Request Flow**

HTTP -> Middleware -> Controller -> Service -> Repository -> Database

Each layer has a single, clear responsibility. Dependencies only flow *downward*.

---

## Layer Responsibilities

### **Routes**
- Define endpoints and attach middleware + controller handlers.  
- Contain **no business logic** or DB access.  
- Represent the app’s HTTP interface.

### **Middleware**
- Handle cross-cutting concerns (auth, validation, error formatting, logging).  
- Can attach context to `req` (e.g. `req.user`).  
- Should not call repositories or contain business rules.

### **Controllers**
- Accept validated input from requests.  
- Call service methods and return structured HTTP responses.  
- Handle status codes and delegate error handling to middleware.  
- Contain no SQL or domain logic.

### **Services**
- Implement **application logic** and enforce domain rules.  
- Orchestrate multiple repositories or utilities.  
- Return plain objects (domain types) — no HTTP logic.  
- Throw domain errors for the controller to translate.

### **Persistence**
- Interact directly with the database.  
- Contain SQL only, no validation or business logic.  
- Return raw row shapes or mapped domain objects.

### **Utilities**
- Stateless, reusable helpers (JWT, hashing, UUIDs, date math, etc.).  
- Contain only pure logic; no side effects or DB calls.  
- Can be imported anywhere.

---

## Dependency Injection

**Why**  
- Keeps code testable and decoupled.  
- Makes dependencies explicit.  
- Prevents hidden imports and circular dependencies.

**How**  
- Every service or controller is a **factory function** (e.g. `makeAuthService`).  
- Dependencies (repos, utilities, etc.) are **injected via parameters**, never imported directly.  
- Tests can inject mocks or stubs for isolated unit testing.

Example flow:

usersRepo  ->  injected into  AuthService
AuthService ->  injected into  AuthController
AuthController -> injected into  makeAuthRouter()


---

## Composition Root

**Purpose**  
A single file responsible for *wiring everything together*.

**Responsibilities**
- Instantiate all repositories.  
- Pass them into service factories.  
- Pass services into controller factories.  
- Pass controllers into routers.  
- Mount routers in `app.ts`.

**Benefits**
- One place to visualize the entire dependency graph.  
- Prevents circular imports.  
- Simplifies testing and swapping implementations.

---

## Layer Boundaries

| From         | Can Depend On               | Must Not Depend On                |
|--------------|-----------------------------|-----------------------------------|
| Router       | Controller                  | Services, Repositories            |
| Controller   | Service                     | Persistence, Middleware internals |
| Service      | Repository, Utility         | Controller, Middleware            |
| Persistence  | Database client only        | Service, Controller               |
| Middleware   | Utilities                   | Persistence, Service (mostly)     |

---

## Contracts & Domain Types

- **Contracts:** Define I/O between layers (e.g. `AuthService`, `UsersRepo`).  
- **Domain Types:** Describe business objects like `UserPublic`, `Role`, `Event`.  
- **DB Contracts:** Define persistence shapes (`UserRow`, `SessionRow`).  

**Rule of thumb:**  
Controllers & services use **domain models**, repositories use **DB row types**.  
Never pass raw SQL rows beyond the repository layer.

---

## Adding a New Feature

1. **Define Contracts** — add types under `/contracts`.  
2. **Create Persistence** — add SQL logic in `/db`.  
3. **Create Service** — build business logic in `/services`.  
4. **Create Controller** — map HTTP to service calls.  
5. **Create Router** — mount endpoints and middleware.  
6. **Wire Up** — add everything in the composition root.

---

## Summary

- **Explicit dependencies** → easy testing and maintainability.  
- **Composition root** → single source of truth for app wiring.  
- **Strict layering** → predictable, scalable design.  
- **Stateless utilities** → reusable and safe across the codebase.

---

> *Keep business logic in services, keep controllers thin, keep repos dumb.*  
> This makes the system modular and easily testable.