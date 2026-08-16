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
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
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

    const [url, request] = fetchImplementation.mock.calls[0] ?? [];
    const calledUrl = url instanceof URL ? url.href : url instanceof Request ? url.url : url;
    expect(calledUrl).toBe(
      'https://some.other-service.invalid/v1/offers?customerReference=customer-123',
    );
    expect(request).toMatchObject({
      headers: { accept: 'application/json', 'x-api-key': 'test-api-key' },
      method: 'GET',
    });
  });

  it.each([429, 503])('maps status %s to an unavailable error', async (status) => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status })),
    });

    await expect(client.getOffers('customer-123')).rejects.toBeInstanceOf(
      OtherServiceUnavailableError,
    );
  });

  it('rejects a successful response with an invalid shape', async () => {
    const client = createOtherServiceClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://some.other-service.invalid/',
      fetchImplementation: vi
        .fn<typeof fetch>()
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
      fetchImplementation: vi.fn<typeof fetch>().mockRejectedValue(new Error('socket details')),
    });

    await expect(client.getOffers('customer-123')).rejects.toMatchObject({
      message: 'Upstream request failed',
      name: 'OtherServiceUnavailableError',
    });
  });
});
