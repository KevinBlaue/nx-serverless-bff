import {
  ConfigurationError,
  getUpstreamApiKey,
  resetApiKeyCache,
  type SecretReader,
} from './api-key-provider';

describe('getUpstreamApiKey', () => {
  beforeEach(() => {
    resetApiKeyCache();
  });

  it('uses the direct key for local development without calling Secrets Manager', async () => {
    const secretReader: SecretReader = { send: jest.fn() };

    await expect(getUpstreamApiKey({ UPSTREAM_API_KEY: 'local-key' }, secretReader)).resolves.toBe(
      'local-key',
    );
    expect(secretReader.send).not.toHaveBeenCalled();
  });

  it('loads and caches the API key from Secrets Manager', async () => {
    const secretReader: SecretReader = {
      send: jest.fn().mockResolvedValue({ SecretString: 'secret-key' }),
    };
    const environment = { UPSTREAM_API_KEY_SECRET_ID: 'example/secret' };

    await expect(getUpstreamApiKey(environment, secretReader)).resolves.toBe('secret-key');
    await expect(getUpstreamApiKey(environment, secretReader)).resolves.toBe('secret-key');
    expect(secretReader.send).toHaveBeenCalledTimes(1);
  });

  it('rejects missing secret configuration', async () => {
    await expect(getUpstreamApiKey({}, { send: jest.fn() })).rejects.toThrow(ConfigurationError);
  });

  it('rejects a binary or empty secret value', async () => {
    const secretReader: SecretReader = { send: jest.fn().mockResolvedValue({}) };

    await expect(
      getUpstreamApiKey({ UPSTREAM_API_KEY_SECRET_ID: 'example/secret' }, secretReader),
    ).rejects.toThrow('Configured API key secret has no string value');
  });

  it('wraps provider failures and allows a later retry', async () => {
    const secretReader: SecretReader = {
      send: jest
        .fn()
        .mockRejectedValueOnce(new Error('provider details'))
        .mockResolvedValueOnce({ SecretString: 'recovered-key' }),
    };
    const environment = { UPSTREAM_API_KEY_SECRET_ID: 'example/secret' };

    await expect(getUpstreamApiKey(environment, secretReader)).rejects.toThrow(
      'Could not load the upstream API key',
    );
    await expect(getUpstreamApiKey(environment, secretReader)).resolves.toBe('recovered-key');
  });
});
