import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const user = request.session.user;
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');

    return true;
  }
}
