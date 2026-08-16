export interface ExternalOffer {
  offer_code: string;
  display_name: string;
  monthly_fee_cents: number;
  currency_code: string;
  marketing_labels: string[];
}

export interface ExternalOffersResponse {
  results: ExternalOffer[];
}

export interface OtherServiceClient {
  getOffers(customerReference: string): Promise<ExternalOffersResponse>;
}

export interface OtherServiceClientOptions {
  apiKey: string;
  baseUrl: string;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
}
