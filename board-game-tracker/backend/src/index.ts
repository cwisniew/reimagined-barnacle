import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { BoardGame } from "./types";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { BggClient } from "boardgamegeekclient"; // Import BGG Client

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "..", "data", "boardgames.json");

app.use(express.json());

let boardGames: BoardGame[] = [];

// --- Data Persistence Functions ---
const loadGames = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, "utf-8");
      if (fileData) {
        const parsedData = JSON.parse(fileData);
        boardGames = Array.isArray(parsedData) ? parsedData : [];
        console.log("Board games loaded from", DATA_FILE);
      } else {
        boardGames = [];
        console.log(DATA_FILE, "is empty. Starting with no games.");
      }
    } else {
      console.log(DATA_FILE, "not found. Starting with no games and will create it on add.");
      boardGames = [];
    }
  } catch (error) {
    console.error("Error loading games from file:", error);
    boardGames = [];
  }
};

const saveGames = async () => {
  try {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(boardGames, null, 2), "utf-8");
    console.log("Board games saved to", DATA_FILE);
  } catch (error) {
    console.error("Error saving games to file:", error);
  }
};

loadGames();

// --- Board Game CRUD API Endpoints ---
app.get("/api/boardgames", (req: Request, res: Response) => {
  res.json(boardGames);
});

app.post("/api/boardgames", async (req: Request, res: Response) => {
  const { name, description, version } = req.body as { name: string; description: string; version?: string };
  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }
  const newGame: BoardGame = { id: uuidv4(), name, description, version };
  boardGames.push(newGame);
  await saveGames();
  res.status(201).json(newGame);
});

// --- BGG API Integration Endpoints ---
const bggClient = BggClient.Create();

// GET /api/bgg/search?name=[gameName]
app.get("/api/bgg/search", async (req: Request, res: Response) => {
  const gameName = req.query.name as string;
  if (!gameName) {
    return res.status(400).json({ message: "Game name query parameter is required" });
  }
  try {
    // Search for games by name. type: "boardgame" filters results.
    const searchResults = await bggClient.search.query({ query: gameName, type: "boardgame" });
    if (!searchResults || searchResults.length === 0) {
      return res.json([]); // Return empty array if no results
    }
    // We might want to simplify the response, but for now, return raw-ish search results.
    // Each item in searchResults typically has id, name, yearpublished.
    res.json(searchResults);
  } catch (error) {
    console.error("Error searching BGG:", error);
    res.status(500).json({ message: "Failed to search BoardGameGeek" });
  }
});

// GET /api/bgg/game/[bggId]
app.get("/api/bgg/game/:bggId", async (req: Request, res: Response) => {
  const bggId = parseInt(req.params.bggId, 10);
  if (isNaN(bggId)) {
    return res.status(400).json({ message: "Valid BGG ID path parameter is required" });
  }
  try {
    // Fetch game details by BGG ID. Stats: 1 includes ratings.
    const gameDetails = await bggClient.thing.query({ id: [bggId], stats: 1 });
    if (!gameDetails || gameDetails.length === 0) {
      return res.status(404).json({ message: "Game not found on BGG" });
    }
    // gameDetails is an array, we want the first item.
    // The client might return a lot of data. We can simplify this later.
    res.json(gameDetails[0]);
  } catch (error) {
    console.error("Error fetching game details from BGG:", error);
    res.status(500).json({ message: "Failed to fetch game details from BoardGameGeek" });
  }
});


app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express backend!");
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
