import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { BoardGame } from "./types";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { BggClient } from "boardgamegeekclient";
import type { Link } from "boardgamegeekclient/dist/esm/types";

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
        boardGames.forEach(game => { // Initialize new fields for existing data
          if (game.playCount === undefined) game.playCount = 0;
          if (game.isExpansion === undefined) game.isExpansion = false;
          if (game.bggExpansionIds === undefined) game.bggExpansionIds = [];
          if (game.designers === undefined) game.designers = [];
          if (game.publishers === undefined) game.publishers = [];
          if (game.categories === undefined) game.categories = [];
          if (game.mechanics === undefined) game.mechanics = [];
          // No default init for optional location strings needed, undefined is fine
        });
        console.log("Board games loaded from", DATA_FILE);
      } else { boardGames = []; console.log(DATA_FILE, "is empty."); }
    } else { boardGames = []; console.log(DATA_FILE, "not found."); }
  } catch (error) { console.error("Error loading games:", error); boardGames = []; }
};

const saveGames = async () => {
  try { const dataDir = path.dirname(DATA_FILE); if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(boardGames, null, 2), "utf-8");
    console.log("Board games saved to", DATA_FILE);
  } catch (error) { console.error("Error saving games:", error); }
};

loadGames();

// --- Board Game CRUD API Endpoints ---
app.get("/api/boardgames", (req: Request, res: Response) => res.json(boardGames));

app.post("/api/boardgames", async (req: Request, res: Response) => {
  const {
    name, description, version, bggId, status,
    bggRating, bggComplexity, yearPublished, minPlayers, maxPlayers,
    playingTime, thumbnailUrl, imageUrl,
    isExpansion, baseGameAppId, bggBaseGameId, bggExpansionIds,
    designers, publishers, categories, mechanics,
    // New location fields
    locationRoom, locationCupboard, locationShelf, locationNotes
  } = req.body as Partial<BoardGame>;

  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }

  const newGame: BoardGame = {
    id: uuidv4(), name, description, version, bggId, status,
    bggRating, bggComplexity, yearPublished, minPlayers, maxPlayers,
    playingTime, thumbnailUrl, imageUrl,
    playCount: 0, isExpansion: isExpansion || false, baseGameAppId,
    bggBaseGameId, bggExpansionIds: bggExpansionIds || [],
    designers: designers || [], publishers: publishers || [],
    categories: categories || [], mechanics: mechanics || [],
    // Add new location fields
    locationRoom, locationCupboard, locationShelf, locationNotes,
  };
  boardGames.push(newGame);
  await saveGames();
  res.status(201).json(newGame);
});

app.patch("/api/boardgames/:id/played", async (req: Request, res: Response) => {
  const gameId = req.params.id; const gameIndex = boardGames.findIndex(g => g.id === gameId);
  if (gameIndex === -1) return res.status(404).json({ message: "Game not found" });
  const game = boardGames[gameIndex]; game.playCount = (game.playCount || 0) + 1;
  game.lastPlayedDate = new Date().toISOString(); boardGames[gameIndex] = game;
  await saveGames(); res.json(game);
});

// --- BGG API Integration Endpoints --- (Remain the same for this step)
const bggClient = BggClient.Create();
app.get("/api/bgg/search", async (req: Request, res: Response) => {
  const gameName = req.query.name as string; if (!gameName) return res.status(400).json({ message: "Game name query parameter required" });
  try { const searchResults = await bggClient.search.query({ query: gameName, type: "boardgame,boardgameexpansion" }); res.json(searchResults || []);
  } catch (error) { console.error("Error searching BGG:", error); res.status(500).json({ message: "Failed to search BGG" }); }
});
app.get("/api/bgg/game/:bggId", async (req: Request, res: Response) => {
  const bggIdNum = parseInt(req.params.bggId, 10); if (isNaN(bggIdNum)) return res.status(400).json({ message: "Valid BGG ID required" });
  try { const thingResult = await bggClient.thing.query({ id: [bggIdNum], stats: 1, versions: 1, videos: 1 });
    if (!thingResult || thingResult.length === 0) return res.status(404).json({ message: "Game not found on BGG" });
    const gameDetails = thingResult[0]; let isExpansionFromBgg=false; let bggBaseGameIdFromBgg:number|undefined=undefined;
    const bggExpansionIdsFromBgg:number[]=[]; const designersFromBgg:string[]=[]; const publishersFromBgg:string[]=[];
    const categoriesFromBgg:string[]=[]; const mechanicsFromBgg:string[]=[];
    if(gameDetails.links && Array.isArray(gameDetails.links)){ gameDetails.links.forEach((link:Link)=>{ switch(link.type){
      case "boardgameexpansion": if(link.inbound==="true"){isExpansionFromBgg=true;bggBaseGameIdFromBgg=link.id;}else{bggExpansionIdsFromBgg.push(link.id);}break;
      case "boardgamedesigner":designersFromBgg.push(link.value);break; case "boardgamepublisher":publishersFromBgg.push(link.value);break;
      case "boardgamecategory":categoriesFromBgg.push(link.value);break; case "boardgamemechanic":mechanicsFromBgg.push(link.value);break;
    }});}
    const augmentedDetails={...gameDetails, _isExpansionFromBgg:isExpansionFromBgg, _bggBaseGameIdFromBgg:bggBaseGameIdFromBgg,
      _bggExpansionIdsFromBgg:bggExpansionIdsFromBgg, _designers:designersFromBgg, _publishers:publishersFromBgg,
      _categories:categoriesFromBgg, _mechanics:mechanicsFromBgg,};
    res.json(augmentedDetails);
  } catch (error) { console.error("Error fetching BGG details:", error); res.status(500).json({ message: "Failed to fetch BGG details" }); }
});

app.get("/", (req: Request, res: Response) => res.send("Hello from Express backend!"));
app.listen(port, () => console.log(`Backend server running on http://localhost:${port}`));
