# sfdx-auth-helper

Authentication support library for sfdx.

## Usage

To start, create an instance of the helper at the path of your sf project.

```js
  // dir containing sfdx-project.json
  const workspacePath = '/path/to/my/project';
  const helper = await AuthHelper.instance(workspacePath);
```

* Get connection to an org (That exists in `sf` config)

```js
  // Connection.create(...) with default user auth info
  const conn = helper.connect();
  // Get an existing saved org by specific username or alias
  helper.connect('user@mycompany.org');
  helper.connect('MyOrg');
```

* Get a jsforce connection to current default org

```js
  // new jsforce.Connection with default user auth info
  const conn = helper.connectJsForce();

  // Also supports alias / username
  helper.connectJsForce('MyOrg');
  // Provide fallback API version if none set in project
  helper.connectJsForce('MyOrg', '57.0');
```

* Transform an existing `Connection` into a `jsforce` one

```js
  // Connection created by newer version of `@salesforce/core`
  const conn = Connection.create({...});

  // Use static to produce a jsforce.Connection
  AuthHelper.toJsForceConnection(conn);
```

* Additional instance methods
  * `getDefaultUsername()` - This returns the default org username for a sfdx workspace. If no default username is set it returns undefined. If the default is an org alias that is translated to a username.
  * `reloadConfig()` - If the loaded config has changed due to some external action (e.g. org creation) the copy cached by the core library will be stale. Use this to reload, making a new helper instance will not be enough.

## Building

```txt
  pnpm build
```

To test bundling using webpack:

```txt
  pnpm test:pack
  node test-bundle/bundle.js
```

This should execute without error.

## History

```txt
  1.0.5 - Re-export MockTestOrgData, testSetup
  1.0.4 - Update patch for WebOAuthServer message fix
  1.0.3 - Bundle @salesforce/core
  1.0.2 - Another Packaging fix
  1.0.1 - Packaging fix
  1.0.0 - Initial version
```

## License

All the source code included uses a 3-clause BSD license, see LICENSE for details.
