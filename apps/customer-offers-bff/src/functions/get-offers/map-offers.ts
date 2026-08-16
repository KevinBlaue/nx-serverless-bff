import type { GetOffersResponse } from '@nx-serverless-bff/api-contract';
import type { ExternalOffersResponse } from '@nx-serverless-bff/other-service-client';

export function mapOffers(response: ExternalOffersResponse): GetOffersResponse {
  return {
    offers: response.results.map((offer) => ({
      highlights: offer.marketing_labels,
      id: offer.offer_code,
      monthlyPrice: {
        amount: (offer.monthly_fee_cents / 100).toFixed(2),
        currency: offer.currency_code,
      },
      title: offer.display_name,
    })),
    source: 'other-service',
  };
}
