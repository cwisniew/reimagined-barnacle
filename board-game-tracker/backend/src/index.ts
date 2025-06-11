import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { BoardGame, OtherLink } from "./types";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { BggClient } from "boardgamegeekclient";
import type { Link } from "boardgamegeekclient/dist/esm/types";

dotenv.config();
const app = express(); const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "..", "data", "boardgames.json");
app.use(express.json());
let boardGames: BoardGame[] = [];

const loadGames = () => {
  try { if (fs.existsSync(DATA_FILE)) { const d = fs.readFileSync(DATA_FILE, "utf-8"); if(d){ const p = JSON.parse(d); boardGames = Array.isArray(p)?p:[];
    boardGames.forEach(g=>{
      if(g.playCount===undefined)g.playCount=0;
      if(g.isExpansion===undefined)g.isExpansion=false;
      if(g.bggExpansionIds===undefined)g.bggExpansionIds=[];
      if(g.designers===undefined)g.designers=[];
      if(g.publishers===undefined)g.publishers=[];
      if(g.categories===undefined)g.categories=[];
      if(g.mechanics===undefined)g.mechanics=[];
      if(g.otherLinks===undefined)g.otherLinks=[];
      if(g.bggSubdomains===undefined)g.bggSubdomains=[];
      if(g.bggFamilies===undefined)g.bggFamilies=[];
      // manualUrl is optional, so no specific default needed during load if not present
    });
    console.log("Board games loaded from", DATA_FILE); } else { boardGames=[]; console.log(DATA_FILE, "is empty."); }} else { boardGames=[]; console.log(DATA_FILE, "not found.");}
  } catch(e){console.error("Error loading games:",e);boardGames=[];}
};
const saveGames = async () => { try{const d=path.dirname(DATA_FILE);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});await fs.promises.writeFile(DATA_FILE,JSON.stringify(boardGames,null,2),"utf-8"); console.log("Board games saved to", DATA_FILE);}catch(e){console.error("Error saving games:",e);}};
loadGames();

app.get("/api/boardgames", (req,res)=>res.json(boardGames));
app.post("/api/boardgames", async (req: Request, res: Response) => {
  const { /* existing fields ... */
    name, description, version, bggId, status, bggRating, bggComplexity, yearPublished,
    minPlayers, maxPlayers, playingTime, thumbnailUrl, imageUrl, playCount, isExpansion,
    baseGameAppId, bggBaseGameId, bggExpansionIds, designers, publishers, categories, mechanics,
    locationRoom, locationCupboard, locationShelf, locationNotes, officialWebsiteUrl, otherLinks,
    crowdfundingPlatform, crowdfundingUrl, crowdfundingStatus, bggSubdomains, bggFamilies,
    // New manual URL field
    manualUrl
  } = req.body as Partial<BoardGame>;

  if (!name || !description) return res.status(400).json({ message: "Name and description are required" });
  const newGame: BoardGame = {
    id: uuidv4(), name, description, version, bggId, status, bggRating, bggComplexity, yearPublished,
    minPlayers, maxPlayers, playingTime, thumbnailUrl, imageUrl, playCount: playCount || 0,
    isExpansion: isExpansion || false, baseGameAppId, bggBaseGameId,
    bggExpansionIds: bggExpansionIds || [], designers: designers || [], publishers: publishers || [],
    categories: categories || [], mechanics: mechanics || [],
    locationRoom, locationCupboard, locationShelf, locationNotes,
    officialWebsiteUrl, otherLinks: otherLinks || [],
    crowdfundingPlatform, crowdfundingUrl, crowdfundingStatus,
    bggSubdomains: bggSubdomains || [], bggFamilies: bggFamilies || [],
    manualUrl, // Add new field
  };
  boardGames.push(newGame); await saveGames(); res.status(201).json(newGame);
});
app.patch("/api/boardgames/:id/played", async (req,res)=>{const gId=req.params.id; const i=boardGames.findIndex(g=>g.id===gId); if(i===-1)return res.status(404).json({message:"Game not found"}); const gm=boardGames[i]; gm.playCount=(gm.playCount||0)+1; gm.lastPlayedDate=new Date().toISOString(); boardGames[i]=gm; await saveGames(); res.json(gm);});

const bggClient = BggClient.Create();
app.get("/api/bgg/search", async(req,res)=>{const n=req.query.name as string;if(!n)return res.status(400).json({message:"Game name query parameter required"});try{const sr=await bggClient.search.query({query:n,type:"boardgame,boardgameexpansion"});res.json(sr||[]);}catch(e){console.error("Error searching BGG:",e);res.status(500).json({message:"Failed to search BGG"});}});
app.get("/api/bgg/game/:bggId", async(req,res)=>{
  const idNum = parseInt(req.params.bggId,10); if(isNaN(idNum)) return res.status(400).json({message:"Valid BGG ID is required"});
  try{ const tr = await bggClient.thing.query({id:[idNum],stats:1,versions:1,videos:1}); if(!tr||!tr.length) return res.status(404).json({message:"Game not found on BGG"});
    const gd=tr[0]; let isExp=false,bggBaseId:number|undefined=undefined;
    const bggExpIds:number[]=[],des:string[]=[],pub:string[]=[],cat:string[]=[],mec:string[]=[];
    let webUrl:string|undefined=undefined; const subdom:string[]=[],fam:string[]=[];
    if(typeof gd.website==="object"&&gd.website!==null&&"value"in gd.website)webUrl=(gd.website as {value:string}).value; else if(typeof gd.website==="string")webUrl=gd.website;
    if(gd.links&&Array.isArray(gd.links)){gd.links.forEach((l:Link)=>{switch(l.type){
      case"boardgameexpansion":if(l.inbound==="true"){isExp=true;bggBaseId=l.id}else{bggExpIds.push(l.id)}break;
      case"boardgamedesigner":des.push(l.value);break;case"boardgamepublisher":p.push(l.value);break;
      case"boardgamecategory":cat.push(l.value);break;case"boardgamemechanic":mec.push(l.value);break;
      case"boardgamesubdomain":subdom.push(l.value);break;case"boardgamefamily":fam.push(l.value);break;
    }});}
    const augDetails={...gd,_isExpansionFromBgg:isExp,_bggBaseGameIdFromBgg:bggBaseId,
      _bggExpansionIdsFromBgg:bggExpIds,_designers:des,_publishers:pub,_categories:cat,_mechanics:mec,
      _officialWebsiteFromBgg:webUrl,_bggSubdomains:subdom,_bggFamilies:fam};
    res.json(augDetails);
  }catch(e){console.error("Error fetching BGG details:",e);res.status(500).json({message:"Failed to fetch BGG details"});}
});
app.get("/",(req,res)=>res.send("Hello from Express backend!")); app.listen(port,()=>console.log(`Backend server running on http://localhost:${port}`));
