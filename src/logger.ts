import type { SeverityLevel } from '@sentry/types/types/severity';
import type { Toucan } from 'toucan-js';

export class Logger {
  public static readonly debug = (category: string, message: string): void => {
    console.debug(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      category: category,
      level: 'debug',
      message: message,
      type: 'debug',
    });
  };

  public static readonly error = (category: string, message: string): void => {
    console.error(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      category: category,
      level: 'error',
      message: message,
      type: 'error',
    });
  };

  public static readonly httpRequest = (url: string, method: string): void => {
    console.info(`[http] Request: ${method.toUpperCase()} ${url}`);

    this.addSentryBreadcrumb({
      category: 'request',
      data: {
        method: method,
        url: url,
      },
      level: 'info',
      type: 'http',
    });
  };

  public static readonly httpResponse = (url: string, method: string, status_code: number): void => {
    console.info(`[http] Response: ${method.toUpperCase()} ${url} [${status_code}]`);

    this.addSentryBreadcrumb({
      category: 'response',
      data: {
        method: method,
        status_code: status_code,
        url: url,
      },
      level: 'info',
      type: 'http',
    });
  };

  public static readonly info = (category: string, message: string): void => {
    console.info(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      category: category,
      level: 'info',
      message: message,
      type: 'info',
    });
  };

  public static readonly setSentryClient = (sentryClient: Toucan): void => {
    this.sentryClient = sentryClient;
  };

  public static readonly warning = (category: string, message: string): void => {
    console.warn(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      category: category,
      level: 'warning',
      message: message,
      type: 'info',
    });
  };

  private static readonly addSentryBreadcrumb = (event: {
    category: string;
    data?: { [key: string]: unknown };
    level: SeverityLevel;
    message?: string;
    type: string;
  }): void => {
    if (this.sentryClient === undefined) {
      return;
    }

    this.sentryClient.addBreadcrumb(event);
  };

  private static sentryClient: Toucan | undefined = undefined;
}
