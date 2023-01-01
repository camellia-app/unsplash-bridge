import { Toucan } from 'toucan-js';
import { Logger } from './logger';
import { getRandomPhotoFromCollection } from './unsplash';

export type Env = {
  APP_VERSION: string;
  ENVIRONMENT_NAME: string;
  SENTRY_DSN: string;
  UNSPLASH_ACCESS_KEY: string;
};

export const worker = {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const sentry = new Toucan({
      dsn: env.SENTRY_DSN,
      release: env.APP_VERSION,
      environment: env.ENVIRONMENT_NAME,
      context,
      request,
      requestDataOptions: {
        allowedCookies: true,
        allowedHeaders: true,
        allowedSearchParams: true,
        allowedIps: true,
      },
    });

    const cache = caches.default;

    Logger.setSentryClient(sentry);

    const requestUrl = new URL(request.url);

    try {
      switch (requestUrl.pathname) {
        case '/':
          return healthAction(env.APP_VERSION);

        case '/random-collection-entry': {
          const cacheUrl = new URL(request.url);
          const cacheKey = new Request(cacheUrl.toString(), request);

          let response = await cache.match(cacheKey);

          if (response === undefined) {
            response = await randomCollectionEntryAction(env.UNSPLASH_ACCESS_KEY, request);

            context.waitUntil(cache.put(cacheKey, response.clone()));
          }

          return response;
        }

        default:
          return endpointNotFoundResponse();
      }
    } catch (error: unknown) {
      sentry.captureException(error);

      return internalServerErrorResponse();
    }
  },
};

const apiProblemResponse = (
  status: number,
  description: string,
  type: string,
  additionalProperties?: { [key: string]: unknown },
): Response => {
  return new Response(
    JSON.stringify({
      status: status,
      type: type,
      detail: description,
      ...additionalProperties,
    }),
    {
      status: status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Type': 'application/problem+json; charset=UTF-8',
      },
    },
  );
};

const healthAction = (appVersion: string): Response => {
  return new Response(
    JSON.stringify({
      releaseId: appVersion,
      status: 'pass',
    }),
    {
      headers: {
        'Content-Type': 'application/health+json; charset=UTF-8',
      },
    },
  );
};

const randomCollectionEntryAction = async (unsplashAccessKey: string, request: Request): Promise<Response> => {
  const requestUrl = new URL(request.url);

  const id = requestUrl.searchParams.get('id');

  if (id === null) {
    return missingRequiredParameterResponse('id');
  }

  if (!/^[0-9]+$/.test(id)) {
    return parameterHasWrongValueResponse('id', 'Parameter should contain numeric ID of Unsplash collection.');
  }

  return await processRandomCollectionEntryLoading(unsplashAccessKey, id);
};

const missingRequiredParameterResponse = (parameterName: string): Response => {
  return apiProblemResponse(400, `Missing required query-parameter: ${parameterName}`, 'missing_required_parameter');
};

const parameterHasWrongValueResponse = (parameterName: string, problem: string): Response => {
  return apiProblemResponse(
    400,
    `Query-parameter "${parameterName}" has wrong value: ${problem}`,
    'parameter_has_wrong_value',
  );
};

const endpointNotFoundResponse = (): Response => {
  return apiProblemResponse(404, `The requested URL does not exist.`, 'endpoint_not_found');
};

const internalServerErrorResponse = (): Response => {
  return apiProblemResponse(500, `Something went wrong.`, 'internal_server_error');
};

const processRandomCollectionEntryLoading = async (
  unsplashAccessKey: string,
  collectionId: string,
): Promise<Response> => {
  const entry = await getRandomPhotoFromCollection(unsplashAccessKey, collectionId);

  const browserCacheTtl = 60 * 60 * 12; // 12h
  const cdnCacheTtl = 60 * 60 * 12; // 12h

  return new Response(JSON.stringify(entry), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': `public, max-age=${browserCacheTtl}, s-maxage=${cdnCacheTtl}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
  });
};
