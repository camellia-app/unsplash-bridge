import { Toucan } from 'toucan-js';

import type { UnsplashPhoto } from './unsplash';

import { Logger } from './logger';
import { UnsplashApiError, getRandomPhotoFromCollection, notifyUnsplashAboutDownload } from './unsplash';

export type Env = {
  APP_VERSION: string;
  ENVIRONMENT_NAME: string;
  SENTRY_DSN: string;
  UNSPLASH_ACCESS_KEY: string;
};

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const sentry = new Toucan({
      context,
      dsn: env.SENTRY_DSN,
      environment: env.ENVIRONMENT_NAME,
      release: env.APP_VERSION,
      request,
      requestDataOptions: {
        allowedCookies: true,
        allowedHeaders: true,
        allowedIps: true,
        allowedSearchParams: true,
      },
    });

    sentry.startSession();

    Logger.setSentryClient(sentry);

    const requestUrl = new URL(request.url);

    try {
      switch (requestUrl.pathname) {
        case '/':
          return healthAction(env.APP_VERSION);

        case '/random-collection-entry': {
          return await randomCollectionEntryAction(context, env.UNSPLASH_ACCESS_KEY, request);
        }

        default:
          return endpointNotFoundResponse();
      }
    } catch (error: unknown) {
      sentry.captureException(error);

      return internalServerErrorResponse();
    } finally {
      sentry.captureSession(true);
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
      detail: description,
      status: status,
      type: type,
      ...additionalProperties,
    }),
    {
      headers: {
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/problem+json; charset=UTF-8',
      },
      status: status,
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

const randomCollectionEntryAction = async (
  context: ExecutionContext,
  unsplashAccessKey: string,
  request: Request,
): Promise<Response> => {
  const requestUrl = new URL(request.url);

  const id = requestUrl.searchParams.get('id');

  if (id === null) {
    return missingRequiredParameterResponse('id');
  }

  if (!/^[0-9]+$/.test(id)) {
    return parameterHasWrongValueResponse('id', 'Parameter should contain numeric ID of Unsplash collection.');
  }

  return await processRandomCollectionEntryLoading(context, unsplashAccessKey, id);
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
  context: ExecutionContext,
  unsplashAccessKey: string,
  collectionId: string,
): Promise<Response> => {
  let photo: UnsplashPhoto;
  let downloadNotificationUrl: string;

  try {
    [downloadNotificationUrl, photo] = await getRandomPhotoFromCollection(unsplashAccessKey, collectionId);
  } catch (error: unknown) {
    if (error instanceof UnsplashApiError) {
      switch (error.statusCode) {
        case 404:
          return apiProblemResponse(400, 'Collection with passed ID not found.', 'collection_not_found');
      }
    }

    throw error;
  }

  context.waitUntil(notifyUnsplashAboutDownload(unsplashAccessKey, downloadNotificationUrl));

  const browserCacheTtl = 60 * 60 * 12; // 12h

  return new Response(JSON.stringify(photo), {
    headers: {
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${browserCacheTtl}, immutable`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
  });
};
