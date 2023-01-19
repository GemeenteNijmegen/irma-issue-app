import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Bsn } from '@gemeentenijmegen/utils/lib/Bsn';

export class BrpApi {

  private endpoint: string;
  private client: ApiClient;

  constructor(client: ApiClient) {
    if (!process.env.BRP_API_URL) {
      throw new Error('Could not initialize brp api as no endpoint is provided in BRP_API_URL');
    }
    this.endpoint = process.env.BRP_API_URL;
    this.client = client ? client : new ApiClient();
  }

  /**
   * Bevraag de layer7 BRP API
   * @param bsn the bsn to get data for
   * @returns the API response data of {error: ""}
   */
  async getBrpData(bsn: string) {
    try {
      const aBsn = new Bsn(bsn);
      let data = await this.client.requestData(this.endpoint, { bsn: aBsn.bsn }, { 'Content-type': 'application/json' });
      if (data?.Persoon) {
        return data;
      }
      throw new Error('Het ophalen van persoonsgegevens is misgegaan.');
    } catch (error: any) {
      console.log('BRP API:', error.message);
      return { error: error.message };
    }
  }
}
