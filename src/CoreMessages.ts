/*
 Copyright (c) 2022 Kevin Jones, All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
 3. The name of the author may not be used to endorse or promote products
    derived from this software without specific prior written permission.
 */

import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

/* Load @salesforce/core messages */
export function initCoreMessages(): void {
  createLoaderFunction('auth', require('@salesforce/core/messages/auth.json'));
  createLoaderFunction('org', require('@salesforce/core/messages/org.json'));
  createLoaderFunction('core', require('@salesforce/core/messages/core.json'));
  createLoaderFunction('user', require('@salesforce/core/messages/user.json'));
  createLoaderFunction(
    'config',
    require('@salesforce/core/messages/config.json')
  );
  createLoaderFunction(
    'crypto',
    require('@salesforce/core/messages/crypto.json')
  );
  createLoaderFunction(
    'encryption',
    require('@salesforce/core/messages/encryption.json')
  );
  createLoaderFunction(
    'permissionSetAssignment',
    require('@salesforce/core/messages/permissionSetAssignment.json')
  );
  createLoaderFunction(
    'scratchOrgCreate',
    require('@salesforce/core/messages/scratchOrgCreate.json')
  );
  createLoaderFunction(
    'scratchOrgErrorCodes',
    require('@salesforce/core/messages/scratchOrgErrorCodes.json')
  );
  createLoaderFunction(
    'scratchOrgFeatureDeprecation',
    require('@salesforce/core/messages/scratchOrgFeatureDeprecation.json')
  );
  createLoaderFunction(
    'scratchOrgInfoApi',
    require('@salesforce/core/messages/scratchOrgInfoApi.json')
  );
  createLoaderFunction(
    'scratchOrgInfoGenerator',
    require('@salesforce/core/messages/scratchOrgInfoGenerator.json')
  );
  createLoaderFunction(
    'streaming',
    require('@salesforce/core/messages/streaming.json')
  );
}

function createLoaderFunction(bundle: string, json: any): void {
  Messages.setLoaderFunction('@salesforce/core', bundle, (locale: string) => {
    const map = new Map<string, AnyJson>(Object.entries(json));
    return new Messages('auth', locale, map);
  });
}
