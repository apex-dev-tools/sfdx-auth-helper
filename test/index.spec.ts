import { Messages } from '../src';
import { getDefaultUsername } from '../src/Username';

describe('messages', () => {
  it('auth messages are loaded', () => {
    const messages = Messages.loadMessages('@salesforce/core', 'auth');
    expect(messages).toBeDefined();
    expect(messages.bundleName).toEqual('auth');
    expect(messages.getMessage('defaultOrgNotFound', ['token'])).toEqual(
      'No token org found'
    );
  });
});

describe('default username', () => {
  it('is undefined', async () => {
    const username = await getDefaultUsername(process.cwd());
    expect(username).toBeUndefined();
  });
});
