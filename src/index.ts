import { initCoreMessages } from './CoreMessages';

// Load @salesforce/core messages so ready for use
initCoreMessages();

// Re-export @salesforce/core
export * from '@salesforce/core/lib/exported';

// Export username helper
export { getDefaultUsername } from './Username';
