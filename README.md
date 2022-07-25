# sfdx-auth-helper

Authentication support library for sfdx. This re-exports @salesforce/core in a format that is safe for bundling and adds some handy utilities for authentication.

Currently, the Message module in @salesforce/core is invoked during import and will fail when bundled due to not being able to locate the required message files. This library patches @salesforce/core (see patches/@salesforce+core+2.37.1.patch) so message loading does not fail and then provides a webpack safe message loading function to @salesforce/core so that is initialised correctly.

To make this easy to consume we re-export the @salesforce/core modules so you can use this as a drop in replacement if you need to bundle. There is a PR open to get the changes merged back in to @salesforce/core.

### Additional APIs

    getDefaultUsername(workspacePath: string): Promise<string | undefined>

This returns the default org username for a sfdx workspace. If no default username is set it returns undefined. If the default is an org alias that is translated to a username.

### Building

    npm run build

To test bundling using webpack:

    npm run testpack
    node test-bundle/bundle.js

This should execute without error.

### History

    1.0.5 - Re-export MockTestOrgData, testSetup
    1.0.4 - Update patch for WebOAuthServer message fix
    1.0.3 - Bundle @salesforce/core
    1.0.2 - Another Packaging fix
    1.0.1 - Packaging fix
    1.0.0 - Initial version

### License

All the source code included uses a 3-clause BSD license, see LICENSE for details.
