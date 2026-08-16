import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

interface OpenApiDocument {
  openapi?: string;
  paths?: Record<string, Record<string, unknown>>;
}

describe('customer offers BFF contract', () => {
  const contractPath = resolve(import.meta.dirname, '../openapi/customer-offers-bff.openapi.yml');
  const contract = parse(readFileSync(contractPath, 'utf8')) as OpenApiDocument;

  it('uses OpenAPI 3 and defines the GET /offers operation', () => {
    expect(contract.openapi).toBe('3.0.3');
    expect(contract.paths?.['/offers']?.get).toMatchObject({ operationId: 'getOffers' });
  });

  it('keeps the Lambda integration in the contract routing source', () => {
    expect(contract.paths?.['/offers']?.get).toHaveProperty(
      'x-amazon-apigateway-integration.type',
      'aws_proxy',
    );
  });
});
