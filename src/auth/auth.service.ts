import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { CreateUserDto } from 'src/user/dtos/createUser.dto';

@Injectable()
export class AuthService {
  async getGoogleToken(code: string) {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );

    const token = await client.getToken(code);

    if (!token) {
      throw new HttpException(
        '토큰을 가져올 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return token.tokens.access_token;
  }

  async getGoogleProfile(token: string) {
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
    );

    if (!userInfo) {
      throw new HttpException(
        '구글 프로필을 가져올 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const profile: CreateUserDto = {
      provider: 'google',
      providerId: userInfo.data.sub,
      name: userInfo.data.name,
      email: userInfo.data.email,
      photo: userInfo.data.picture,
    };

    return profile;
  }
}
