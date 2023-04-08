/*
 * Copyright (c) 2023 FinancialForce.com, inc. All rights reserved.
 */

import {
  AuthInfo,
  ConfigAggregator,
  Connection,
  OrgConfigProperties,
  StateAggregator,
} from '@salesforce/core';
import {
  ConnectionOptions as RawConnectionOptions,
  Connection as RawConnection,
} from 'jsforce';

type RefreshTokenFn = (
  conn: RawConnection,
  callback: (err: Error | null, accessToken: string, res?: unknown) => void
) => unknown;

// callOptions id - shown in log files
const client = '@apexdevtools/sfdx-auth-helper';

export class AuthHelper {
  /*
   * In a VSCode context with multiple workspace folders, the config aggregator can only create once.
   * The created value is cached to `ConfigAggregator.instance` static.
   *
   * `workspace.workspaceFolders[0].uri.fsPath` should be passed in if available.
   * All connections will refer to the org specified by the first workspace config.
   */
  private config!: ConfigAggregator;

  public static instance(workspacePath: string): Promise<AuthHelper> {
    return new AuthHelper().init(workspacePath);
  }

  /**
   * Transforms an existing core library connection into a 'legacy' jsforce one.
   * Refresh token behaviour from core lib is preserved.
   */
  public static toJsForceConnection(connection: Connection): RawConnection {
    // inherit custom API version
    const version = connection.getApiVersion();
    const authInfo = connection.getAuthInfo();
    return new RawConnection(
      convertToRawOptions(authInfo, { version, callOptions: { client } })
    );
  }

  /**
   * Create a new core connection for a given username, alias or default user.
   */
  public async connect(usernameOrAlias?: string): Promise<Connection> {
    const username = await this.getValidUsername(usernameOrAlias);
    const authInfo = await AuthInfo.create({ username });
    return Connection.create({
      authInfo,
      configAggregator: this.config,
    });
  }

  /**
   * Create a new jsforce only connection for a given username, alias or default user.
   * Refresh token flow is enabled for jwt and oauth connections.
   *
   * Optionally specify an api version to use if none set in sf config.
   */
  public async connectJsForce(
    usernameOrAlias?: string,
    defaultApiVersion = '57.0'
  ): Promise<RawConnection> {
    const username = await this.getValidUsername(usernameOrAlias);
    const authInfo = await AuthInfo.create({ username });

    // jsforce 1.11 defaults to API 42, try to use config version
    // or default to more recent
    const configApiVersion = this.config.getPropertyValue(
      OrgConfigProperties.ORG_API_VERSION
    );
    const version = configApiVersion
      ? String(configApiVersion)
      : defaultApiVersion;

    return new RawConnection(
      convertToRawOptions(authInfo, { version, callOptions: { client } })
    );
  }

  /**
   * Get the full username associated with the current default org.
   */
  public async getDefaultUsername(): Promise<string> {
    const usernameOrAlias = this.config.getPropertyValue(
      OrgConfigProperties.TARGET_ORG
    );
    const username = await this.resolveUsername(
      usernameOrAlias ? String(usernameOrAlias) : undefined
    );

    if (!username) {
      throw new Error('No default username found in org config');
    }

    return username;
  }

  /**
   * Reload sf configs, for example saved usernames and credentials.
   */
  public async reloadConfig(): Promise<void> {
    await this.config.reload();
  }

  private async init(workspacePath: string): Promise<AuthHelper> {
    // config aggregator will traverse up until it finds an sf project file
    // we must temporarily switch to the workspace dir (if not in it already)
    // to pick up the correct local config on first try
    if (!this.config) {
      const startDir = this.cwd();

      if (workspacePath !== startDir) {
        this.chdir(workspacePath);
      }

      try {
        this.config = await ConfigAggregator.create();
      } finally {
        if (this.cwd() !== startDir) {
          this.chdir(startDir);
        }
      }
    }
    return this;
  }

  private async getValidUsername(
    usernameOrAlias: string | undefined
  ): Promise<string> {
    if (!usernameOrAlias) {
      return this.getDefaultUsername();
    } else {
      // will fail later if alias was not found
      const resolvedName = await this.resolveUsername(usernameOrAlias);
      return resolvedName || usernameOrAlias;
    }
  }

  private async resolveUsername(
    usernameOrAlias?: string
  ): Promise<string | undefined> {
    const info = await StateAggregator.getInstance();
    return usernameOrAlias
      ? info.aliases.resolveUsername(usernameOrAlias)
      : undefined;
  }

  private cwd() {
    return process.cwd();
  }

  private chdir(path: string) {
    if (path) {
      process.chdir(path);
    }
  }
}

function convertToRawOptions(
  authInfo: AuthInfo,
  defaults: RawConnectionOptions
): RawConnectionOptions {
  const coreOptions = authInfo.getConnectionOptions();

  return {
    ...defaults,
    // these fields are set by authinfo in the the 3 diff contexts
    // AccessToken, JWT or OAuth
    // the rest of the auth management is internal to authinfo/core
    accessToken: coreOptions.accessToken,
    instanceUrl: coreOptions.instanceUrl,
    loginUrl: coreOptions.loginUrl,
    oauth2: {
      clientId: coreOptions.oauth2?.clientId,
      loginUrl: coreOptions.oauth2?.loginUrl,
      redirectUri: coreOptions.oauth2?.redirectUri,
    },
    // `Connection` types are incompatible but connection param is not used by authInfo
    refreshFn: coreOptions.refreshFn as unknown as RefreshTokenFn | undefined,
  };
}
