# sfdx-auth-helper - Changelog

## 2.0.1 - 2023-10-12

* Fix `AuthHelper.reloadConfig` not removing stale auth config.

## 2.0.0 - 2023-04-12

* Support `@salesforce/core@^3`.
  * No longer requires patching, messages are compiled into the runtime.
  * New API provided through `AuthHelper` class.
    * Supports connecting using core library or JSForce v1.
    * Can also static transform a core `Connection` into a v1 `jsforce.Connection`.
    * See `README.md` for specific API details.
* Depends on `jsforce@^1` to support legacy connection type.
* `getDefaultUsername(workspacePath)` is now available as `AuthHelper.instance(workspacePath).getDefaultUsername()`.
  * Prefer use of `.connect()` or `.connectJsForce()`.
* No longer re-exports any types from `@salesforce/core`.

## Previous Releases

* `1.0.5` - Re-export MockTestOrgData, testSetup
* `1.0.4` - Update patch for WebOAuthServer message fix
* `1.0.3` - Bundle @salesforce/core
* `1.0.2` - Another Packaging fix
* `1.0.1` - Packaging fix
* `1.0.0` - Initial version
