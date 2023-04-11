/*
 * Copyright (c) 2023 FinancialForce.com, inc. All rights reserved.
 */

import { stubMethod } from '@salesforce/ts-sinon';
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { Connection, OrgConfigProperties } from '@salesforce/core';
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
    await $$.stubAuths(testData);
    $$.stubAliases({ alias: testData.username });

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

    initSpy = $$.SANDBOX.spy(RawConnection.prototype, 'initialize');
  });

  it('does init in current dir', async () => {
    await AuthHelper.instance(workspacePath);

    expect(cwdStub.callCount).toBe(2);
    expect(chdirStub.callCount).toBe(0);
  });

  it('does init in different dir if not current', async () => {
    const path = '/otherproject';
    cwdStub.onSecondCall().returns(path);

    await AuthHelper.instance(path);

    expect(cwdStub.callCount).toBe(2);
    expect(chdirStub.callCount).toBe(2);
    expect(chdirStub.args[0][0]).toMatch(path);
    expect(chdirStub.args[1][0]).toMatch(workspacePath);
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

    throw new Error('should throw username error');
  });

  it('gets no auth info for bad username', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect('bad');
    const opts = conn.getAuthInfo().getConnectionOptions();

    expect(conn.getUsername()).toMatch('bad');
    expect(opts.accessToken).not.toBeDefined();
  });

  it('returns a default core connection from alias', async () => {
    // Set default target org in config
    await $$.stubConfig({ [OrgConfigProperties.TARGET_ORG]: 'alias' });

    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect();
    const opts = conn.getAuthInfo().getConnectionOptions();

    expect(conn.getUsername()).toMatch(testData.username);
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(opts.instanceUrl).toBe(testData.instanceUrl);
  });

  it('returns a default core connection from username', async () => {
    // Set default target org in config
    await $$.stubConfig({
      [OrgConfigProperties.TARGET_ORG]: testData.username,
    });

    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect();
    const opts = conn.getAuthInfo().getConnectionOptions();

    expect(conn.getUsername()).toMatch(testData.username);
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(opts.instanceUrl).toBe(testData.instanceUrl);
  });

  it('returns a core connection using specified alias', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect('alias');
    const opts = conn.getAuthInfo().getConnectionOptions();

    expect(conn.getUsername()).toMatch(testData.username);
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(opts.instanceUrl).toBe(testData.instanceUrl);
  });

  it('returns a core connection using specified username', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connect(testData.username);
    const opts = conn.getAuthInfo().getConnectionOptions();

    expect(conn.getUsername()).toMatch(testData.username);
    expect(opts.accessToken).toBe(testData.accessToken);
    expect(opts.instanceUrl).toBe(testData.instanceUrl);
  });

  it('returns a jsforce connection with set API version', async () => {
    await $$.stubConfig({
      [OrgConfigProperties.ORG_API_VERSION]: '55.0',
    });

    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connectJsForce(testData.username);

    expect(initSpy.calledOnce).toBe(true);
    const opts = initSpy.args[0][0] || {};
    expect(opts.accessToken).toMatch(testData.accessToken);
    expect(conn.version).toMatch('55.0');
  });

  it('returns a jsforce connection with default API version', async () => {
    const helper = await AuthHelper.instance(workspacePath);
    const conn = await helper.connectJsForce(testData.username, '52.0');

    expect(initSpy.calledOnce).toBe(true);
    const opts = initSpy.args[0][0] || {};
    expect(opts.accessToken).toMatch(testData.accessToken);
    expect(conn.version).toMatch('52.0');
  });

  it('transforms a core connection to a jsforce connection', async () => {
    const conn = await testData.getConnection();
    const rawConn = AuthHelper.toJsForceConnection(conn);

    expect(initSpy.calledOnce).toBe(true);
    const opts = initSpy.args[0][0] || {};
    expect(opts.callOptions).toEqual({
      client: '@apexdevtools/sfdx-auth-helper',
    });
    expect(opts.accessToken).toMatch(testData.accessToken);
    expect(rawConn.version).toMatch('50.0');
  });
});
