# Gateway-Based Multi-Tenant SaaS Backend with Schema Isolation

## Overview

This repository contains a modular NestJS-based architecture for a multi-tenant SaaS platform. Each customer (tenant) is isolated in its own PostgreSQL schema, with dynamic schema creation and migrations handled by MikroORM and runtime routing through a central API gateway. 

## Table of Contents

* [Features](#features)
* [Architecture](#architecture)
* [Technology Stack](#technology-stack)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Configuration](#configuration)
  * [Running Migrations](#running-migrations)
  * [Starting the Services](#starting-the-services)
* [Usage](#usage)
* [Project Structure](#project-structure)
* [Limitations & Future Work](#limitations--future-work)
* [Contributing](#contributing)
* [License](#license)
* [Acknowledgements](#acknowledgements)

## Features

* **Schema-per-Tenant Isolation**: Each tenant has its own PostgreSQL schema, ensuring strong data separation without separate databases.
* **Dynamic Schema Management**: Runtime creation and migration of tenant schemas via MikroORM.
* **API Gateway**: Centralized gateway for authentication (JWT), schema-based routing, and logging.
* **Microservice Monorepo**: Modular design with shared libraries for logging, error handling, and DTO definitions.
  
## Architecture

1. **API Gateway**: Handles client HTTP/gRPC requests, performs JWT authentication, extracts the `x-tenant` header (or metadata), and routes to the appropriate microservice over TCP.
2. **TenantConnectionManagerService**: Caches and manages database connections per schema, creating new connections on demand.
3. **SchemaContextInterceptor**: Injects the correct MikroORM `EntityManager` for the current tenant before controller execution.
4. **Microservices**: Each service (e.g., `resido-app`) lives under `apps/`, using shared libraries (`libs/`) for common concerns.
5. **Migrations Pipeline**: Separate migration flows for the `public` schema (global metadata) and tenant schemas, with advisory locks to prevent concurrent conflicts.  

## Technology Stack

* **NestJS** for backend framework and microservice support.
* **PostgreSQL** with schema-based multi-tenancy.
* **MikroORM** for dynamic schema migrations and entity management.
* **gRPC/TCP** for inter-service communication.
* **Winston** (via `winston-daily-rotate-file`) for production logging, and console color logs in development.

## Getting Started

### Prerequisites

* Node.js (>= 18.x) and npm or Yarn
* PostgreSQL (>= 16.x)


### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/VeroniccaStrand/resido-monorepo.git
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or yarn install
   ```

### Configuration

Copy the example environment file and update credentials:

```bash
cp .env.example .env
# Edit `.env` to set your DB connection, JWT secrets, and any migration settings (e.g. number of concurrent schema migrations, advisory lock timeouts, log level, specific tenant to migrate) via environment variables. citeturn1file0
```

### Running Migrations

#### Public Schema

MikroORM’s built-in CLI handles all migrations against the public schema directly on the TypeScript source files:

1. **Initial Migration** (only the first time):  
   ```bash
   npm run migration:create:public -- --initial --name=init   # creates a baseline migration without history
   npm run migrations:up:public                               # applies all pending migrations to the public schema
   ```
Tenant Schemas

Tenant migrations are executed automatically at service startup based on environment variables, without manual npm commands.

Initial Migration TemplateSpecify a temporary schema (e.g., tenant_template) in your mikro-orm-tenant.config.ts and create the first, initial migration:
```bash
npm run migration:create:tenant -- --initial --name=init_tenant_template   # generates baseline for the tenant schema
npm run migrations:up:tenant                                               # applies that initial migration
```
Adjust the MigrationRemove the schema setting from the configuration and edit the generated migration file so it becomes schema‑agnostic.

Compile Migrations

npm run build:migrations      # compiles `.ts` files to `.js` in `compiled-migrations/`

Startup‑Driven Tenant MigrationsWhen the application starts, it reads the following environment variables and applies pending migrations for each tenant schema automatically:
```bash
RUN_MIGRATIONS=false => true = Restart app and migrations starts from main.ts
TENANT_MIGRATE_CONCURRENCY (number of concurrent migrations)
TENANT_MIGRATE_TIMEOUT (timeout for advisory locks)
TENANT_MIGRATE_LOG=true (enable detailed logging of each step)
TENANT_MIGRATE_TENANT_ID=<specific tenant ID>
```



### Starting the Services

* **Start all services**

  ```bash
  npm run start:dev:all
  ```



## Usage

* **Creating a Tenant**: Issue a request to the gateway endpoint responsible for tenant provisioning. A new schema and initial migration will be applied automatically, and a signup token will be generated in the public schema.
* **Authenticated Requests**: Include your JWT in the `Authorization` header.
* **Observability**: Logs include tenant, method, and response time for easy per-tenant tracing.

## Project Structure



## Limitations & Future Work

* No automated tests (unit/integration/load) at present.
* CI/CD pipelines and production-ready deployment scripts are not yet implemented.
* Frontend client (Next.js/React) is planned but not included.
* Gateway enhancements: API key support, rate limiting, caching, real-time monitoring.
* Security hardening: time-limited tokens, RBAC for tenant creation.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for features, bug fixes, or improvements.

## License

This project is licensed under the MIT License. 

## Acknowledgements

* Veronica Strand’s thesis on schema-isolated multi-tenancy in NestJS, Teknikhögskolan 2025. 
