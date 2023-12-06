import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  async getGoogleToken(code: string) {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );

    const token = await client.getToken(code);

    return token.tokens.access_token;
  }

  async getGoogleProfile(token: string) {
    const profile = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
    );

    return {
      provider: 'google',
      providerId: profile.data.sub,
      name: profile.data.name,
      email: profile.data.email,
      photo: profile.data.picture,
    };
  }
}
