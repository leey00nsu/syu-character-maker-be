import { Global, Module } from '@nestjs/common';
import { OciService } from './oci.service';

@Global()
@Module({
  providers: [OciService],
  exports: [OciService],
})
export class OciModule {}
