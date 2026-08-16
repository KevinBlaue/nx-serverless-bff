import { InvalidOtherServiceResponseError } from './errors';
import { validateExternalOffersResponse } from './validate-response';

describe('validateExternalOffersResponse', () => {
  it('accepts an empty result list', () => {
    expect(validateExternalOffersResponse({ results: [] })).toEqual({ results: [] });
  });

  it.each([
    null,
    {},
    { results: 'not-an-array' },
    {
      results: [
        {
          offer_code: 'offer-1',
          display_name: 'Example',
          monthly_fee_cents: -1,
          currency_code: 'EUR',
          marketing_labels: [],
        },
      ],
    },
  ])('rejects an invalid payload', (payload) => {
    expect(() => validateExternalOffersResponse(payload)).toThrow(InvalidOtherServiceResponseError);
  });
});
