import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { HeadersService } from './headers.service';
import { HeadersMiddleware } from './headers.middleware';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [HeadersService],
  exports: [HeadersService],
})
export class HeadersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HeadersMiddleware)
      .exclude(
        { path: 'api/docs', method: RequestMethod.GET },
        { path: 'api/docs-json', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
} 