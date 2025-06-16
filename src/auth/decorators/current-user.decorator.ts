import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
/** * Custom decorator to extract the current authenticated user from the request
 *  * Usage:
 * @Get('profile') * getProfile(@CurrentUser() user: User) {
 *   return user; * }
 */ export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
