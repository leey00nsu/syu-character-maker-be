import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findOneByProviderId(providerId: string) {
    return await this.prisma.user.findFirst({
      where: { providerId },
    });
  }

  async create(profile: Prisma.UserCreateInput) {
    return await this.prisma.user.create({
      data: profile,
    });
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
  }
}
