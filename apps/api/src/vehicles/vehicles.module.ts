import { Module } from '@nestjs/common';
import { NappModule } from '../napp/napp.module';
import { CarImageService } from './car-image.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [NappModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, CarImageService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
