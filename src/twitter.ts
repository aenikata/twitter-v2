import AbortController from 'abort-controller';
import fetch from 'node-fetch';
//import { URL } from 'url';
import { URL } from 'whatwg-url';

import Credentials, { CredentialsArgs } from './Credentials';
import TwitterError from './TwitterError.js';
import TwitterStream, { StreamOptions } from './TwitterStream';

export declare interface RequestParameters {
  [key: string]: string | Array<string> | RequestParameters;
}

function applyParameters(
  url: URL,
  parameters?: RequestParameters,
  prefix?: string
) {
  prefix = prefix || '';

  if (!parameters) {
    return;
  }

  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value == 'object' && value instanceof Array) {
      url.searchParams.set(prefix + key, value.join(','));
    } else if (typeof value == 'object') {
      applyParameters(url, value, `${prefix}${key}.`);
    } else {
      url.searchParams.set(prefix + key, value);
    }
  }
}

export default class Twitter {
  public credentials: Credentials;
  public proxy: string;

  constructor(args: CredentialsArgs, proxy?: string) {
    this.credentials = new Credentials(args);
    this.proxy = proxy || '';
  }

  async get<T extends any>(
    endpoint: string,
    parameters?: RequestParameters
  ): Promise<T> {
    const url = new URL(`${this.proxy}https://api.twitter.com/2/${endpoint}`);
    applyParameters(url, parameters);

    const json = await fetch(url.toString(), {
      headers: {
        Authorization: await this.credentials.authorizationHeader(url, {
          method: 'GET',
        }),
        'x-requested-with': 'XMLHTTPREQUEST',
      },
    }).then((response) => response.json());

    const error = TwitterError.fromJson(json);
    if (error) {
      throw error;
    }

    return json;
  }

  async post<T extends any>(
    endpoint: string,
    body: object,
    parameters?: RequestParameters
  ): Promise<T> {
    const url = new URL(`${this.proxy}https://api.twitter.com/2/${endpoint}`);
    applyParameters(url, parameters);

    const json = await fetch(url.toString(), {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await this.credentials.authorizationHeader(url, {
          method: 'POST',
          body: body,
        }),
        'x-requested-with': 'XMLHTTPREQUEST',
      },
      body: JSON.stringify(body || {}),
    }).then((response) => response.json());

    const error = TwitterError.fromJson(json);
    if (error) {
      throw error;
    }

    return json;
  }

  async delete<T extends any>(
    endpoint: string,
    parameters?: RequestParameters
  ): Promise<T> {
    const url = new URL(`${this.proxy}https://api.twitter.com/2/${endpoint}`);
    applyParameters(url, parameters);

    const json = await fetch(url.toString(), {
      method: 'delete',
      headers: {
        Authorization: await this.credentials.authorizationHeader(url, {
          method: 'DELETE',
        }),
        'x-requested-with': 'XMLHTTPREQUEST',
      },
    }).then((response) => response.json());

    const error = TwitterError.fromJson(json);
    if (error) {
      throw error;
    }

    return json;
  }

  // Stream will not work with a simple CORS proxy as the proxy won't know when to end the connection and will leave it open
  // stream therefore doesn't use the proxy url and will likely fail if a proxy was needed
  stream<T extends any>(
    endpoint: string,
    parameters?: RequestParameters,
    options?: StreamOptions
  ): TwitterStream {
    const abortController = new AbortController();

    return new TwitterStream(
      async () => {
        const url = new URL(`https://api.twitter.com/2/${endpoint}`);
        applyParameters(url, parameters);

        return fetch(url.toString(), {
          signal: abortController.signal,
          headers: {
            Authorization: await this.credentials.authorizationHeader(url, {
              method: 'GET',
            }),
            'x-requested-with': 'XMLHTTPREQUEST',
          },
        });
      },
      () => {
        abortController.abort();
      },
      options || {}
    );
  }
}

module.exports = Twitter;
