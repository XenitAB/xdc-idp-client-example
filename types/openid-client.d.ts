declare module "openid-client" {
  import passport = require("passport");

  class Client {
    constructor(a: {
      redirect_uri: string;
      client_id: string;
      token_endpoint_auth_method: string;
      client_secret: string;
    });
  }

  export class Issuer {
    static discover(
      url: string
    ): Promise<{
      Client: typeof Client;
    }>;
  }

  interface StrategyConfig {
    client: Client;
    params: {
      client_id: string;
      redirect_uri: string;
      scope: string;
      response_type: string;
      state: string;
      [key: string]: string;
    };
  }

  interface StrategyCallback {
    (
      tokenset: any,
      userinfo: any,
      done: (e: Error | null, payload: any) => any
    ): any;
  }

  export class Strategy extends passport.Strategy {
    constructor(config: StrategyConfig, callback: StrategyCallback);
  }
}
