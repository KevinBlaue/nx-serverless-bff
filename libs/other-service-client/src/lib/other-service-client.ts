import { InvalidOtherServiceResponseError, OtherServiceUnavailableError } from './errors';
import type {
  ExternalOffersResponse,
  OtherServiceClient,
  OtherServiceClientOptions,
} from './types';
import { validateExternalOffersResponse } from './validate-response';

const DEFAULT_TIMEOUT_MS = 2_500;

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export function createOtherServiceClient(options: OtherServiceClientOptions): OtherServiceClient {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    async getOffers(customerReference): Promise<ExternalOffersResponse> {
      const url = new URL('/v1/offers', options.baseUrl);
      url.searchParams.set('customerReference', customerReference);

      let response: Response;

      try {
        response = await fetchImplementation(url, {
          headers: {
            accept: 'application/json',
            'x-api-key': options.apiKey,
          },
          method: 'GET',
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error: unknown) {
        if (isTimeout(error)) {
          throw new OtherServiceUnavailableError('Upstream request timed out', { cause: error });
        }

        throw new OtherServiceUnavailableError('Upstream request failed', { cause: error });
      }

      if (response.status === 429 || response.status >= 500) {
        throw new OtherServiceUnavailableError(
          `Upstream returned status ${String(response.status)}`,
        );
      }

      if (!response.ok) {
        throw new InvalidOtherServiceResponseError(
          `Upstream returned status ${String(response.status)}`,
        );
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (error: unknown) {
        throw new InvalidOtherServiceResponseError('Upstream did not return JSON', {
          cause: error,
        });
      }

      return validateExternalOffersResponse(body);
    },
  };
}
