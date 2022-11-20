import { createApi } from 'unsplash-js';
import { Logger } from './logger';

export class UnsplashApiError extends Error {
  constructor(public readonly statusCode: number, public readonly errors: Array<string>) {
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

type UnsplashPhoto = {
  image: Image;
  photographer: {
    avatar: {
      large: Image;
      medium: Image;
      small: Image;
    };
    name: string;
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
        medium: {
          url: response.response.user.profile_image.medium,
          resolution: {
            width: 64,
            height: 64,
          },
        },
        large: {
          url: response.response.user.profile_image.large,
          resolution: {
            width: 128,
            height: 128,
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

export const getMockedUnsplashPhoto = (): UnsplashPhoto => {
  return {
    photographer: {
      name: 'Nick Night',
      avatar: {
        small: {
          url: 'https://images.unsplash.com/profile-1575888295849-0025f8946dfcimage?ixlib=rb-1.2.1&crop=faces&fit=crop&w=32&h=32',
          resolution: {
            width: 32,
            height: 32,
          },
        },
        medium: {
          url: 'https://images.unsplash.com/profile-1575888295849-0025f8946dfcimage?ixlib=rb-1.2.1&crop=faces&fit=crop&w=64&h=64',
          resolution: {
            width: 64,
            height: 64,
          },
        },
        large: {
          url: 'https://images.unsplash.com/profile-1575888295849-0025f8946dfcimage?ixlib=rb-1.2.1&crop=faces&fit=crop&w=128&h=128',
          resolution: {
            width: 128,
            height: 128,
          },
        },
      },
    },
    webPageUrl: 'https://unsplash.com/photos/y3sKIJqiY40',
    image: {
      url: 'https://images.unsplash.com/photo-1634482895955-712847090dfd?crop=entropy&cs=tinysrgb&fm=jpg&ixid=MnwxNDQwNjN8MHwxfHJhbmRvbXx8fHx8fHx8fDE2NjA4NTA5OTc&ixlib=rb-1.2.1&q=80',
      resolution: {
        width: 3591,
        height: 2394,
      },
    },
  };
};
