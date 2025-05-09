import { Controller, Get } from '@nestjs/common';
import { ResidoAppService } from './resido-app.service';

@Controller()
export class ResidoAppController {
  constructor(private readonly residoAppService: ResidoAppService) {}

  @Get()
  getHello(): string {
    return this.residoAppService.getHello();
  }
}
