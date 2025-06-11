import request from 'supertest';
import app from '../server'; // Import the configured Express app
import db from '../database'; // Import the database connection for setup/teardown

describe('LegoSet API Endpoints', () => {
  // Optional: Clear the legosets table before each test or all tests
  beforeEach((done) => {
    db.serialize(() => {
      db.run('DELETE FROM legosets', (err) => {
        if (err) return done(err);
        // Optional: Reset AUTOINCREMENT sequence for SQLite if needed for predictable IDs
        // db.run("DELETE FROM sqlite_sequence WHERE name='legosets'", done);
        // For simplicity, we'll rely on AUTOINCREMENT to generate new IDs.
        // If tests depend on specific IDs, more complex seeding is needed.
        done();
      });
    });
  });

  // Optional: Close DB connection after all tests
  afterAll((done) => {
    db.close((err) => {
      if (err) return done(err);
      done();
    });
  });

  describe('POST /api/legosets', () => {
    it('should create a new Lego set and return 201 status', async () => {
      const newSet = {
        name: 'Test Transporter',
        setNumber: 'TT001',
        numberOfPieces: 150,
        numberOfMinifigs: 1,
        quantityOwned: 1,
        isBuilt: false,
        status: 'Owned',
        description: 'A cool transporter model',
        pictures: ['transporter.jpg'],
        storageLocation: 'Box A',
      };

      const response = await request(app)
        .post('/api/legosets')
        .send(newSet);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id'); // Backend should return the ID
      expect(response.body.name).toBe(newSet.name);
      expect(response.body.setNumber).toBe(newSet.setNumber);
      // Check if it's in the database
      const dbRes = await new Promise<any>((resolve, reject) => {
        db.get('SELECT * FROM legosets WHERE id = ?', [response.body.id], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      expect(dbRes).toBeDefined();
      expect(dbRes.name).toBe(newSet.name);
    });

    it('should return 400 if required fields (name, setNumber) are missing', async () => {
      const response = await request(app)
        .post('/api/legosets')
        .send({ numberOfPieces: 100 }); // Missing name and setNumber
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Name and Set Number are required');
    });

    it('should return 409 if setNumber already exists', async () => {
      const set1 = { name: 'Unique Set 1', setNumber: 'U001', numberOfPieces: 10, numberOfMinifigs:1, quantityOwned:1, isBuilt: false, status: 'Owned' };
      await request(app).post('/api/legosets').send(set1); // Create first set

      const set2 = { name: 'Unique Set 2', setNumber: 'U001', numberOfPieces: 20, numberOfMinifigs:1, quantityOwned:1, isBuilt: false, status: 'Owned' };
      const response = await request(app).post('/api/legosets').send(set2); // Try to create with same setNumber

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Set number already exists.');
    });
  });

  describe('GET /api/legosets', () => {
    it('should return an empty array if no sets exist', async () => {
      const response = await request(app).get('/api/legosets');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all Lego sets if they exist', async () => {
      // Create some sets first
      const set1 = { name: 'Set A', setNumber: 'SA001', numberOfPieces: 50, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned', pictures: ['sa.jpg'] };
      const set2 = { name: 'Set B', setNumber: 'SB002', numberOfPieces: 75, numberOfMinifigs: 2, quantityOwned: 1, isBuilt: true, status: 'Wishlist', pictures: [] };
      await request(app).post('/api/legosets').send(set1);
      await request(app).post('/api/legosets').send(set2);

      const response = await request(app).get('/api/legosets');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].name).toBe(set1.name);
      // Pictures should be parsed from JSON string to array
      expect(response.body[0].pictures).toEqual(set1.pictures);
      expect(response.body[1].name).toBe(set2.name);
      expect(response.body[1].isBuilt).toBe(true); // Check boolean conversion
    });
  });

  describe('GET /api/legosets/:id', () => {
    it('should return a single Lego set if found', async () => {
      // Create a set first
      const newSetPayload = { name: 'Specific Set', setNumber: 'SP001', numberOfPieces: 99, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned' };
      const postResponse = await request(app).post('/api/legosets').send(newSetPayload);
      const setId = postResponse.body.id;

      const response = await request(app).get(`/api/legosets/${setId}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', setId);
      expect(response.body.name).toBe(newSetPayload.name);
    });

    it('should return 404 if Lego set is not found', async () => {
      const response = await request(app).get('/api/legosets/9999'); // Non-existent ID
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Lego set not found');
    });
  });

  describe('PUT /api/legosets/:id', () => {
    it('should update an existing Lego set and return 200 status with the updated set', async () => {
      // Create a set first
      const newSetPayload = { name: 'Old Name Set', setNumber: 'UP001', numberOfPieces: 120, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned' };
      const postResponse = await request(app).post('/api/legosets').send(newSetPayload);
      const setId = postResponse.body.id;

      const updatedData = {
        name: 'New Updated Name Set',
        numberOfPieces: 130,
        status: 'Wishlist',
      };
      const response = await request(app)
        .put(`/api/legosets/${setId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      // Check if the response body is the updated set
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(setId);
      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.numberOfPieces).toBe(updatedData.numberOfPieces);
      expect(response.body.status).toBe(updatedData.status);

      // Verify the update in the database
      const dbRes = await new Promise<any>((resolve, reject) => {
        db.get('SELECT * FROM legosets WHERE id = ?', [setId], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      expect(dbRes.name).toBe(updatedData.name);
      expect(dbRes.numberOfPieces).toBe(updatedData.numberOfPieces);
      expect(dbRes.status).toBe(updatedData.status);
    });

    it('should return 404 if Lego set to update is not found', async () => {
      const response = await request(app)
        .put('/api/legosets/9999')
        .send({ name: 'Non Existent Update' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Lego set not found for update');
    });

    it('should return 400 if no fields to update are provided', async () => {
      const newSetPayload = { name: 'Test Set', setNumber: 'TS001', numberOfPieces: 100, numberOfMinifigs:1, quantityOwned:1, isBuilt: false, status: 'Owned' };
      const postResponse = await request(app).post('/api/legosets').send(newSetPayload);
      const setId = postResponse.body.id;

      const response = await request(app)
        .put(`/api/legosets/${setId}`)
        .send({}); // Empty body
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No fields to update');
    });
  });

  describe('DELETE /api/legosets/:id', () => {
    it('should delete an existing Lego set and return 204 status', async () => {
      // Create a set first
      const newSetPayload = { name: 'To Be Deleted', setNumber: 'DEL001', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned' };
      const postResponse = await request(app).post('/api/legosets').send(newSetPayload);
      const setId = postResponse.body.id;

      const response = await request(app).delete(`/api/legosets/${setId}`);
      expect(response.status).toBe(204); // Check for 204 No Content

      // Verify it's deleted from the database
      const dbRes = await new Promise<any>((resolve, reject) => {
        db.get('SELECT * FROM legosets WHERE id = ?', [setId], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      expect(dbRes).toBeUndefined();
    });

    it('should return 404 if Lego set to delete is not found', async () => {
      const response = await request(app).delete('/api/legosets/9999');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Lego set not found for deletion');
    });
  });
});
