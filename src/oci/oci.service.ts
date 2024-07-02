import { Injectable } from '@nestjs/common';
import * as common from 'oci-common';

@Injectable()
export class OciService {
  private provider: common.ConfigFileAuthenticationDetailsProvider;

  constructor() {
    const configurationFilePath = process.env.OCI_CONFIG_FILE_PATH;
    const configProfile = 'DEFAULT';
    this.provider = new common.ConfigFileAuthenticationDetailsProvider(
      configurationFilePath,
      configProfile,
    );
  }

  getProvider(): common.ConfigFileAuthenticationDetailsProvider {
    return this.provider;
  }
}
