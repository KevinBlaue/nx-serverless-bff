import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import type { ApiErrorResponse } from '@nx-serverless-bff/api-contract';
import {
  createOtherServiceClient,
  InvalidOtherServiceResponseError,
  OtherServiceUnavailableError,
  type OtherServiceClient,
} from '@nx-serverless-bff/other-service-client';
import { ConfigurationError, getUpstreamApiKey } from '../../lib/api-key-provider';
import { jsonResponse } from '../../lib/http-response';
import { logger } from '../../lib/logger';
import { mapOffers } from './map-offers';

const CUSTOMER_REFERENCE_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

interface HandlerDependencies {
  createClient?: (apiKey: string) => OtherServiceClient;
  getApiKey?: () => Promise<string>;
}

function errorResponse(
  statusCode: number,
  errorCode: ApiErrorResponse['errorCode'],
  requestId: string,
): APIGatewayProxyStructuredResultV2 {
  return jsonResponse(statusCode, { errorCode, requestId } satisfies ApiErrorResponse);
}

function defaultClient(apiKey: string): OtherServiceClient {
  const baseUrl = process.env.UPSTREAM_BASE_URL ?? 'https://some.other-service.invalid/';
  const parsedTimeout = Number(process.env.UPSTREAM_TIMEOUT_MS ?? '2500');
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 2_500;

  return createOtherServiceClient({ apiKey, baseUrl, timeoutMs });
}

export function createGetOffersHandler(
  dependencies: HandlerDependencies = {},
): APIGatewayProxyHandlerV2<APIGatewayProxyStructuredResultV2> {
  const getApiKey = dependencies.getApiKey ?? getUpstreamApiKey;
  const createClient = dependencies.createClient ?? defaultClient;

  return async (event: APIGatewayProxyEventV2) => {
    const requestId = event.requestContext.requestId;
    const customerReference = event.queryStringParameters?.customerReference;

    if (!customerReference || !CUSTOMER_REFERENCE_PATTERN.test(customerReference)) {
      logger.warn('Request validation failed', { requestId });
      return errorResponse(400, 'INVALID_REQUEST', requestId);
    }

    try {
      const apiKey = await getApiKey();
      const upstreamResponse = await createClient(apiKey).getOffers(customerReference);
      const response = mapOffers(upstreamResponse);

      logger.info('Offers resolved', { offerCount: response.offers.length, requestId });
      return jsonResponse(200, response);
    } catch (error: unknown) {
      if (error instanceof OtherServiceUnavailableError) {
        logger.warn('Upstream unavailable', { requestId });
        return errorResponse(503, 'UPSTREAM_UNAVAILABLE', requestId);
      }

      if (error instanceof InvalidOtherServiceResponseError) {
        logger.error('Upstream response rejected', { requestId });
        return errorResponse(502, 'INVALID_UPSTREAM_RESPONSE', requestId);
      }

      if (error instanceof ConfigurationError) {
        logger.error('BFF configuration invalid', { requestId });
        return errorResponse(500, 'INTERNAL_ERROR', requestId);
      }

      logger.error('BFF request failed unexpectedly', { requestId });
      return errorResponse(500, 'INTERNAL_ERROR', requestId);
    }
  };
}

export const handler = createGetOffersHandler();
