"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const abort_controller_1 = __importDefault(require("abort-controller"));
const axios_1 = __importDefault(require("axios"));
const Credentials_1 = __importDefault(require("./Credentials"));
const TwitterError_js_1 = __importDefault(require("./TwitterError.js"));
const TwitterStream_1 = __importDefault(require("./TwitterStream"));
const twitterApi = 'https://api.twitter.com/2/';
class Twitter {
    constructor(args, proxy) {
        const credentials = new Credentials_1.default(args, proxy || '');
        this.proxy = proxy || '';
        this.credentials = credentials;
    }
    async get(endpoint, parameters) {
        var _a;
        const url = twitterApi + endpoint;
        const authHeader = await this.credentials.authorizationHeader(url, {
            method: 'GET',
        });
        try {
            const json = await axios_1.default
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
            const error = TwitterError_js_1.default.fromJson(json);
            if (error) {
                throw error;
            }
            return json;
        }
        catch (e) {
            console.log((_a = e.response) === null || _a === void 0 ? void 0 : _a.data);
            throw e;
        }
    }
    async post(endpoint, body, parameters) {
        const url = twitterApi + endpoint;
        const authHeader = await this.credentials.authorizationHeader(url, {
            method: 'GET',
        });
        const json = await axios_1.default
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
        const error = TwitterError_js_1.default.fromJson(json);
        if (error) {
            throw error;
        }
        return json;
    }
    async delete(endpoint, parameters) {
        const url = twitterApi + endpoint;
        const json = await axios_1.default
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
        const error = TwitterError_js_1.default.fromJson(json);
        if (error) {
            throw error;
        }
        return json;
    }
    stream(endpoint, parameters, options) {
        const abortController = new abort_controller_1.default();
        return new TwitterStream_1.default(async () => {
            const url = twitterApi + endpoint;
            const authorizationHeader = await this.credentials.authorizationHeader(url, {
                method: 'GET',
            });
            console.log(JSON.stringify(authorizationHeader));
            return axios_1.default.get(url, {
                params: parameters,
                responseType: 'arraybuffer',
                withCredentials: true,
                signal: abortController.signal,
                headers: {
                    Authorization: authorizationHeader,
                    'x-requested-with': 'XMLHTTPREQUEST',
                },
            });
        }, () => {
            abortController.abort();
        }, options || {});
    }
}
exports.default = Twitter;
module.exports = Twitter;
