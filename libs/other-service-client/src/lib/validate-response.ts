import { InvalidOtherServiceResponseError } from './errors';
import type { ExternalOffer, ExternalOffersResponse } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExternalOffer(value: unknown): value is ExternalOffer {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.offer_code === 'string' &&
    value.offer_code.length > 0 &&
    typeof value.display_name === 'string' &&
    value.display_name.length > 0 &&
    Number.isSafeInteger(value.monthly_fee_cents) &&
    (value.monthly_fee_cents as number) >= 0 &&
    typeof value.currency_code === 'string' &&
    /^[A-Z]{3}$/.test(value.currency_code) &&
    Array.isArray(value.marketing_labels) &&
    value.marketing_labels.every((label) => typeof label === 'string')
  );
}

export function validateExternalOffersResponse(value: unknown): ExternalOffersResponse {
  if (!isRecord(value) || !Array.isArray(value.results) || !value.results.every(isExternalOffer)) {
    throw new InvalidOtherServiceResponseError('Upstream response does not match its contract');
  }

  return { results: value.results };
}
