import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GoogleUserDto } from 'src/auth/dtos/googleUser.dto';
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

  async create(profile: GoogleUserDto) {
    const newUser = this.usersRepository.create({
      provider: profile.provider,
      providerId: profile.providerId,
      name: profile.name,
      email: profile.email,
      photo: profile.photo,
    });

    return this.usersRepository.save(newUser);
  }

  async remove(id: number) {
    await this.usersRepository.delete(id);
  }
}
