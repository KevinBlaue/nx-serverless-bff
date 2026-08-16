import { InvalidOtherServiceResponseError, OtherServiceUnavailableError } from './errors';
import { createOtherServiceClient } from './other-service-client';

const validResponse = {
  results: [
    {
      offer_code: 'offer-1',
      display_name: 'Example Plan',
      monthly_fee_cents: 1999,
      currency_code: 'EUR',
      marketing_labels: ['Flexible'],
    },
  ],
};

describe('createOtherServiceClient', () => {
  it('calls the configured service with the server-side API key', async () => {
    const fetchImplementation = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(
        new Response(JSON.stringify(validResponse), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
      );
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation,
    });

    await expect(client.getOffers('customer-123')).resolves.toEqual(validResponse);

    expect(fetchImplementation).toHaveBeenCalledWith(
      new URL('https://some.other-service.invalid/v1/offers?customerReference=customer-123'),
      expect.objectContaining({
        headers: { accept: 'application/json', 'x-api-key': 'test-api-key' },
        method: 'GET',
      }),
    );
  });

  it.each([429, 503])('maps status %s to an unavailable error', async (status) => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValue(new Response(null, { status })),
    });

    await expect(client.getOffers('customer-123')).rejects.toBeInstanceOf(
      OtherServiceUnavailableError,
    );
  });

  it('rejects a non-success response as an invalid upstream response', async () => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValue(new Response(null, { status: 400 })),
    });

    await expect(client.getOffers('customer-123')).rejects.toBeInstanceOf(
      InvalidOtherServiceResponseError,
    );
  });

  it('rejects a successful response that is not JSON', async () => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValue(new Response('not-json')),
    });

    await expect(client.getOffers('customer-123')).rejects.toMatchObject({
      message: 'Upstream did not return JSON',
      name: 'InvalidOtherServiceResponseError',
    });
  });

  it('rejects a successful response with an invalid shape', async () => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValue(new Response(JSON.stringify({ results: [{ id: 'wrong-shape' }] }))),
    });

    await expect(client.getOffers('customer-123')).rejects.toBeInstanceOf(
      InvalidOtherServiceResponseError,
    );
  });

  it('maps a network failure without exposing its details', async () => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockRejectedValue(new Error('socket details')),
    });

    await expect(client.getOffers('customer-123')).rejects.toMatchObject({
      message: 'Upstream request failed',
      name: 'OtherServiceUnavailableError',
    });
  });

  it('maps an abort timeout separately from other network failures', async () => {
    const timeoutError = new Error('timeout details');
    timeoutError.name = 'TimeoutError';
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockRejectedValue(timeoutError),
    });

    await expect(client.getOffers('customer-123')).rejects.toMatchObject({
      message: 'Upstream request timed out',
      name: 'OtherServiceUnavailableError',
    });
  });
});
