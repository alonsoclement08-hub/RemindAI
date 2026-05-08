const createMockDB = () => ({
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
});

module.exports = {
  openDatabaseAsync: jest.fn().mockResolvedValue(createMockDB()),
  __createMockDB: createMockDB,
};
