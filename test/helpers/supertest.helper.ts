import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AuthTestHelper } from './auth.helper';

export class SupertestHelper {
  readonly auth: AuthTestHelper;

  constructor(private readonly app: INestApplication) {
    this.auth = new AuthTestHelper(app);
  }

  private get server() {
    return this.app.getHttpServer();
  }

  /**
   * Send requests authenticated with a custom Bearer token.
   */
  withToken(token: string) {
    return {
      get: (url: string) => request(this.server).get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) => request(this.server).post(url).set('Authorization', `Bearer ${token}`),
      put: (url: string) => request(this.server).put(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) =>
        request(this.server).patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) =>
        request(this.server).delete(url).set('Authorization', `Bearer ${token}`),
    };
  }

  /**
   * Authenticated as PRESCRIBER.
   */
  asPrescriber(userId?: string) {
    return this.withToken(this.auth.asPrescriber(userId));
  }

  /**
   * Authenticated as ADMIN.
   */
  asAdmin(userId?: string) {
    return this.withToken(this.auth.asAdmin(userId));
  }

  /**
   * Authenticated as BRAND_MANAGER.
   */
  asBrandManager(userId?: string) {
    return this.withToken(this.auth.asBrandManager(userId));
  }

  /**
   * Public / Unauthenticated request.
   */
  anonymous() {
    return {
      get: (url: string) => request(this.server).get(url),
      post: (url: string) => request(this.server).post(url),
      put: (url: string) => request(this.server).put(url),
      patch: (url: string) => request(this.server).patch(url),
      delete: (url: string) => request(this.server).delete(url),
    };
  }
}
