import express, { Express, Request, Response, Router } from 'express';
import cors from 'cors';
import db from './database'; // Import the initialized db instance

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Routes for /api/legosets ---
const legoSetRouter: Router = Router();

// Interface for API data consistency (matches table structure for new/updated items)
interface LegoSetAPI {
    name: string;
    setNumber: string;
    description?: string;
    pictures?: string[];
    numberOfPieces: number;
    numberOfMinifigs: number;
    quantityOwned: number;
    storageLocation?: string;
    isBuilt: boolean;
    status: 'Owned' | 'Wishlist' | 'Ordered';
}

// GET all Lego sets
legoSetRouter.get('/', (req: Request, res: Response) => {
  console.log('GET /api/legosets - Retrieving all sets from DB');
  db.all('SELECT * FROM legosets', [], (err, rows: any[]) => { // Specify rows as any[] or define a proper type
    if (err) {
      console.error('Error querying legosets:', err.message);
      res.status(500).json({ error: 'Failed to retrieve Lego sets' });
      return;
    }
    // Parse pictures string back to array and convert isBuilt to boolean
    const sets = rows.map(row => ({
        ...row,
        pictures: row.pictures ? JSON.parse(row.pictures as string) : [],
        isBuilt: Boolean(row.isBuilt)
    }));
    res.json(sets);
  });
});

// GET a single Lego set by ID
legoSetRouter.get('/:id', (req: Request, res: Response) => {
  const setId = parseInt(req.params.id, 10);
  console.log(`GET /api/legosets/${setId} - Retrieving set by ID from DB`);
  db.get('SELECT * FROM legosets WHERE id = ?', [setId], (err, row: any) => { // Specify row as any or define a proper type
    if (err) {
      console.error(`Error querying legoset with id ${setId}:`, err.message);
      res.status(500).json({ error: 'Failed to retrieve Lego set' });
      return;
    }
    if (row) {
      const set = {
          ...row,
          pictures: row.pictures ? JSON.parse(row.pictures as string) : [],
          isBuilt: Boolean(row.isBuilt)
      };
      res.json(set);
    } else {
      res.status(404).json({ message: 'Lego set not found' });
    }
  });
});

// POST (create) a new Lego set
legoSetRouter.post('/', (req: Request, res: Response) => {
  const {
    name, setNumber, description, pictures, numberOfPieces,
    numberOfMinifigs, quantityOwned, storageLocation, isBuilt, status
  }: LegoSetAPI = req.body;
  console.log('POST /api/legosets - Creating new set in DB:', req.body);

  if (!name || !setNumber) {
    return res.status(400).json({ message: 'Name and Set Number are required' });
  }

  const sql = `INSERT INTO legosets (name, setNumber, description, pictures, numberOfPieces, numberOfMinifigs, quantityOwned, storageLocation, isBuilt, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    name, setNumber, description || null, pictures ? JSON.stringify(pictures) : null,
    numberOfPieces || 0, numberOfMinifigs || 0, quantityOwned || 1,
    storageLocation || null, isBuilt ? 1 : 0, status || 'Owned'
  ];

  db.run(sql, params, function(this: sqlite3.RunResult, err) { // Use function() to get this.lastID
    if (err) {
      console.error('Error inserting new legoset:', err.message);
      if (err.message.includes('UNIQUE constraint failed: legosets.setNumber')) {
        return res.status(409).json({ error: 'Set number already exists.' });
      }
      return res.status(500).json({ error: 'Failed to create Lego set.' });
    }
    console.log(`New Lego set created with ID: ${this.lastID}`);
    // Return the newly created object including the ID
    res.status(201).json({ 
        id: this.lastID, 
        name, setNumber, description, pictures, numberOfPieces,
        numberOfMinifigs, quantityOwned, storageLocation, isBuilt, status
    });
  });
});

// PUT (update) a Lego set by ID
legoSetRouter.put('/:id', (req: Request, res: Response) => {
  const setId = parseInt(req.params.id, 10);
  const {
    name, setNumber, description, pictures, numberOfPieces,
    numberOfMinifigs, quantityOwned, storageLocation, isBuilt, status
  }: Partial<LegoSetAPI> = req.body; // Partial because not all fields required for update
  console.log(`PUT /api/legosets/${setId} - Updating set in DB:`, req.body);

  const fields: string[] = [];
  const params: (string | number | boolean | null)[] = [];

  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (setNumber !== undefined) { fields.push('setNumber = ?'); params.push(setNumber); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (pictures !== undefined) { fields.push('pictures = ?'); params.push(JSON.stringify(pictures)); }
  if (numberOfPieces !== undefined) { fields.push('numberOfPieces = ?'); params.push(numberOfPieces); }
  if (numberOfMinifigs !== undefined) { fields.push('numberOfMinifigs = ?'); params.push(numberOfMinifigs); }
  if (quantityOwned !== undefined) { fields.push('quantityOwned = ?'); params.push(quantityOwned); }
  if (storageLocation !== undefined) { fields.push('storageLocation = ?'); params.push(storageLocation); }
  if (isBuilt !== undefined) { fields.push('isBuilt = ?'); params.push(isBuilt ? 1 : 0); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  params.push(setId); // For the WHERE clause
  const sql = `UPDATE legosets SET ${fields.join(', ')} WHERE id = ?`;

  db.run(sql, params, function(this: sqlite3.RunResult, err) {
    if (err) {
      console.error(`Error updating legoset with id ${setId}:`, err.message);
      if (err.message.includes('UNIQUE constraint failed: legosets.setNumber')) {
        return res.status(409).json({ error: 'Set number already exists for another set.' });
      }
      return res.status(500).json({ error: 'Failed to update Lego set' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Lego set not found for update' });
    }
    console.log(`Lego set with ID ${setId} updated.`);
    // Fetch and return the updated set
    db.get('SELECT * FROM legosets WHERE id = ?', [setId], (err, row: any) => {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve updated set' });
            return;
        }
        if (row) {
            const set = {...row, pictures: row.pictures ? JSON.parse(row.pictures as string) : [], isBuilt: Boolean(row.isBuilt) };
            res.json(set);
        } else {
            res.status(404).json({ message: 'Updated set not found (should not happen if update was successful)' });
        }
    });
  });
});

// DELETE a Lego set by ID
legoSetRouter.delete('/:id', (req: Request, res: Response) => {
  const setId = parseInt(req.params.id, 10);
  console.log(`DELETE /api/legosets/${setId} - Deleting set from DB`);
  db.run('DELETE FROM legosets WHERE id = ?', [setId], function(this: sqlite3.RunResult, err) {
    if (err) {
      console.error(`Error deleting legoset with id ${setId}:`, err.message);
      return res.status(500).json({ error: 'Failed to delete Lego set' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Lego set not found for deletion' });
    }
    console.log(`Lego set with ID ${setId} deleted.`);
    res.status(204).send(); // 204 No Content is typical for successful deletion
  });
});

app.use('/api/legosets', legoSetRouter);

// Basic Server Route
app.get('/', (req: Request, res: Response) => {
  res.send('Lego Collection Tracker Backend is running with SQLite!');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port} with SQLite DB`);
});
