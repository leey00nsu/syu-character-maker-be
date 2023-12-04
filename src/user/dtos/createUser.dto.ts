import { Column } from 'typeorm';

export class CreateUserDto {
  @Column()
  name: string;

  @Column()
  email: string;
}
