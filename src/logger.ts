import type Toucan from 'toucan-js';
import type { Level } from 'toucan-js';

export class Logger {
  private static sentryClient: Toucan | undefined = undefined;

  public static readonly setSentryClient = (sentryClient: Toucan): void => {
    this.sentryClient = sentryClient;
  };

  public static readonly httpRequest = (url: string, method: string): void => {
    console.info(`[http] Request: ${method.toUpperCase()} ${url}`);

    this.addSentryBreadcrumb({
      type: 'http',
      category: 'request',
      level: 'info',
      data: {
        method: method,
        url: url,
      },
    });
  };

  public static readonly httpResponse = (url: string, method: string, status_code: number): void => {
    console.info(`[http] Response: ${method.toUpperCase()} ${url} [${status_code}]`);

    this.addSentryBreadcrumb({
      type: 'http',
      category: 'response',
      level: 'info',
      data: {
        method: method,
        url: url,
        status_code: status_code,
      },
    });
  };

  public static readonly debug = (category: string, message: string): void => {
    console.debug(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      type: 'debug',
      category: category,
      level: 'debug',
      message: message,
    });
  };

  public static readonly error = (category: string, message: string): void => {
    console.error(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      type: 'error',
      category: category,
      level: 'error',
      message: message,
    });
  };

  public static readonly info = (category: string, message: string): void => {
    console.info(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      type: 'info',
      category: category,
      level: 'info',
      message: message,
    });
  };

  public static readonly warning = (category: string, message: string): void => {
    console.warn(`[${category}] ${message}`);

    this.addSentryBreadcrumb({
      type: 'info',
      category: category,
      level: 'warning',
      message: message,
    });
  };

  private static readonly addSentryBreadcrumb = (event: {
    category: string;
    data?: { [key: string]: unknown };
    level: Level;
    message?: string;
    type: string;
  }): void => {
    if (this.sentryClient === undefined) {
      return;
    }

    this.sentryClient.addBreadcrumb(event);
  };
}
