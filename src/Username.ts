import { ConfigUtil } from './ConfigUtil';
import { Aliases } from '@salesforce/core';

export async function getDefaultUsername(
  workspacePath: string
): Promise<string | undefined> {
  const usernameOrAlias = await ConfigUtil.getConfigValue(
    workspacePath,
    'defaultusername'
  );
  if (typeof usernameOrAlias == 'string') {
    return (await Aliases.fetch(usernameOrAlias)) || usernameOrAlias;
  }
  return undefined;
}
