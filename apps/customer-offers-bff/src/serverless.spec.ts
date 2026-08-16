import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

interface ServerlessConfiguration {
  functions?: Record<string, { events?: unknown; handler?: string }>;
  params?: { default?: Record<string, string> };
  provider?: { environment?: Record<string, string> };
  resources?: { Resources?: Record<string, unknown> };
  service?: string;
}

describe('Serverless infrastructure', () => {
  const configuration = parse(
    readFileSync(resolve(__dirname, '../serverless.yml'), 'utf8'),
  ) as ServerlessConfiguration;

  it('keeps the BFF service and handler app-local', () => {
    expect(configuration.service).toBe('nx-serverless-bff');
    expect(configuration.functions?.getOffers).toEqual({
      description: 'Maps fictional upstream offers to a stable frontend response',
      handler: 'src/functions/get-offers/handler.handler',
    });
  });

  it('uses the fictional upstream and references only a secret identifier', () => {
    expect(configuration.params?.default?.upstreamBaseUrl).toBe(
      'https://some.other-service.invalid/',
    );
    expect(configuration.provider?.environment).toMatchObject({
      UPSTREAM_API_KEY_SECRET_ID: '${param:upstreamApiKeySecretId}',
    });
    expect(configuration.provider?.environment).not.toHaveProperty('UPSTREAM_API_KEY');
  });

  it('lets the OpenAPI-backed HTTP API own routing', () => {
    expect(configuration.functions?.getOffers?.events).toBeUndefined();
    expect(configuration.resources?.Resources).toHaveProperty('HttpApi');
    expect(configuration.resources?.Resources).toHaveProperty('GetOffersInvokePermission');
  });
});
