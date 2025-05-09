import { Test, TestingModule } from '@nestjs/testing';
import { ResidoAppController } from './resido-app.controller';
import { ResidoAppService } from './resido-app.service';

describe('ResidoAppController', () => {
  let residoAppController: ResidoAppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ResidoAppController],
      providers: [ResidoAppService],
    }).compile();

    residoAppController = app.get<ResidoAppController>(ResidoAppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(residoAppController.getHello()).toBe('Hello World!');
    });
  });
});
