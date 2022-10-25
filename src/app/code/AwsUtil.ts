import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

export class AwsUtil {

  /**
     * Retrieves a sercet from the secrets store given an ARN
     * @param arn
     * @returns
     */
  async getSecret(arn: string) {
    if (!arn) {
      throw new Error('No ARN provided');
    }
    const secretsManagerClient = new SecretsManagerClient({});
    const command = new GetSecretValueCommand({ SecretId: arn });
    const data = await secretsManagerClient.send(command);
    if (data?.SecretString) {
      return data.SecretString;
    }
    throw new Error('No secret value found');
  }

}