import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query } = req;
    const timestamp = new Date().toISOString();
    res.on('finish', () => {
      const { statusCode } = res;
      console.log(`[${timestamp}] ${method} ${originalUrl} ${statusCode}`);
      console.log(`Query Params: ${JSON.stringify(query)}`);
      console.log(`Body: ${JSON.stringify(body)}`);
    });
    next();
  }
}
