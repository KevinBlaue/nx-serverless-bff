import {
  GetSecretValueCommand,
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';

export class ConfigurationError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConfigurationError';
  }
}

export interface SecretReader {
  send: (command: GetSecretValueCommand) => Promise<{ SecretString?: string }>;
}

let cachedApiKey: Promise<string> | undefined;

function createSecretReader(config: SecretsManagerClientConfig = {}): SecretReader {
  return new SecretsManagerClient(config);
}

async function readApiKey(
  environment: NodeJS.ProcessEnv,
  secretReader: SecretReader,
): Promise<string> {
  if (environment.UPSTREAM_API_KEY) {
    return environment.UPSTREAM_API_KEY;
  }

  const secretId = environment.UPSTREAM_API_KEY_SECRET_ID;
  if (!secretId) {
    throw new ConfigurationError('UPSTREAM_API_KEY_SECRET_ID is not configured');
  }

  try {
    const response = await secretReader.send(new GetSecretValueCommand({ SecretId: secretId }));
    if (!response.SecretString) {
      throw new ConfigurationError('Configured API key secret has no string value');
    }

    return response.SecretString;
  } catch (error: unknown) {
    if (error instanceof ConfigurationError) {
      throw error;
    }

    throw new ConfigurationError('Could not load the upstream API key', { cause: error });
  }
}

export function getUpstreamApiKey(
  environment: NodeJS.ProcessEnv = process.env,
  secretReader: SecretReader = createSecretReader(),
): Promise<string> {
  cachedApiKey ??= readApiKey(environment, secretReader).catch((error: unknown) => {
    cachedApiKey = undefined;
    throw error;
  });

  return cachedApiKey;
}

export function resetApiKeyCache(): void {
  cachedApiKey = undefined;
}
