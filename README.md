# Nx Serverless BFF

This probe demonstrates a contract-first backend-for-frontend inside a frontend-owned Nx
monorepo. It deliberately contains no frontend source: the focus is the independently deployable
backend structure and its application-to-library boundaries.

`GET /offers` validates a frontend request, calls the fictional
`https://some.other-service.invalid/` upstream and maps its response to a stable frontend contract.
The OpenAPI document drives API Gateway routing and generated TypeScript types. The Serverless
Framework defines the Lambda, API Gateway and supporting AWS resources.

Nx models projects, tags and dependencies. Turbo provides the same root-level build, lint and test
pipeline used across the related probes. Jest covers positive and negative behavior, while CI also
checks formatting, linting, builds, contract drift and at least 80% coverage.

The upstream API key remains server-side and is loaded from AWS Secrets Manager. It is deliberately
used to keep the example small; an API key identifies a calling application and does not replace an
OAuth 2.0 access token for delegated authorization or end-user context.

The implementation is an independent clean-room sample. All domains, contracts, names and test
data are fictional. Dependencies are pinned and maintained manually without Dependabot.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

MIT licensed.
