import Toucan from 'toucan-js';
import { Logger } from './logger';
import { getMockedUnsplashPhoto, getRandomPhotoFromCollection } from './unsplash';

declare const APP_VERSION: string;
declare const ENVIRONMENT_NAME: string;
declare const SENTRY_DSN: string;
declare const UNSPLASH_ACCESS_KEY: string;

addEventListener('fetch', (event) => {
  const sentry = new Toucan({
    dsn: SENTRY_DSN,
    release: APP_VERSION,
    environment: ENVIRONMENT_NAME,
    context: event,
    allowedCookies: /(.*)/,
    allowedHeaders: /(.*)/,
    allowedSearchParams: /(.*)/,
    rewriteFrames: {
      root: '/',
    },
  });

  const request = event.request;

  const clientIp = request.headers.get('cf-connecting-ip');

  Logger.setSentryClient(sentry);

  if (clientIp !== null) {
    sentry.setUser({
      ip_address: clientIp,
    });
  }

  event.respondWith(
    (async (): Promise<Response> => {
      const requestUrl = new URL(request.url);

      try {
        switch (requestUrl.pathname) {
          case '/':
            return healthAction(APP_VERSION);

          case '/random-collection-entry':
            return await randomCollectionEntryAction(UNSPLASH_ACCESS_KEY, request);

          default:
            return endpointNotFoundResponse();
        }
      } catch (error: unknown) {
        sentry.captureException(error);

        return internalServerErrorResponse();
      }
    })(),
  );
});

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

  const useMockedPhotoResponse = requestUrl.searchParams.get('mock') === '1';

  return await processRandomCollectionEntryLoading(unsplashAccessKey, id, useMockedPhotoResponse);
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
  useMockedPhotoResponse: boolean,
): Promise<Response> => {
  const entry = useMockedPhotoResponse
    ? getMockedUnsplashPhoto()
    : await getRandomPhotoFromCollection(unsplashAccessKey, collectionId);

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
