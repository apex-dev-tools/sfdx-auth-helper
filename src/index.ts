import { initCoreMessages } from './CoreMessages';

// Load @salesforce/core messages so ready for use
initCoreMessages();

// Re-export @salesforce/core
export * from '@salesforce/core/lib/exported';

// For testing support
export { MockTestOrgData, testSetup } from '@salesforce/core/lib/testSetup';

// Export username helper
export { getDefaultUsername } from './Username';
