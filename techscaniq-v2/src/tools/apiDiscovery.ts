import axios from 'axios';
import { GraphQLClient } from 'graphql-request';
import { OpenAPIV3 } from 'openapi-types';

interface APIEndpoint {
  url: string;
  method: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  authentication?: string[];
  rateLimit?: RateLimitInfo;
  examples?: any[];
}

interface GraphQLSchema {
  queries: string[];
  mutations: string[];
  subscriptions: string[];
  types: any[];
}

interface RateLimitInfo {
  limit: number;
  window: string;
  remaining?: number;
}

interface APIDiscoveryResult {
  baseUrl: string;
  version?: string;
  type: 'REST' | 'GraphQL' | 'WebSocket' | 'gRPC' | 'Mixed';
  endpoints: APIEndpoint[];
  authentication: {
    methods: string[];
    oauth?: OAuthInfo;
    apiKey?: APIKeyInfo;
  };
  documentation?: {
    swagger?: string;
    postman?: string;
    graphql?: string;
  };
  sdks: string[];
  webhooks?: WebhookInfo[];
  rateLimits?: RateLimitInfo;
  technicalDetails: {
    cors: boolean;
    compression: string[];
    caching: string[];
    monitoring: string[];
  };
}

interface OAuthInfo {
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  providers?: string[];
}

interface APIKeyInfo {
  location: 'header' | 'query' | 'cookie';
  name: string;
}

interface WebhookInfo {
  url: string;
  events: string[];
  authentication?: string;
}

export class APIDiscovery {
  private axiosInstance = axios.create({
    timeout: 10000,
    validateStatus: () => true, // Don't throw on any status
  });

  async discoverAPIs(baseUrl: string): Promise<APIDiscoveryResult> {
    console.log(`🔍 Discovering APIs for ${baseUrl}`);

    const result: APIDiscoveryResult = {
      baseUrl,
      type: 'REST',
      endpoints: [],
      authentication: { methods: [] },
      sdks: [],
      technicalDetails: {
        cors: false,
        compression: [],
        caching: [],
        monitoring: [],
      },
    };

    try {
      // Check common API documentation endpoints
      const [swagger, graphql, postman] = await Promise.allSettled([
        this.checkSwagger(baseUrl),
        this.checkGraphQL(baseUrl),
        this.checkPostmanDocs(baseUrl),
      ]);

      if (swagger.status === 'fulfilled' && swagger.value) {
        result.documentation = { ...result.documentation, swagger: swagger.value.url };
        result.endpoints.push(...swagger.value.endpoints);
        result.version = swagger.value.version;
      }

      if (graphql.status === 'fulfilled' && graphql.value) {
        result.type = result.endpoints.length > 0 ? 'Mixed' : 'GraphQL';
        result.documentation = { ...result.documentation, graphql: graphql.value.url };
      }

      // Probe common API patterns
      const commonEndpoints = await this.probeCommonEndpoints(baseUrl);
      result.endpoints.push(...commonEndpoints);

      // Check authentication methods
      result.authentication = await this.detectAuthentication(baseUrl, result.endpoints);

      // Check rate limiting
      result.rateLimits = await this.checkRateLimits(baseUrl);

      // Analyze technical details
      result.technicalDetails = await this.analyzeTechnicalDetails(baseUrl);

      // Discover SDKs
      result.sdks = await this.discoverSDKs(baseUrl);

      return result;
    } catch (error) {
      console.error('API discovery error:', error);
      return result;
    }
  }

  private async checkSwagger(baseUrl: string): Promise<{
    url: string;
    endpoints: APIEndpoint[];
    version?: string;
  } | null> {
    const swaggerPaths = [
      '/swagger.json',
      '/swagger/v1/swagger.json',
      '/api-docs',
      '/api/swagger.json',
      '/v1/swagger.json',
      '/v2/swagger.json',
      '/v3/api-docs',
      '/openapi.json',
    ];

    for (const path of swaggerPaths) {
      try {
        const response = await this.axiosInstance.get(`${baseUrl}${path}`);
        if (response.status === 200 && response.data) {
          const spec = response.data as OpenAPIV3.Document;
          
          if (spec.openapi || (spec as any).swagger) {
            const endpoints = this.parseOpenAPISpec(spec);
            return {
              url: `${baseUrl}${path}`,
              endpoints,
              version: spec.info?.version,
            };
          }
        }
      } catch (error) {
        // Continue to next path
      }
    }

    return null;
  }

  private parseOpenAPISpec(spec: any): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];
    
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
            endpoints.push({
              url: path,
              method: method.toUpperCase(),
              parameters: details.parameters,
              requestBody: details.requestBody,
              responses: details.responses,
              authentication: details.security?.map((s: any) => Object.keys(s)[0]),
            });
          }
        });
      });
    }

    return endpoints;
  }

  private async checkGraphQL(baseUrl: string): Promise<{
    url: string;
    schema?: GraphQLSchema;
  } | null> {
    const graphqlPaths = ['/graphql', '/api/graphql', '/v1/graphql'];

    for (const path of graphqlPaths) {
      try {
        const client = new GraphQLClient(`${baseUrl}${path}`);
        
        // Try introspection query
        const introspectionQuery = `
          {
            __schema {
              types {
                name
                kind
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `;

        const data = await client.request(introspectionQuery);
        
        if ((data as any).__schema) {
          return {
            url: `${baseUrl}${path}`,
            schema: this.parseGraphQLSchema((data as any).__schema),
          };
        }
      } catch (error) {
        // Continue to next path
      }
    }

    return null;
  }

  private parseGraphQLSchema(schema: any): GraphQLSchema {
    const result: GraphQLSchema = {
      queries: [],
      mutations: [],
      subscriptions: [],
      types: [],
    };

    const queryType = schema.types.find((t: any) => t.name === 'Query');
    const mutationType = schema.types.find((t: any) => t.name === 'Mutation');
    const subscriptionType = schema.types.find((t: any) => t.name === 'Subscription');

    if (queryType?.fields) {
      result.queries = queryType.fields.map((f: any) => f.name);
    }
    if (mutationType?.fields) {
      result.mutations = mutationType.fields.map((f: any) => f.name);
    }
    if (subscriptionType?.fields) {
      result.subscriptions = subscriptionType.fields.map((f: any) => f.name);
    }

    result.types = schema.types
      .filter((t: any) => !t.name.startsWith('__'))
      .map((t: any) => ({ name: t.name, kind: t.kind }));

    return result;
  }

  private async checkPostmanDocs(baseUrl: string): Promise<string | null> {
    // Check if Postman documentation is available
    try {
      const response = await this.axiosInstance.get(`${baseUrl}/postman/collection.json`);
      if (response.status === 200) {
        return `${baseUrl}/postman/collection.json`;
      }
    } catch (error) {
      // Not found
    }
    return null;
  }

  private async probeCommonEndpoints(baseUrl: string): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = [];
    
    const commonPatterns = [
      { path: '/api/v1/health', method: 'GET' },
      { path: '/api/v1/status', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/auth/login', method: 'POST' },
      { path: '/api/v1/auth/logout', method: 'POST' },
      { path: '/api/v1/auth/refresh', method: 'POST' },
      { path: '/api/v1/search', method: 'GET' },
      { path: '/api/v1/config', method: 'GET' },
      { path: '/api/metrics', method: 'GET' },
      { path: '/.well-known/openid-configuration', method: 'GET' },
    ];

    const probes = commonPatterns.map(async ({ path, method }) => {
      try {
        const response = await this.axiosInstance({
          method,
          url: `${baseUrl}${path}`,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.status < 500) {
          return {
            url: path,
            method,
            responses: {
              [response.status]: {
                description: response.statusText,
                headers: response.headers,
              },
            },
          };
        }
      } catch (error) {
        // Endpoint doesn't exist
      }
      return null;
    });

    const results = await Promise.all(probes);
    return results.filter(r => r !== null) as APIEndpoint[];
  }

  private async detectAuthentication(
    baseUrl: string,
    endpoints: APIEndpoint[]
  ): Promise<APIDiscoveryResult['authentication']> {
    const auth: APIDiscoveryResult['authentication'] = {
      methods: [],
    };

    // Check for OAuth endpoints
    const oauthEndpoints = endpoints.filter(e => 
      e.url.includes('oauth') || e.url.includes('authorize') || e.url.includes('token')
    );

    if (oauthEndpoints.length > 0) {
      auth.methods.push('OAuth2');
      auth.oauth = {
        authorizationUrl: oauthEndpoints.find(e => e.url.includes('authorize'))?.url,
        tokenUrl: oauthEndpoints.find(e => e.url.includes('token'))?.url,
      };
    }

    // Check for API key authentication
    const apiKeyEndpoints = endpoints.filter(e => 
      e.parameters?.some(p => p.name?.toLowerCase().includes('key') || p.name?.toLowerCase().includes('token'))
    );

    if (apiKeyEndpoints.length > 0) {
      auth.methods.push('API Key');
      const keyParam = apiKeyEndpoints[0].parameters?.find(p => 
        p.name?.toLowerCase().includes('key') || p.name?.toLowerCase().includes('token')
      );
      
      auth.apiKey = {
        location: keyParam?.in || 'header',
        name: keyParam?.name || 'api-key',
      };
    }

    // Check for JWT
    if (endpoints.some(e => e.url.includes('jwt') || e.authentication?.includes('bearer'))) {
      auth.methods.push('JWT');
    }

    // Check for Basic Auth
    try {
      const response = await this.axiosInstance.get(`${baseUrl}/api/v1/test`, {
        validateStatus: (status) => status === 401,
      });
      
      if (response.headers['www-authenticate']?.includes('Basic')) {
        auth.methods.push('Basic Auth');
      }
    } catch (error) {
      // Ignore
    }

    return auth;
  }

  private async checkRateLimits(baseUrl: string): Promise<RateLimitInfo | undefined> {
    try {
      const response = await this.axiosInstance.get(`${baseUrl}/api/v1/test`);
      
      const rateLimitHeaders = {
        limit: response.headers['x-ratelimit-limit'] || response.headers['x-rate-limit-limit'],
        remaining: response.headers['x-ratelimit-remaining'] || response.headers['x-rate-limit-remaining'],
        reset: response.headers['x-ratelimit-reset'] || response.headers['x-rate-limit-reset'],
      };

      if (rateLimitHeaders.limit) {
        return {
          limit: parseInt(rateLimitHeaders.limit),
          window: 'hour',
          remaining: rateLimitHeaders.remaining ? parseInt(rateLimitHeaders.remaining) : undefined,
        };
      }
    } catch (error) {
      // No rate limit info
    }

    return undefined;
  }

  private async analyzeTechnicalDetails(baseUrl: string): Promise<APIDiscoveryResult['technicalDetails']> {
    const details: APIDiscoveryResult['technicalDetails'] = {
      cors: false,
      compression: [],
      caching: [],
      monitoring: [],
    };

    try {
      // Check CORS
      const corsResponse = await this.axiosInstance.options(`${baseUrl}/api/v1/test`);
      if (corsResponse.headers['access-control-allow-origin']) {
        details.cors = true;
      }

      // Check compression
      const response = await this.axiosInstance.get(`${baseUrl}/api/v1/test`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      const encoding = response.headers['content-encoding'];
      if (encoding) {
        details.compression = encoding.split(',').map((e: string) => e.trim());
      }

      // Check caching
      if (response.headers['cache-control']) {
        details.caching.push('Cache-Control');
      }
      if (response.headers['etag']) {
        details.caching.push('ETag');
      }

      // Check monitoring headers
      if (response.headers['x-request-id']) {
        details.monitoring.push('Request ID tracking');
      }
      if (response.headers['x-trace-id']) {
        details.monitoring.push('Distributed tracing');
      }

    } catch (error) {
      // Ignore errors
    }

    return details;
  }

  private async discoverSDKs(baseUrl: string): Promise<string[]> {
    const sdks: string[] = [];

    // Check for SDK documentation or downloads
    const sdkPaths = [
      '/sdk',
      '/sdks',
      '/developers/sdk',
      '/api/sdk',
      '/downloads/sdk',
    ];

    for (const path of sdkPaths) {
      try {
        const response = await this.axiosInstance.get(`${baseUrl}${path}`);
        if (response.status === 200) {
          // Parse response for SDK mentions
          const content = JSON.stringify(response.data).toLowerCase();
          
          if (content.includes('javascript') || content.includes('npm')) {
            sdks.push('JavaScript/Node.js');
          }
          if (content.includes('python') || content.includes('pip')) {
            sdks.push('Python');
          }
          if (content.includes('java') || content.includes('maven')) {
            sdks.push('Java');
          }
          if (content.includes('ruby') || content.includes('gem')) {
            sdks.push('Ruby');
          }
          if (content.includes('php') || content.includes('composer')) {
            sdks.push('PHP');
          }
          if (content.includes('dotnet') || content.includes('nuget')) {
            sdks.push('.NET');
          }
        }
      } catch (error) {
        // Continue
      }
    }

    return [...new Set(sdks)];
  }

  async testAPIEndpoint(
    endpoint: APIEndpoint,
    baseUrl: string,
    auth?: any
  ): Promise<{
    success: boolean;
    status: number;
    responseTime: number;
    data?: any;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.axiosInstance({
        method: endpoint.method,
        url: `${baseUrl}${endpoint.url}`,
        headers: auth?.headers || {},
        params: auth?.params || {},
      });

      return {
        success: response.status < 400,
        status: response.status,
        responseTime: Date.now() - startTime,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}