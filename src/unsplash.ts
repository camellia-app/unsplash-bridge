import { createApi } from 'unsplash-js';
import { Logger } from './logger';

export class UnsplashApiError extends Error {
  constructor(public readonly statucCode: number, public readonly errors: Array<string>) {
    super(`Unsplash API returned ${statucCode} with following error messages: ${errors.join(' / ')}`);
  }
}

type Image = {
  resolution: {
    height: number;
    width: number;
  };
  url: string;
};

type UnsplashPhoto = {
  image: Image;
  photographer: {
    avatar: {
      small: Image;
    };
    name: string;
  };
  webPageUrl: string;
};

const getUnsplashClient = (accessKey: string): ReturnType<typeof createApi> => {
  return createApi({
    accessKey: accessKey,
    fetch: async (request: Request | string, requestInitr?: Request | RequestInit): Promise<Response> => {
      const url = typeof request !== 'string' ? request.url : request;
      let method = 'GET';

      if (requestInitr !== undefined && requestInitr.method !== undefined) {
        method = requestInitr.method;
      }

      if (typeof request !== 'string') {
        method = request.method;
      }

      Logger.httpRequest(url, method);

      const response = await fetch(request, requestInitr);

      Logger.httpResponse(url, method, response.status);

      const unsplashApiRateLimitingRemaining = response.headers.get('X-Ratelimit-Remaining');
      const unsplashApiRateLimitingLimit = response.headers.get('X-Ratelimit-Limit');

      if (unsplashApiRateLimitingRemaining !== null && unsplashApiRateLimitingLimit !== null) {
        Logger.info(
          'unsplash',
          `API rate limits: ${unsplashApiRateLimitingRemaining} of ${unsplashApiRateLimitingLimit}`,
        );
      }

      return response;
    },
  });
};

export const getRandomPhotoFromCollection = async (accessKey: string, collectionId: string): Promise<UnsplashPhoto> => {
  const unsplash = getUnsplashClient(accessKey);

  const response = await unsplash.photos.getRandom({
    collectionIds: [collectionId],
  });

  if (response.type === 'error') {
    throw new UnsplashApiError(response.status, response.errors);
  }

  if (Array.isArray(response.response)) {
    throw new UnsplashApiError(response.status, ['Response contains an array, which is not expected here!']);
  }

  Logger.info('unsplash', `Randomly picked photo with ID "${response.response.id}" by ${response.response.user.name}`);

  return {
    photographer: {
      name: response.response.user.name,
      avatar: {
        small: {
          url: response.response.user.profile_image.small,
          resolution: {
            width: 32,
            height: 32,
          },
        },
      },
    },
    webPageUrl: response.response.links.html,
    image: {
      url: response.response.urls.full,
      resolution: {
        width: response.response.width,
        height: response.response.height,
      },
    },
  };
};
