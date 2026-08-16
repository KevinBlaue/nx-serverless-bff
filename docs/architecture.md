# Architecture decisions

## ADR-001: Keep the BFF inside an Nx monorepo

### Context

A frontend team often needs a response tailored to its user interface while the available upstream
API is shaped around a different domain. A separate repository creates an additional release and
coordination boundary even when frontend and BFF changes belong to the same feature.

### Decision

The BFF is an Nx application. Shared contract and client concerns are Nx libraries with explicit
dependency edges. This sample omits frontend code deliberately; the structure still demonstrates
how a backend application fits into a larger frontend-owned workspace.

### Consequences

- One task graph can coordinate contract, library, and BFF changes.
- CI can use Nx caching and affected project selection.
- The BFF retains an independent deployment lifecycle through its app-local service root.
- Project boundaries must remain explicit as the workspace grows.

## ADR-002: Use the OpenAPI contract as the routing source

### Context

Defining a route separately in documentation and infrastructure lets those definitions drift.

### Decision

The OpenAPI document is imported into an `AWS::ApiGatewayV2::Api`. Its operation contains the
Lambda proxy integration, and its schemas generate the TypeScript types consumed by the handler.
The CI contract check fails when generated types do not match the committed contract.

### Consequences

- Reviewers see the public interface before handler details.
- API Gateway, documentation, and TypeScript share one source.
- Contract changes require deliberate regeneration and review.

## ADR-003: Keep the Serverless service root app-local

### Context

Packaging from the workspace root risks coupling the deployable service to unrelated monorepo
files.

### Decision

The Serverless configuration, CloudFormation resources, handler code, package manifest, build
script, and TypeScript configuration live below `apps/customer-offers-bff/`.

### Consequences

- The deployable boundary is visible in the repository tree.
- Lambda artifacts remain small because esbuild bundles only reachable production code.
- Serverless commands must point to the app-local configuration.

## ADR-004: Use an API key only for the fictional upstream

### Context

The sample needs to demonstrate server-side credential handling without depending on a real
identity provider.

### Decision

The Lambda reads an upstream API key from AWS Secrets Manager and sends it as `x-api-key`. A direct
environment variable is supported only for local development and tests. The frontend never sees or
supplies this credential.

### Consequences

- The sample remains deployable without an OAuth provider.
- The secret value is not embedded in source or CloudFormation.
- The mechanism does not provide delegated authorization, scopes, or end-user identity. OAuth/OIDC
  is the appropriate replacement when those properties are required.
