import { Agent, OutgoingHttpHeaders } from "http";
import { RequestOptions } from "https"; // TYPES ONLY
import { parse } from "url";
import { HTTPMethod } from "../common/constants";
import { ConnectionPolicy } from "../documents";
import { GlobalEndpointManager } from "../globalEndpointManager";
import { CosmosHeaders } from "../queryExecutionContext/CosmosHeaders";
import * as RetryUtility from "../retry/retryUtility";
import { bodyFromData } from "./request";
import { RequestContext } from "./RequestContext";
import { Response } from "./Response";
/** @hidden */
export class RequestHandler {
  public constructor(
    private globalEndpointManager: GlobalEndpointManager,
    private connectionPolicy: ConnectionPolicy,
    private requestAgent: Agent
  ) {}

  /**
   *  Creates the request object, call the passed callback when the response is retrieved.
   * @param {object} globalEndpointManager - an instance of GlobalEndpointManager class.
   * @param {object} connectionPolicy - an instance of ConnectionPolicy that has the connection configs.
   * @param {object} requestAgent - the https agent used for send request
   * @param {string} method - the http request method ( 'get', 'post', 'put', .. etc ).
   * @param {String} hostname - The base url for the endpoint.
   * @param {string} path - the path of the requesed resource.
   * @param {Object} data - the request body. It can be either string, buffer, or undefined.
   * @param {Object} queryParams - query parameters for the request.
   * @param {Object} headers - specific headers for the request.
   * @param {function} callback - the callback that will be called when the response is retrieved and processed.
   */
  public static async request(
    globalEndpointManager: GlobalEndpointManager,
    connectionPolicy: ConnectionPolicy,
    requestAgent: Agent,
    method: HTTPMethod,
    hostname: string,
    request: RequestContext,
    data: string | Buffer,
    headers: CosmosHeaders,
    abortSignal: AbortSignal
  ): Promise<Response<any>> {
    // TODO: any
    const path = (request as { path: string }).path === undefined ? request : (request as { path: string }).path;
    let body: any; // TODO: any

    if (data) {
      body = bodyFromData(data);
      if (!body) {
        return {
          result: {
            message: "parameter data must be a javascript object, string, or Buffer"
          },
          headers: undefined
        };
      }
    }

    const requestOptions: RequestOptions = parse(hostname);
    requestOptions.method = method;
    requestOptions.path += path;
    requestOptions.headers = headers as OutgoingHttpHeaders;
    requestOptions.agent = requestAgent;
    requestOptions.secureProtocol = "TLSv1_client_method"; // TODO: Should be a constant

    if (connectionPolicy.disableSSLVerification === true) {
      requestOptions.rejectUnauthorized = false;
    }

    return RetryUtility.execute({
      globalEndpointManager,
      body,
      connectionPolicy,
      requestOptions,
      request,
      abortSignal
    });
  }

  /** @ignore */
  public get(urlString: string, request: RequestContext, headers: CosmosHeaders, abortSignal: AbortSignal) {
    // TODO: any
    return RequestHandler.request(
      this.globalEndpointManager,
      this.connectionPolicy,
      this.requestAgent,
      HTTPMethod.get,
      urlString,
      request,
      undefined,
      headers,
      abortSignal
    );
  }

  /** @ignore */
  public post(urlString: string, request: RequestContext, body: any, headers: CosmosHeaders, abortSignal: AbortSignal) {
    // TODO: any
    return RequestHandler.request(
      this.globalEndpointManager,
      this.connectionPolicy,
      this.requestAgent,
      HTTPMethod.post,
      urlString,
      request,
      body,
      headers,
      abortSignal
    );
  }

  /** @ignore */
  public put(urlString: string, request: RequestContext, body: any, headers: CosmosHeaders, abortSignal: AbortSignal) {
    // TODO: any
    return RequestHandler.request(
      this.globalEndpointManager,
      this.connectionPolicy,
      this.requestAgent,
      HTTPMethod.put,
      urlString,
      request,
      body,
      headers,
      abortSignal
    );
  }

  /** @ignore */
  public delete(urlString: string, request: RequestContext, headers: CosmosHeaders, abortSignal: AbortSignal) {
    return RequestHandler.request(
      this.globalEndpointManager,
      this.connectionPolicy,
      this.requestAgent,
      HTTPMethod.delete,
      urlString,
      request,
      undefined,
      headers,
      abortSignal
    );
  }
}
