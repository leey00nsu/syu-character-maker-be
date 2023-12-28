import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/createUser.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOneByProviderId(providerId: string) {
    return this.usersRepository.findOne({ where: { providerId } });
  }

  async create(profile: CreateUserDto) {
    const newUser = this.usersRepository.create(profile);

    return this.usersRepository.save(newUser);
  }

  async remove(id: number) {
    await this.usersRepository.delete(id);
  }
}
