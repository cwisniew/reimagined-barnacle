import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { BoardGame, OtherLink, CardSet, PlaySession, PlayerInPlaySession } from "./types"; // Added PlayerInPlaySession
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { BggClient } from "boardgamegeekclient";
import type { Link, Video } from "boardgamegeekclient/dist/esm/types";

dotenv.config();
const app = express(); const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "..", "data", "boardgames.json");
app.use(express.json());
let boardGames: BoardGame[] = [];

const loadGames = () => {
  try { if (fs.existsSync(DATA_FILE)) { const d = fs.readFileSync(DATA_FILE, "utf-8"); if(d){ const p = JSON.parse(d); boardGames = Array.isArray(p)?p:[];
    boardGames.forEach(g=>{
      if (g.plays && Array.isArray(g.plays)) {
        g.plays.forEach(play => {
          if ((play as any).playerNames && Array.isArray((play as any).playerNames) && !play.playersInSession) {
            play.playersInSession = ((play as any).playerNames as string[]).map(name => ({
              id: uuidv4(),
              name: name,
            }));
            delete (play as any).playerNames;
          } else if (!play.playersInSession) {
            play.playersInSession = [];
          }
        });
      } else if (g.plays === undefined) {
          g.plays = [];
      }
      if(g.isExpansion===undefined)g.isExpansion=false; if(g.bggExpansionIds===undefined)g.bggExpansionIds=[];
      if(g.designers===undefined)g.designers=[]; if(g.publishers===undefined)g.publishers=[]; if(g.categories===undefined)g.categories=[]; if(g.mechanics===undefined)g.mechanics=[];
      if(g.otherLinks===undefined)g.otherLinks=[]; if(g.bggSubdomains===undefined)g.bggSubdomains=[]; if(g.bggFamilies===undefined)g.bggFamilies=[];
      if(g.cardSets===undefined)g.cardSets=[];
      delete (g as any).playCount; // Ensure old field is removed
      delete (g as any).lastPlayedDate; // Ensure old field is removed
    }); console.log("Board games loaded from", DATA_FILE); } else { boardGames=[]; console.log(DATA_FILE, "is empty.");}} else { boardGames=[]; console.log(DATA_FILE, "not found.");}
  } catch(e){console.error("Error loading games:",e);boardGames=[];}
};
const saveGames = async () => { try{const d=path.dirname(DATA_FILE);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});await fs.promises.writeFile(DATA_FILE,JSON.stringify(boardGames,null,2),"utf-8"); console.log("Board games saved to", DATA_FILE);}catch(e){console.error("Error saving games:",e);}};
loadGames();

app.get("/api/boardgames", (req,res)=>res.json(boardGames));
app.get("/api/boardgames/:id", (req,res)=>{const gid=req.params.id;const gm=boardGames.find(g=>g.id===gid);if(gm)res.json(gm);else res.status(404).json({message:"Game not found"});});
app.post("/api/boardgames", async (req, res) => {
  const { name, description, version, bggId, status, bggRating, bggComplexity, yearPublished, minPlayers, maxPlayers, playingTime, thumbnailUrl, imageUrl, isExpansion, baseGameAppId, bggBaseGameId, bggExpansionIds, designers, publishers, categories, mechanics, locationRoom, locationCupboard, locationShelf, locationNotes, officialWebsiteUrl, otherLinks, crowdfundingPlatform, crowdfundingUrl, crowdfundingStatus, bggSubdomains, bggFamilies, manualUrl, cardSets, plays } = req.body as Partial<BoardGame>;
  if (!name || !description) return res.status(400).json({ message: "Name and description are required" });
  const newGameData: Omit<BoardGame, "id"> = { name, description, version, bggId, status, bggRating, bggComplexity, yearPublished, minPlayers, maxPlayers, playingTime, thumbnailUrl, imageUrl, plays: plays || [], isExpansion: isExpansion || false, baseGameAppId, bggBaseGameId, bggExpansionIds: bggExpansionIds || [], designers: designers || [], publishers: publishers || [], categories: categories || [], mechanics: mechanics || [], locationRoom, locationCupboard, locationShelf, locationNotes, officialWebsiteUrl, otherLinks: otherLinks || [], crowdfundingPlatform, crowdfundingUrl, crowdfundingStatus, bggSubdomains: bggSubdomains || [], bggFamilies: bggFamilies || [], manualUrl, cardSets: cardSets || [] };
  const newGame: BoardGame = { id: uuidv4(), ...newGameData };
  boardGames.push(newGame); await saveGames(); res.status(201).json(newGame);
});
app.put("/api/boardgames/:id", async (req, res) => {
  const gameId = req.params.id; const gameData = req.body as Partial<BoardGame>; const gameIndex = boardGames.findIndex(g=>g.id===gameId);
  if(gameIndex === -1) return res.status(404).json({message:"Game not found"});
  const updateData = { ...gameData }; delete (updateData as any).bggVideoLinks; // Ensure transient field not saved
  boardGames[gameIndex] = {...boardGames[gameIndex], ...updateData, id: gameId };
  await saveGames(); res.json(boardGames[gameIndex]);
});
app.delete("/api/boardgames/:id", async (req, res) => { const gameId = req.params.id; const il = boardGames.length; boardGames = boardGames.filter(g=>g.id!==gameId); if(boardGames.length===il)return res.status(404).json({message:"Game not found"}); await saveGames(); res.status(204).send();});

app.post("/api/boardgames/:gameId/plays", async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { date, playersInSession, notes } = req.body as Omit<PlaySession, "id">;

  if (!date) return res.status(400).json({ message: "Date is required for a play session." });
  if (playersInSession && !Array.isArray(playersInSession)) {
    return res.status(400).json({ message: "playersInSession must be an array."});
  }
  if (playersInSession) {
    for (const p of playersInSession) {
      if (!p.id || !p.name) return res.status(400).json({ message: "Each player in session must have an id and name."});
    }
  }

  const gameIndex = boardGames.findIndex(g => g.id === gameId);
  if (gameIndex === -1) return res.status(404).json({ message: "Game not found." });

  const newPlay: PlaySession = {
    id: uuidv4(),
    date,
    playersInSession: playersInSession || [],
    notes
  };

  if (!boardGames[gameIndex].plays) boardGames[gameIndex].plays = [];
  boardGames[gameIndex].plays!.push(newPlay);
  boardGames[gameIndex].plays!.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  await saveGames();
  res.status(201).json(newPlay);
});

app.delete("/api/boardgames/:gameId/plays/:playId", async (req, res) => { const {gameId,playId}=req.params; const gi=boardGames.findIndex(g=>g.id===gameId); if(gi===-1)return res.status(404).json({message:"Game not found."}); const g=boardGames[gi]; if(!g.plays)return res.status(404).json({message:"No plays found for this game."}); const pi=g.plays.findIndex(p=>p.id===playId); if(pi===-1)return res.status(404).json({message:"Play session not found."}); g.plays.splice(pi,1); await saveGames(); res.status(200).json({message:"Play session deleted."});});

const bggClient = BggClient.Create();
app.get("/api/bgg/search", async(req,res)=>{const n=req.query.name as string;if(!n)return res.status(400).json({message:"Game name query parameter required"});try{const sr=await bggClient.search.query({query:n,type:"boardgame,boardgameexpansion"});res.json(sr||[]);}catch(e){console.error("Error searching BGG:",e);res.status(500).json({message:"Failed to search BGG"});}});
app.get("/api/bgg/game/:bggId", async(req,res)=>{
  const idNum = parseInt(req.params.bggId,10); if(isNaN(idNum)) return res.status(400).json({message:"Valid BGG ID is required"});
  try{ const tr = await bggClient.thing.query({id:[idNum],stats:1,versions:1,videos:1}); if(!tr||!tr.length) return res.status(404).json({message:"Game not found on BGG"});
    const gd=tr[0]; let isExp=false,bggBaseId:number|undefined=undefined; const bggExpIds:number[]=[],des:string[]=[],pub:string[]=[],cat:string[]=[],mec:string[]=[]; let webUrl:string|undefined=undefined; const subdom:string[]=[],fam:string[]=[]; const vidsFromBgg:BggVideoLink[] = [];
    if(typeof gd.website==="object"&&gd.website!==null&&"value"in gd.website)webUrl=(gd.website as {value:string}).value; else if(typeof gd.website==="string")webUrl=gd.website;
    if(gd.links&&Array.isArray(gd.links)){gd.links.forEach((l:Link)=>{switch(l.type){
      case"boardgameexpansion":if(l.inbound==="true"){isExp=true;bggBaseId=l.id}else{bggExpIds.push(l.id)}break;
      case"boardgamedesigner":des.push(l.value);break;case"boardgamepublisher":p.push(l.value);break;
      case"boardgamecategory":cat.push(l.value);break;case"boardgamemechanic":mec.push(l.value);break;
      case"boardgamesubdomain":subdom.push(l.value);break;case"boardgamefamily":fam.push(l.value);break;
    }});}
    if (gd.videos && Array.isArray(gd.videos.video)) { gd.videos.video.forEach((v: Video) => { vidsFromBgg.push({ title: v["@_title"], url: v["@_link"], language: v["@_language"], uploader: v["@_username"], postDate: v["@_postdate"] }); }); }
    const augDetails={...gd,_isExpansionFromBgg:isExp,_bggBaseGameIdFromBgg:bggBaseId,_bggExpansionIdsFromBgg:bggExpIds,_designers:des,_publishers:pub,_categories:cat,_mechanics:mec,_officialWebsiteFromBgg:webUrl,_bggSubdomains:subdom,_bggFamilies:fam,_bggVideos:vidsFromBgg};
    res.json(augDetails);
  }catch(e){console.error("Error fetching BGG details:",e);res.status(500).json({message:"Failed to fetch BGG details"});}
});
app.get("/",(req,res)=>res.send("Hello from Express backend!")); app.listen(port,()=>console.log(`Backend server running on http://localhost:${port}`));
