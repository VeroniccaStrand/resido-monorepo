import { Injectable } from '@nestjs/common';

@Injectable()
export class ResidoAppService {
  getHello(): string {
    return 'Hello World!';
  }
}
