import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  InvalidOtherServiceResponseError,
  OtherServiceUnavailableError,
  type OtherServiceClient,
} from '@nx-serverless-bff/other-service-client';
import { ConfigurationError } from '../../lib/api-key-provider';
import { createGetOffersHandler } from './handler';

function createEvent(customerReference?: string): APIGatewayProxyEventV2 {
  return {
    headers: {},
    isBase64Encoded: false,
    queryStringParameters: customerReference ? { customerReference } : undefined,
    rawPath: '/offers',
    rawQueryString: customerReference ? `customerReference=${customerReference}` : '',
    requestContext: {
      accountId: 'offline',
      apiId: 'offline',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method: 'GET',
        path: '/offers',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest',
      },
      requestId: 'request-123',
      routeKey: 'GET /offers',
      stage: '$default',
      time: '01/Jan/2026:00:00:00 +0000',
      timeEpoch: 0,
    },
    routeKey: 'GET /offers',
    version: '2.0',
  };
}

function responseBody(result: { body?: string }): unknown {
  return JSON.parse(result.body ?? 'null') as unknown;
}

describe('createGetOffersHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('returns a frontend-oriented response', async () => {
    const getOffers = vi.fn<OtherServiceClient['getOffers']>().mockResolvedValue({
      results: [
        {
          currency_code: 'EUR',
          display_name: 'Example Plan',
          marketing_labels: ['Flexible'],
          monthly_fee_cents: 1999,
          offer_code: 'offer-1',
        },
      ],
    });
    const handler = createGetOffersHandler({
      createClient: (apiKey) => {
        expect(apiKey).toBe('server-side-key');
        return { getOffers };
      },
      getApiKey: () => Promise.resolve('server-side-key'),
    });

    const result = await handler(createEvent('customer-123'), {} as never, () => undefined);

    expect(result).toMatchObject({ statusCode: 200 });
    expect(responseBody(result ?? {})).toEqual({
      offers: [
        {
          highlights: ['Flexible'],
          id: 'offer-1',
          monthlyPrice: { amount: '19.99', currency: 'EUR' },
          title: 'Example Plan',
        },
      ],
      source: 'other-service',
    });
    expect(getOffers).toHaveBeenCalledWith('customer-123');
  });

  it.each([undefined, '', 'contains spaces', 'a'.repeat(65)])(
    'rejects invalid customer reference %j before loading credentials',
    async (customerReference) => {
      const getApiKey = vi.fn<() => Promise<string>>();
      const handler = createGetOffersHandler({ getApiKey });

      const result = await handler(createEvent(customerReference), {} as never, () => undefined);

      expect(result).toMatchObject({ statusCode: 400 });
      expect(responseBody(result ?? {})).toEqual({
        errorCode: 'INVALID_REQUEST',
        requestId: 'request-123',
      });
      expect(getApiKey).not.toHaveBeenCalled();
    },
  );

  it.each([
    [new OtherServiceUnavailableError('unavailable'), 503, 'UPSTREAM_UNAVAILABLE'],
    [new InvalidOtherServiceResponseError('invalid'), 502, 'INVALID_UPSTREAM_RESPONSE'],
    [new ConfigurationError('missing secret'), 500, 'INTERNAL_ERROR'],
    [new Error('unexpected'), 500, 'INTERNAL_ERROR'],
  ] as const)('maps %s to a safe API error', async (error, expectedStatus, expectedCode) => {
    const handler = createGetOffersHandler({
      createClient: () => ({ getOffers: vi.fn().mockRejectedValue(error) }),
      getApiKey: () => Promise.resolve('server-side-key'),
    });

    const result = await handler(createEvent('customer-123'), {} as never, () => undefined);

    expect(result).toMatchObject({ statusCode: expectedStatus });
    expect(responseBody(result ?? {})).toEqual({
      errorCode: expectedCode,
      requestId: 'request-123',
    });
    const logCalls: unknown[][] = [
      ...vi.mocked(console.error).mock.calls,
      ...vi.mocked(console.info).mock.calls,
      ...vi.mocked(console.warn).mock.calls,
    ];
    const allLogs = logCalls.map(([entry]) => (typeof entry === 'string' ? entry : '')).join(' ');
    expect(allLogs).not.toContain('server-side-key');
    expect(allLogs).not.toContain('customer-123');
  });
});
