const Database = require('../models/database');
const fs = require('fs');
const path = require('path');

describe('Database', () => {
  let database;
  const testDbPath = './test-database.sqlite';

  beforeEach(async () => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    database = new Database();
    // Override database path for testing
    database.dbPath = testDbPath;
    await database.init();
  });

  afterEach(async () => {
    await database.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('createDigest', () => {
    test('should create a new digest successfully', async () => {
      const testDigest = {
        transcript: 'Test meeting transcript',
        summary: 'Test summary',
        created_at: new Date().toISOString()
      };

      const id = await database.createDigest(testDigest);
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    test('should handle JSON summary objects', async () => {
      const testDigest = {
        transcript: 'Test transcript',
        summary: { overview: 'Test overview', decisions: ['Decision 1'] },
        created_at: new Date().toISOString()
      };

      const id = await database.createDigest(testDigest);
      expect(id).toBeDefined();
    });
  });

  describe('getAllDigests', () => {
    test('should return empty array when no digests exist', async () => {
      const digests = await database.getAllDigests();
      
      expect(Array.isArray(digests)).toBe(true);
      expect(digests.length).toBe(0);
    });

    test('should return all digests ordered by created_at DESC', async () => {
      // Create test digests
      const digest1 = {
        transcript: 'First meeting',
        summary: 'First summary',
        created_at: '2023-01-01T00:00:00.000Z'
      };
      
      const digest2 = {
        transcript: 'Second meeting',
        summary: 'Second summary',
        created_at: '2023-01-02T00:00:00.000Z'
      };

      await database.createDigest(digest1);
      await database.createDigest(digest2);

      const digests = await database.getAllDigests();
      
      expect(digests.length).toBe(2);
      expect(digests[0].transcript).toBe('Second meeting'); // Most recent first
      expect(digests[1].transcript).toBe('First meeting');
    });
  });

  describe('getDigestById', () => {
    test('should return digest by ID', async () => {
      const testDigest = {
        transcript: 'Test transcript',
        summary: 'Test summary',
        created_at: new Date().toISOString()
      };

      const id = await database.createDigest(testDigest);
      const retrievedDigest = await database.getDigestById(id);
      
      expect(retrievedDigest).toBeDefined();
      expect(retrievedDigest.id).toBe(id);
      expect(retrievedDigest.transcript).toBe(testDigest.transcript);
    });

    test('should return undefined for non-existent ID', async () => {
      const digest = await database.getDigestById(999);
      expect(digest).toBeUndefined();
    });
  });

  describe('makeDigestPublic', () => {
    test('should make digest public with public ID', async () => {
      const testDigest = {
        transcript: 'Test transcript',
        summary: 'Test summary',
        created_at: new Date().toISOString()
      };

      const id = await database.createDigest(testDigest);
      const publicId = 'test-public-id-123';
      
      const success = await database.makeDigestPublic(id, publicId);
      
      expect(success).toBe(true);
      
      // Verify the digest is now public
      const digest = await database.getDigestById(id);
      expect(digest.public_id).toBe(publicId);
      expect(digest.is_public).toBe(1);
    });

    test('should return false for non-existent digest', async () => {
      const success = await database.makeDigestPublic(999, 'test-id');
      expect(success).toBe(false);
    });
  });

  describe('getDigestByPublicId', () => {
    test('should return digest by public ID', async () => {
      const testDigest = {
        transcript: 'Public test transcript',
        summary: 'Public test summary',
        created_at: new Date().toISOString()
      };

      const id = await database.createDigest(testDigest);
      const publicId = 'public-test-123';
      await database.makeDigestPublic(id, publicId);
      
      const retrievedDigest = await database.getDigestByPublicId(publicId);
      
      expect(retrievedDigest).toBeDefined();
      expect(retrievedDigest.public_id).toBe(publicId);
      expect(retrievedDigest.transcript).toBe(testDigest.transcript);
    });

    test('should return undefined for non-existent public ID', async () => {
      const digest = await database.getDigestByPublicId('non-existent-id');
      expect(digest).toBeUndefined();
    });
  });
});