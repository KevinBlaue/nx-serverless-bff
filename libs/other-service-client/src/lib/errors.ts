export class OtherServiceUnavailableError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'OtherServiceUnavailableError';
  }
}

export class InvalidOtherServiceResponseError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidOtherServiceResponseError';
  }
}
