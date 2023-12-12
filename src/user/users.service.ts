import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserInfoDto } from 'src/auth/dtos/userInfo.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepository.find();
  }

  async findOne(provider: string, email: string) {
    return this.usersRepository.findOne({ where: { provider, email } });
  }

  async create(profile: UserInfoDto) {
    const newUser = this.usersRepository.create(profile);

    return this.usersRepository.save(newUser);
  }

  async remove(id: number) {
    await this.usersRepository.delete(id);
  }
}
