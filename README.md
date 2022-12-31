# Unsplash Bridge

This repository contains [Cloudflare Worker](https://workers.cloudflare.com) that picks photos from [Unsplash](https://unsplash.com) collections via [Unsplash API](https://unsplash.com/developers).

Cloudflare Workers are like serverless cloud functions, but they also can cache stuff in Cloudflare CDN to make things faster. If you are not familiar with Cloudflare Workers, visit [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/). Or you can just press the button instead:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/camellia-app/unsplash-bridge)

## API

The bridge exposes following endpoints:

### GET `/random-collection-entry`

Returns random photo from passed Unsplash collection.

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
