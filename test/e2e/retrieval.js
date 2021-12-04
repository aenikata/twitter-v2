import { expect } from 'chai';

import Twitter from '../../src/twitter';
import axios from 'axios';
import Credentials from '../../src/credentials';

// describe('Bare Axios->Twitter Test', () => {
//   it('Should us Axios to get tweets with bearer token', async () => {
//     const params = {};

//     const args = {
//       bearer_token: process.env.TWITTER_BEARER_TOKEN,
//     };
//     const credentials = new Credentials(args);
//     const url =
//       'https://api.twitter.com/2/tweets/search/recent?query=@aenikata';
//     const authHeader = await credentials.authorizationHeader(url, {
//       method: 'GET',
//     });

//     var result = await axios
//       .get(url, {
//         params,
//         withCredentials: true,
//         headers: {
//           Authorization: authHeader,
//         },
//       })
//       .catch((e) => console.log(e.response.data));

//     expect(result.data.data.length).to.not.equal(0);
//   });
// });

// describe('Bare Axios->Twitter Test 2', () => {
//   it('Should us Axios to get tweets with bearer token', async () => {
//     const params = {
//       query: '@aenikata',
//     };

//     const args = {
//       bearer_token: process.env.TWITTER_BEARER_TOKEN,
//     };
//     const credentials = new Credentials(args);
//     const url = 'https://api.twitter.com/2/tweets/search/recent';
//     const authHeader = await credentials.authorizationHeader(url, {
//       method: 'GET',
//     });

//     var result = await axios
//       .get(url, {
//         params,
//         withCredentials: true,
//         headers: {
//           Authorization: authHeader,
//           'x-requested-with': 'XMLHTTPREQUEST',
//         },
//       })
//       .catch((e) => console.log(e.response.data));

//     expect(result.data.data.length).to.not.equal(0);
//   });
// });

if (!process.env.TWITTER_DISABLE_E2E) {
  describe('e2e retrieval', () => {
    it('should retrieve tweets with bearer token', async () => {
      const client = new Twitter(
        {
          bearer_token: process.env.TWITTER_BEARER_TOKEN,
        },
        process.env.PROXY_URL
      );

      // Tweet Lookup API Reference: https://bit.ly/2QF58Kw
      const { data: tweet, errors } = await client.get('tweets/search/recent', {
        query: '@aenikata',
        expansions: 'author_id',
        'tweet.fields': 'author_id,created_at',
      });

      expect(errors).to.be.undefined;
      console.log(tweet);
      expect(tweet[0]).to.include({
        author_id: '310747082',
        // created_at: '2020-02-14T19:00:55.000Z',
        // id: '1228393702244134912',
      });
    });

    // it('should retrieve tweets with consumer tokens', async () => {
    //   const client = new Twitter(
    //     {
    //       consumer_key: process.env.TWITTER_CONSUMER_KEY,
    //       consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    //     },
    //     process.env.PROXY_URL
    //   );

    //   // Tweet Lookup API Reference: https://bit.ly/2QF58Kw
    //   const { data: tweet, errors } = await client.get('tweets', {
    //     ids: '1228393702244134912',
    //     'tweet.fields': 'created_at,entities,public_metrics,author_id',
    //   });

    //   expect(errors).to.be.undefined;
    //   expect(tweet[0]).to.include({
    //     author_id: '2244994945',
    //     created_at: '2020-02-14T19:00:55.000Z',
    //     id: '1228393702244134912',
    //   });
    // });
  });
}
