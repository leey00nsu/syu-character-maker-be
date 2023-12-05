import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from 'src/user/user.entity';
import { UsersService } from 'src/user/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async serializeUser(
    user: User,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    // console.log(user, 'serializeUser'); // 테스트 시 확인
    done(null, user);
  }

  async deserializeUser() {}
  // async deserializeUser(payload: any, done: (err: any, user?: any) => void) {
  // const { provider, email } = payload;
  // const user = await this.usersService.findOne(provider, email);
  // console.log(payload, 'deserializeUser'); // 테스트 시 확인
  // return user ? done(null, user) : done(null, null);
  // }
}
