/*
 * Copyright (c) 2023 FinancialForce.com, inc. All rights reserved.
 */

import { stubMethod } from '@salesforce/ts-sinon';
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { Connection, AuthInfo, OrgConfigProperties } from '@salesforce/core';
import { Connection as RawConnection, ConnectionOptions } from 'jsforce';
import { AuthHelper } from '../src';

describe('AuthHelper', () => {
  const $$ = new TestContext();
  let testData: MockTestOrgData;
  let workspacePath: string;

  let cwdStub: sinon.SinonStub;
  let chdirStub: sinon.SinonStub;
  let initSpy: sinon.SinonSpy<[options?: ConnectionOptions | undefined], void>;

  beforeEach(async () => {
    // load a fake auth config, set an alias
    testData = new MockTestOrgData();
    testData.aliases = ['testAlias'];
    $$.setConfigStubContents('AuthInfoConfig', {
      contents: await testData.getConfig(),
    });

    // cannot access the internal jsforce, stub version directly
    stubMethod(
      $$.SANDBOX,
      Connection.prototype,
      'retrieveMaxApiVersion'
    ).resolves('50.0');

    // stub out calls to process methods without messing with process itself
    workspacePath = '/project';
    cwdStub = stubMethod($$.SANDBOX, AuthHelper.prototype, 'cwd');
    cwdStub.returns(workspacePath);
    chdirStub = stubMethod($$.SANDBOX, AuthHelper.prototype, 'chdir');

    // no op any request
    stubMethod($$.SANDBOX, RawConnection.prototype, 'request').resolves({});
    initSpy = $$.SANDBOX.spy(RawConnection.prototype, 'initialize');
  });

  it('does init in current dir', async () => {
    await AuthHelper.instance(workspacePath);

    expect(cwdStub).toBeCalledTimes(2);
    expect(chdirStub).not.toBeCalled();
  });

  it('does init in different dir if not current', async () => {
    const path = '/otherproject';
    cwdStub.onSecondCall().returns(path);

    await AuthHelper.instance(path);

    expect(cwdStub).toBeCalledTimes(2);
    expect(chdirStub).toBeCalledTimes(2);
    expect(chdirStub.args[0][0]).toBe(path);
    expect(chdirStub.args[1][0]).toBe(workspacePath);
  });

  it('throws if no default org with no args', async () => {
    try {
      const helper = await AuthHelper.instance(workspacePath);
      await helper.connect();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toMatch('No default username found in org config');
        return;
      }
    }

    fail('should throw');
  });

  it('throws if specified username does not exist', async () => {
    try {
      const helper = await AuthHelper.instance(workspacePath);
      await helper.connect('bad');
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toMatch(
          "Could not resolve username 'bad' to a known auth info"
        );
        return;
      }
    }

    fail('should throw');
  });

  it('returns a default core connection from alias', async () => {
    // Set default target org in config
    $$.setConfigStubContents('Config', {
      contents: { [OrgConfigProperties.TARGET_ORG]: 'testAlias' },
    });

    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect();

    expect(conn.getUsername()).toMatch(testData.username);
  });

  it('returns a default core connection from username', async () => {
    // Set default target org in config
    $$.setConfigStubContents('Config', {
      contents: { [OrgConfigProperties.TARGET_ORG]: testData.username },
    });

    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect();

    expect(conn.getUsername()).toMatch(testData.username);
  });

  it('returns a core connection using specified alias', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect('testAlias');

    expect(conn.getUsername()).toMatch(testData.username);
  });

  it('returns a core connection using specified username', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect(testData.username);

    expect(conn.getUsername()).toMatch(testData.username);
  });

  it('returns a jsforce connection with set API version', async () => {
    $$.setConfigStubContents('Config', {
      contents: { [OrgConfigProperties.ORG_API_VERSION]: '55.0' },
    });

    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connectJsForce(testData.username);

    expect(initSpy).toBeCalledTimes(1);
    const opts = initSpy.args[0][0] || {};
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(conn.version).toBe('55.0');
  });

  it('returns a jsforce connection with default API version', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connectJsForce(testData.username, '52.0');

    expect(initSpy).toBeCalledTimes(1);
    const opts = initSpy.args[0][0] || {};
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(conn.version).toBe('52.0');
  });

  it('transforms a core connection to a jsforce connection', async () => {
    const conn = await Connection.create({
      authInfo: await AuthInfo.create({
        username: testData.username,
      }),
    });

    const rawConn = AuthHelper.toJsForceConnection(conn);

    expect(initSpy).toBeCalledTimes(1);
    const opts = initSpy.args[0][0] || {};
    expect(opts.callOptions).toBe('jsforce1');
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(rawConn.version).toBe('50.0');
  });
});
