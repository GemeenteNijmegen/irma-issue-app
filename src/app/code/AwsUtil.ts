import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

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

  /**
   * Get a parameter from parameter store. This is used
   * as a workaround for the 4kb limit for environment variables.
   *
   * @param {string} parameter Name of the ssm param
   * @returns param value
   */
  async getParameter(parameter: string) {
    const client = new SSMClient({});
    const command = new GetParameterCommand({ Name: parameter });
    const response = await client.send(command);
    return response.Parameter?.Value;
  }

}