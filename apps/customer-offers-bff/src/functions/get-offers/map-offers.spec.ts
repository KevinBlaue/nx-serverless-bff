import { mapOffers } from './map-offers';

describe('mapOffers', () => {
  it('maps the upstream representation to the frontend contract', () => {
    expect(
      mapOffers({
        results: [
          {
            currency_code: 'EUR',
            display_name: 'Example Plan',
            marketing_labels: ['Flexible', 'Digital'],
            monthly_fee_cents: 1999,
            offer_code: 'offer-1',
          },
        ],
      }),
    ).toEqual({
      offers: [
        {
          highlights: ['Flexible', 'Digital'],
          id: 'offer-1',
          monthlyPrice: { amount: '19.99', currency: 'EUR' },
          title: 'Example Plan',
        },
      ],
      source: 'other-service',
    });
  });
});
