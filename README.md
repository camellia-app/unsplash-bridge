# Unsplash Bridge

This repository contains [Cloudflare Worker](https://workers.cloudflare.com) that picks photos from [Unsplash](https://unsplash.com) collections via [Unsplash API](https://unsplash.com/developers).

Cloudflare Workers are like serverless cloud functions, but they also can cache stuff in Cloudflare CDN to make things faster. If you are not familiar with Cloudflare Workers, visit [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/). Or you can just press the button instead:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/camellia-app/unsplash-bridge)

## Motivation

This is a bridge to [Unsplash Image API](https://unsplash.com/developers) which respects [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines).

Current implementation solves following problems:

- Hides [Unsplash API Access Key](https://unsplash.com/documentation#public-authentication) on server side, so you don't need to pass access key to your client-side application, which is not secure and forbidden by [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines).
- Automatically notifies Unsplash about photo downloads, which is also mandatory by Unsplash. It means when a photo is _picked_ or _used_ for something, you should notify Unsplash about this. The worker handles this automatically. See "[Guideline: Triggering a Download](https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download)" for more details.

It was developed to be used for [Camellia](https://github.com/camellia-app/camellia) needs, so the current subset of features is pretty limited.

## API

The bridge exposes following endpoints:

### GET `/random-collection-entry`

Returns random photo from passed Unsplash collection.

It also notifies Unsplash about downloads. See "[Guideline: Triggering a Download](https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download)" for more details.

A response is cached on clients for 12 hours with `Cache-Control` header.

It accepts following query-parameters:

- `id` — collection ID.

Example:

```http
GET https://your-worker-name.workers.dev/random-collection-entry?id=123
```

Returns following JSON in response:

```json
{
  "photographer": {
    "name": "Nick Night",
    "url": "https://unsplash.com/@lvenfoto",
    "avatar": {
      "small": {
        "url": "https://images.unsplash.com/profile-1575888295849-0025f8946dfcimage?ixlib=rb-1.2.1&crop=faces&fit=crop&w=32&h=32",
        "resolution": {
          "width": 32,
          "height": 32
        }
      },
      "medium": {
        "url": "https://images.unsplash.com/profile-1575888295849-0025f8946dfcimage?ixlib=rb-1.2.1&crop=faces&fit=crop&w=64&h=64",
        "resolution": {
          "width": 64,
          "height": 64
        }
      },
      "large": {
        "url": "https://images.unsplash.com/profile-1575888295849-0025f8946dfcimage?ixlib=rb-1.2.1&crop=faces&fit=crop&w=128&h=128",
        "resolution": {
          "width": 128,
          "height": 128
        }
      }
    }
  },
  "webPageUrl": "https://unsplash.com/photos/y3sKIJqiY40",
  "image": {
    "url": "https://images.unsplash.com/photo-1634482895955-712847090dfd?crop=entropy&cs=tinysrgb&fm=jpg&ixid=MnwxNDQwNjN8MHwxfHJhbmRvbXx8fHx8fHx8fDE2NjA4NTA5OTc&ixlib=rb-1.2.1&q=80",
    "resolution": {
      "width": 3591,
      "height": 2394
    }
  }
}
```

## Developing the worker

Clone the repository. Then, install dependencies:

```bash
npm ci
```

Start webpack:

```bash
webpack watch
```

Open another terminal and then run the worker in development mode:

```bash
wrangler dev
```
