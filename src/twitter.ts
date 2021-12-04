import AbortController from 'abort-controller';
import axios, { AxiosInstance } from 'axios';
import Credentials, { CredentialsArgs } from './Credentials';
import TwitterError from './TwitterError.js';
import TwitterStream, { StreamOptions } from './TwitterStream';

export declare interface RequestParameters {
  [key: string]: string | Array<string> | RequestParameters;
}

const twitterApi = 'https://api.twitter.com/2/';

export default class Twitter {
  public credentials: Credentials;
  public proxy: string;

  constructor(args: CredentialsArgs, proxy?: string) {
    const credentials = new Credentials(args, proxy || '');
    this.proxy = proxy || '';
    this.credentials = credentials;
  }

  async get<T extends any>(
    endpoint: string,
    parameters?: RequestParameters
  ): Promise<T> {
    const url = twitterApi + endpoint;
    const authHeader = await this.credentials.authorizationHeader(url, {
      method: 'GET',
    });
    try {
      const json = await axios
        .get(this.proxy + url, {
          params: parameters,
          withCredentials: true,
          headers: {
            Authorization: authHeader,
            'x-requested-with': 'XMLHTTPREQUEST',
          },
        })
        .then((response) => {
          return response.data;
        });

      const error = TwitterError.fromJson(json);
      if (error) {
        throw error;
      }
      return json;
    } catch (e) {
      console.log(e.response?.data);
      throw e;
    }
  }

  async post<T extends any>(
    endpoint: string,
    body: object,
    parameters?: RequestParameters
  ): Promise<T> {
    const url = twitterApi + endpoint;
    const authHeader = await this.credentials.authorizationHeader(url, {
      method: 'GET',
    });

    const json = await axios
      .post(this.proxy + url, {
        params: parameters,
        withCredentials: true,
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHTTPREQUEST',
        },
        body: JSON.stringify(body || {}),
      })
      .then((response) => response.data);

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
    const url = twitterApi + endpoint;
    const json = await axios
      .delete(this.proxy + url, {
        params: parameters,
        withCredentials: true,
        headers: {
          Authorization: await this.credentials.authorizationHeader(url, {
            method: 'DELETE',
          }),
          'x-requested-with': 'XMLHTTPREQUEST',
        },
      })
      .then((response) => response.data);

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
        const url = twitterApi + endpoint;
        const authorizationHeader = await this.credentials.authorizationHeader(
          url,
          {
            method: 'GET',
          }
        );
        console.log(JSON.stringify(authorizationHeader));
        return axios.get(url, {
          params: parameters,
          responseType: 'arraybuffer',
          withCredentials: true,
          signal: abortController.signal,
          headers: {
            Authorization: authorizationHeader,
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
