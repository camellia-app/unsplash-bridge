import { createApi } from 'unsplash-js';

import { Logger } from './logger';

export class UnsplashApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errors: Array<string>,
  ) {
    super(`Unsplash API returned ${statusCode} with following error messages: ${errors.join(' / ')}`);
  }
}

type Image = {
  resolution: {
    height: number;
    width: number;
  };
  url: string;
};

export type UnsplashPhoto = {
  image: Image;
  photographer: {
    avatar: {
      large: Image;
      medium: Image;
      small: Image;
    };
    name: string;
    url: string;
  };
  webPageUrl: string;
};

const getUnsplashClient = (accessKey: string): ReturnType<typeof createApi> => {
  return createApi({
    accessKey: accessKey,
    fetch: async (request, requestInitr) => {
      let url = '';

      if (typeof request === 'string') {
        url = request;
      } else if (request instanceof URL) {
        url = request.toString();
      } else {
        url = request.url;
      }

      let method = 'GET';

      if (requestInitr !== undefined && requestInitr.method !== undefined) {
        method = requestInitr.method;
      }

      if (typeof request !== 'string' && 'method' in request) {
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
export const notifyUnsplashAboutDownload = async (accessKey: string, downloadUrl: string): Promise<void> => {
  const unsplash = getUnsplashClient(accessKey);

  const response = await unsplash.photos.trackDownload({
    downloadLocation: downloadUrl,
  });

  if (response.type === 'error') {
    throw new UnsplashApiError(response.status, response.errors);
  }

  Logger.info('unsplash', `Notified about downloading by URL "${downloadUrl}"`);
};

export const getRandomPhotoFromCollection = async (
  accessKey: string,
  collectionId: string,
): Promise<[string, UnsplashPhoto]> => {
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

  return [
    response.response.links.download_location,
    {
      image: {
        resolution: {
          height: response.response.height,
          width: response.response.width,
        },
        url: response.response.urls.full,
      },
      photographer: {
        avatar: {
          large: {
            resolution: {
              height: 128,
              width: 128,
            },
            url: response.response.user.profile_image.large,
          },
          medium: {
            resolution: {
              height: 64,
              width: 64,
            },
            url: response.response.user.profile_image.medium,
          },
          small: {
            resolution: {
              height: 32,
              width: 32,
            },
            url: response.response.user.profile_image.small,
          },
        },
        name: response.response.user.name,
        url: response.response.user.links.html,
      },
      webPageUrl: response.response.links.html,
    },
  ];
};
