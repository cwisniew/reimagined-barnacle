import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { BoardGame, OtherLink, CardSet, PlaySession, BggVideoLink, PlayerInPlaySession, BggReimplementation } from "./types"; // Added BggVideoLink back to BoardGame context
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { BggClient } from "boardgamegeekclient";
import type { Link, Video } from "boardgamegeekclient/dist/esm/types";

dotenv.config();
const app = express(); const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "..", "data", "boardgames.json");
app.use(express.json()); app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
let boardGames: BoardGame[] = [];

const loadGames = () => {
  try { if (fs.existsSync(DATA_FILE)) { const d = fs.readFileSync(DATA_FILE, "utf-8"); if(d){ const p = JSON.parse(d); boardGames = Array.isArray(p)?p:[];
    boardGames.forEach(g=>{
      delete (g as any).playCount; delete (g as any).lastPlayedDate;
      if(g.plays===undefined) g.plays=[]; else if (Array.isArray(g.plays)) { g.plays.forEach(play => { if ((play as any).playerNames && !play.playersInSession) { play.playersInSession = ((play as any).playerNames as string[]).map(name => ({ id: uuidv4(), name: name })); delete (play as any).playerNames; } else if (!play.playersInSession) { play.playersInSession = []; } }); }
      if(g.isExpansion===undefined)g.isExpansion=false; if(g.bggExpansionIds===undefined)g.bggExpansionIds=[];
      if(g.designers===undefined)g.designers=[]; if(g.publishers===undefined)g.publishers=[]; if(g.categories===undefined)g.categories=[]; if(g.mechanics===undefined)g.mechanics=[];
      if(g.otherLinks===undefined)g.otherLinks=[]; if(g.bggSubdomains===undefined)g.bggSubdomains=[]; if(g.bggFamilies===undefined)g.bggFamilies=[];
      if(g.cardSets===undefined)g.cardSets=[]; if(g.userImageUrls===undefined)g.userImageUrls=[];
      if(g.bggReimplementations===undefined)g.bggReimplementations=[];
      if(g.bggVideoLinks===undefined)g.bggVideoLinks=[]; // Initialize new field
    }); console.log("Board games loaded from", DATA_FILE); } else { boardGames=[]; console.log(DATA_FILE, "is empty.");}} else { boardGames=[]; console.log(DATA_FILE, "not found.");}
  } catch(e){console.error("Error loading games:",e);boardGames=[];}
};
const saveGames = async () => { try{const d=path.dirname(DATA_FILE);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});await fs.promises.writeFile(DATA_FILE,JSON.stringify(boardGames,null,2),"utf-8"); console.log("Board games saved to", DATA_FILE);}catch(e){console.error("Error saving games:",e);}};
loadGames();

const storage = multer.diskStorage({ destination:(req,f,cb)=>{const up=path.join(__dirname,"..","uploads","game-images");fs.mkdirSync(up,{recursive:true});cb(null,up)}, filename:(req,f,cb)=>{ const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); cb(null, f.fieldname + '-' + uniqueSuffix + path.extname(f.originalname));} });
const imageFileFilter = (req:Request,f:Express.Multer.File,cb:multer.FileFilterCallback)=>{if(f.mimetype.startsWith("image/"))cb(null,true);else cb(new Error("Only image files (jpeg, png, gif) are allowed!"))};
const upload = multer({storage,fileFilter:imageFileFilter,limits:{fileSize:5*1024*1024}});
app.post("/api/images/upload/game", upload.single("gameImage"), (req,res)=>{if(!req.file)return res.status(400).json({message:"No file uploaded or type invalid."});res.status(201).json({message:"Image uploaded successfully",imageUrl:\`/uploads/game-images/\${req.file.filename}\`})},(err:Error,req:Request,res:Response,next:express.NextFunction)=>{if(err instanceof multer.MulterError)res.status(400).json({message:err.message});else if(err)res.status(400).json({message:err.message});next()});

app.get("/api/boardgames", (req,res)=>res.json(boardGames));
app.get("/api/boardgames/:id", (req,res)=>{const gid=req.params.id;const gm=boardGames.find(g=>g.id===gid);if(gm)res.json(gm);else res.status(404).json({message:"Game not found"});});

app.post("/api/boardgames", async (req: Request, res: Response) => {
  const { name, description, version, bggId, status, bggRating, bggComplexity, yearPublished, minPlayers, maxPlayers, playingTime, thumbnailUrl, imageUrl, isExpansion, baseGameAppId, bggBaseGameId, bggExpansionIds, designers, publishers, categories, mechanics, locationRoom, locationCupboard, locationShelf, locationNotes, officialWebsiteUrl, otherLinks, crowdfundingPlatform, crowdfundingUrl, crowdfundingStatus, bggSubdomains, bggFamilies, manualUrl, cardSets, plays, userImageUrls, bggReimplementations, bggVideoLinks } = req.body as Partial<BoardGame>;
  if (!name || !description) return res.status(400).json({ message: "Name and description are required fields."});

  const newGame: BoardGame = {
    id: uuidv4(), name, description, version, bggId, status, bggRating, bggComplexity, yearPublished,
    minPlayers, maxPlayers, playingTime, thumbnailUrl, imageUrl, userImageUrls: userImageUrls || [],
    plays: plays || [],
    isExpansion: isExpansion || false, baseGameAppId, bggBaseGameId,
    bggExpansionIds: bggExpansionIds || [], designers: designers || [], publishers: publishers || [],
    categories: categories || [], mechanics: mechanics || [],
    locationRoom, locationCupboard, locationShelf, locationNotes,
    officialWebsiteUrl, otherLinks: otherLinks || [],
    crowdfundingPlatform, crowdfundingUrl, crowdfundingStatus,
    bggSubdomains: bggSubdomains || [], bggFamilies: bggFamilies || [], manualUrl,
    cardSets: cardSets || [],
    bggReimplementations: bggReimplementations || [],
    bggVideoLinks: bggVideoLinks || [] // Initialize if not provided
  };
  boardGames.push(newGame); await saveGames(); res.status(201).json(newGame);
});

app.put("/api/boardgames/:id", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const gameData = req.body as Partial<BoardGame>;
  const gameIndex = boardGames.findIndex(g=>g.id===gameId);
  if(gameIndex === -1) return res.status(404).json({message:"Game not found"});

  const updateData = { ...gameData };
  // If client sends an empty array for an array field, it should be updated to empty.
  // If client omits an array field, existing data for that field should be preserved by spread.
  if (gameData.hasOwnProperty("userImageUrls")) updateData.userImageUrls = gameData.userImageUrls || [];
  if (gameData.hasOwnProperty("bggReimplementations")) updateData.bggReimplementations = gameData.bggReimplementations || [];
  if (gameData.hasOwnProperty("bggVideoLinks")) updateData.bggVideoLinks = gameData.bggVideoLinks || [];
  if (gameData.hasOwnProperty("otherLinks")) updateData.otherLinks = gameData.otherLinks || [];
  if (gameData.hasOwnProperty("cardSets")) updateData.cardSets = gameData.cardSets || [];
  if (gameData.hasOwnProperty("plays")) updateData.plays = gameData.plays || [];
  // etc for all array fields

  boardGames[gameIndex] = {...boardGames[gameIndex], ...updateData, id: gameId };
  await saveGames(); res.json(boardGames[gameIndex]);
});
app.delete("/api/boardgames/:id", async (req, res) => { const gameId = req.params.id; const il = boardGames.length; boardGames = boardGames.filter(g=>g.id!==gameId); if(boardGames.length===il)return res.status(404).json({message:"Game not found"}); await saveGames(); res.status(204).send();});
app.post("/api/boardgames/:gameId/plays", async (req, res) => { const {gameId}=req.params; const {date,playersInSession,notes}=req.body as Omit<PlaySession,"id">; if(!date)return res.status(400).json({message:"Date required"}); const gi=boardGames.findIndex(g=>g.id===gameId); if(gi===-1)return res.status(404).json({message:"Game NF"}); const np:PlaySession={id:uuidv4(),date,playersInSession:playersInSession||[],notes}; if(!boardGames[gi].plays)boardGames[gi].plays=[]; boardGames[gi].plays!.push(np); boardGames[gi].plays!.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()); await saveGames(); res.status(201).json(np);});
app.delete("/api/boardgames/:gameId/plays/:playId", async (req, res) => { const {gameId,playId}=req.params; const gi=boardGames.findIndex(g=>g.id===gameId); if(gi===-1)return res.status(404).json({message:"Game NF"}); const g=boardGames[gi]; if(!g.plays)return res.status(404).json({message:"No plays"}); const pi=g.plays.findIndex(p=>p.id===playId); if(pi===-1)return res.status(404).json({message:"Play NF"}); g.plays.splice(pi,1); await saveGames(); res.status(200).json({message:"Play deleted"});});

const bggClient = BggClient.Create();
app.get("/api/bgg/search", async(req,res)=>{const n=req.query.name as string;if(!n)return res.status(400).json({message:"Game name query parameter required"});try{const sr=await bggClient.search.query({query:n,type:"boardgame,boardgameexpansion"});res.json(sr||[]);}catch(e){console.error("Error searching BGG:",e);res.status(500).json({message:"Failed to search BGG"});}});
app.get("/api/bgg/game/:bggId", async(req,res)=>{
  const idNum = parseInt(req.params.bggId,10); if(isNaN(idNum)) return res.status(400).json({message:"Valid BGG ID is required"});
  try{ const tr = await bggClient.thing.query({id:[idNum],stats:1,versions:1,videos:1}); if(!tr||!tr.length) return res.status(404).json({message:"Game not found on BGG"});
    const gd=tr[0]; let isExp=false,bggBaseId:number|undefined=undefined; const bggExpIds:number[]=[],des:string[]=[],pub:string[]=[],cat:string[]=[],mec:string[]=[]; let webUrl:string|undefined=undefined; const subdom:string[]=[],fam:string[]=[]; const vidsFromBgg:BggVideoLink[] = []; const reimplementationsFromBgg: BggReimplementation[] = [];
    if(typeof gd.website==="object"&&gd.website!==null&&"value"in gd.website)webUrl=(gd.website as {value:string}).value; else if(typeof gd.website==="string")webUrl=gd.website;
    if(gd.links&&Array.isArray(gd.links)){gd.links.forEach((l:Link)=>{switch(l.type){
      case"boardgameexpansion":if(l.inbound==="true"){isExp=true;bggBaseId=l.id}else{bggExpIds.push(l.id)}break;
      case"boardgamedesigner":des.push(l.value);break;case"boardgamepublisher":p.push(l.value);break;
      case"boardgamecategory":cat.push(l.value);break;case"boardgamemechanic":mec.push(l.value);break;
      case"boardgamesubdomain":subdom.push(l.value);break;case"boardgamefamily":fam.push(l.value);break;
      case"reimplementation": reimplementationsFromBgg.push({ bggId: l.id, name: l.value }); break;
    }});}
    if (gd.videos && Array.isArray(gd.videos.video)) { gd.videos.video.forEach((v: Video) => { vidsFromBgg.push({ title: v["@_title"], url: v["@_link"], language: v["@_language"], uploader: v["@_username"], postDate: v["@_postdate"] }); }); }
    const augDetails={...gd,_isExpansionFromBgg:isExp,_bggBaseGameIdFromBgg:bggBaseId,_bggExpansionIdsFromBgg:bggExpIds,
      _designers:des,_publishers:pub,_categories:cat,_mechanics:mec,_officialWebsiteFromBgg:webUrl,
      _bggSubdomains:subdom,_bggFamilies:fam,_bggVideos:vidsFromBgg, _bggReimplementations:reimplementationsFromBgg
    };
    res.json(augDetails);
  }catch(e){console.error("Error fetching BGG details:",e);res.status(500).json({message:"Failed to fetch BGG details"});}
});
app.get("/",(req,res)=>res.send("Backend OK"));app.listen(port,()=>console.log(`Server on port ${port}`));
