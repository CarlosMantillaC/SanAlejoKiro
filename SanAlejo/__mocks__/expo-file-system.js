// Note: jest-expo's setup.js already calls jest.mock('expo-file-system', factory)
// which takes precedence over this file. This file is kept for reference and
// for cases where jest-expo's mock is not active.
// The jest-expo mock does not include EncodingType, documentDirectory, or cacheDirectory.
// exportService.ts uses the string literal 'base64' directly to avoid this issue.

module.exports = {
  documentDirectory: 'file:///data/user/0/com.app/files/',
  cacheDirectory: 'file:///data/user/0/com.app/cache/',
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
};
