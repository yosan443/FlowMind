# Architecture Overview of FlowMind

## Introduction
FlowMind is a visual AI workflow builder designed to simplify the creation and management of workflows through an intuitive interface. This document outlines the architecture of the application, detailing its components, interactions, and technologies used.

## Architecture Components

### 1. Client-Side
The client-side of FlowMind is built using React, providing a dynamic and responsive user interface.

- **App Structure**: The main entry point is located in `src/client/app/App.tsx`, which initializes the application and sets up routing.
- **Components**:
  - **Canvas**: Located in `src/client/components/Canvas`, this component serves as the workspace for users to build workflows.
  - **NodePanel**: Found in `src/client/components/NodePanel`, this sidebar displays available nodes for workflow creation.
  - **WorkflowInspector**: Located in `src/client/components/WorkflowInspector`, this component allows users to view and edit workflow details.

### 2. Server-Side
The server-side is built using a Node.js framework (e.g., Express) to handle API requests and manage business logic.

- **API Routes**: Defined in `src/server/api/routes`, these routes handle requests related to workflows and AI functionalities.
  - **Workflow Routes**: Managed in `workflowRoutes.ts`, these routes facilitate CRUD operations for workflows.
  - **AI Routes**: Managed in `aiRoutes.ts`, these routes handle requests related to AI services.

- **Controllers**: Located in `src/server/api/controllers`, these files contain the logic for processing requests and interacting with services.
  - **Workflow Controller**: Handles workflow-related business logic.
  - **AI Controller**: Manages AI-related operations.

- **Services**: Found in `src/server/services`, these files encapsulate the core functionalities of the application.
  - **AI Services**: Includes `llmService.ts` and `visionService.ts` for handling AI tasks.
  - **Workflow Services**: Includes `builderService.ts` and `executionService.ts` for managing workflow creation and execution.

### 3. Shared Components
The shared directory contains types, constants, and utility functions used across both client and server.

- **Types**: Located in `src/shared/types`, these files define TypeScript types for AI and workflows.
- **Constants**: Found in `src/shared/constants`, these files store application-wide constants.
- **Utilities**: Located in `src/shared/utils`, these files provide reusable utility functions.

## Technologies Used
- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB or PostgreSQL (to be defined in `src/server/config/db.ts`)
- **Styling**: CSS Modules for component-specific styles

## Conclusion
The architecture of FlowMind is designed to be modular and scalable, allowing for easy maintenance and future enhancements. Each component is clearly defined, promoting separation of concerns and facilitating collaboration among developers.