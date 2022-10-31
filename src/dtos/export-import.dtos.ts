import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExportExcelDto {
  @ApiProperty()
  @IsString({ each: true })
  buildingKeys: string[];
}

export class ExportExcelDtoForType {
  @ApiProperty()
  @IsString({ each: true })
  typeKeys: string[];
}

export class ExportExcelDtoForSystem {
  @ApiProperty()
  @IsString({ each: true })
  systemKeys: string[];
}
