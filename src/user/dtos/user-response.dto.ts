import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ type: String, description: '유저 이름' })
  name: string;

  @ApiProperty({ type: String, description: '유저 프로필 사진' })
  photo: string;

  @ApiProperty({ type: String, description: '유저 이메일' })
  email: string;
}
