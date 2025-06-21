import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
// Assuming all types are correctly defined in "./types"
import { BoardGame, OtherLink, CardSet, PlaySession, BggVideoLink, PlayerInPlaySession, BggReimplementation } from "./types";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import multer from "multer";
import { BggClient } from "boardgamegeekclient";
import type { Link, Video } from "boardgamegeekclient/dist/esm/types";

dotenv.config();
const app = express(); const port = process.env.PORT || 3000;
// const DATA_FILE = path.join(__dirname, "..", "data", "boardgames.json"); // No longer used
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"))); // Serves all subdirectories in uploads

// Knex setup (assuming it is in db/gameService.ts or similar and gameService is imported)
import * as gameService from "./db/gameService";


// --- Multer Configurations ---
// Game Images
const gameImageStorage = multer.diskStorage({ destination:(req,file,cb)=>{const p=path.join(__dirname,"..","uploads","game-images");fs.mkdirSync(p,{recursive:true});cb(null,p)}, filename:(req,file,cb)=>{ const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); }});
const imageFileFilter = (req:Request,file:Express.Multer.File,cb:multer.FileFilterCallback)=>{if(file.mimetype.startsWith("image/"))cb(null,true);else cb(new Error("Image only (jpeg, png, gif)."))};
const gameImageUpload = multer({storage:gameImageStorage,fileFilter:imageFileFilter,limits:{fileSize:5*1024*1024}});

// Manuals
const manualFileStorage = multer.diskStorage({ destination:(req,file,cb)=>{const p=path.join(__dirname,"..","uploads","game-manuals");fs.mkdirSync(p,{recursive:true});cb(null,p)}, filename:(req,file,cb)=>{ const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); }});
const manualFileFilter=(req:Request,file:Express.Multer.File,cb:multer.FileFilterCallback)=>{const at=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];if(at.includes(file.mimetype))cb(null,true);else cb(new Error("Invalid file type for manual (PDF, DOC, DOCX, TXT)."))};
const manualUpload = multer({storage:manualFileStorage,fileFilter:manualFileFilter,limits:{fileSize:20*1024*1024}});

// Generic Attachments (New)
const attachmentFileStorage = multer.diskStorage({
  destination: (req, file, cb) => { const p=path.join(__dirname,"..","uploads","game-attachments"); fs.mkdirSync(p,{recursive:true}); cb(null, p); },
  filename: (req, file, cb) => { const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); }
});
const attachmentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "application/pdf", "application/zip", "application/x-zip-compressed",
    "image/png", "image/jpeg", "image/gif", "image/svg+xml",
    "text/plain", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "model/stl",
  ];
  if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith(".stl")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for attachment. Allowed: PDF, ZIP, common images, text, docs, spreadsheets, STL. MIME: " + file.mimetype));
  }
};
const attachmentUpload = multer({ storage: attachmentFileStorage, fileFilter: attachmentFileFilter, limits: { fileSize: 50 * 1024 * 1024 } });


// --- File Upload Endpoints ---
app.post("/api/images/upload/game", gameImageUpload.single("gameImage"), (req,res,next:NextFunction)=>{if(!req.file)return res.status(400).json({message:"No file uploaded or type invalid."});res.status(201).json({message:"Image uploaded successfully",imageUrl:\`/uploads/game-images/\${req.file.filename}\`})},(err:Error,req:Request,res:Response,next:NextFunction)=>{if(err instanceof multer.MulterError)return res.status(400).json({message:err.message});else if(err)return res.status(400).json({message:err.message});next()});
app.post("/api/files/upload/manual", manualUpload.single("gameManualFile"), (req,res,next:NextFunction)=>{if(!req.file)return res.status(400).json({message:"No file uploaded or file type invalid for manual."});res.status(201).json({message:"Manual uploaded successfully",manualUrl:\`/uploads/game-manuals/\${req.file.filename}\`})},(err:Error,req:Request,res:Response,next:NextFunction)=>{if(err instanceof multer.MulterError)return res.status(400).json({message:err.message});else if(err)return res.status(400).json({message:err.message});next()});

// New Endpoint for Generic Attachments
app.post("/api/files/upload/attachment", attachmentUpload.single("gameAttachmentFile"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or file type invalid for attachment." });
  }
  const publicUrlPath = \`/uploads/game-attachments/\${req.file.filename}\`;
  res.status(201).json({
    message: "Attachment uploaded successfully",
    fileUrl: publicUrlPath,
    originalName: req.file.originalname,
    fileType: req.file.mimetype
  });
}, (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.message });
  else if (error) return res.status(400).json({ message: error.message });
  next();
});


// --- Board Game CRUD API Endpoints & BGG routes (using gameService) ---
app.get("/api/boardgames", async (req: Request, res: Response, next: NextFunction) => { try {const games = await gameService.getAllGames(); res.json(games);} catch (error) {next(error);} });
app.get("/api/boardgames/:id", async(req: Request, res: Response, next: NextFunction)=>{try{const game=await gameService.getGameById(req.params.id);if(game)res.json(game);else res.status(404).json({message:"Game not found"})}catch(error){next(error)}});
app.post("/api/boardgames", async(req: Request, res: Response, next: NextFunction)=>{try{if(!req.body.name||!req.body.description)return res.status(400).json({message:"Name and description are required."});const newGame=await gameService.createGame(req.body);res.status(201).json(newGame)}catch(error){next(error)}});
app.put("/api/boardgames/:id", async(req: Request, res: Response, next: NextFunction)=>{try{const updatedGame=await gameService.updateGame(req.params.id,req.body);if(updatedGame)res.json(updatedGame);else res.status(404).json({message:"Game not found or update failed"})}catch(error){next(error)}});
app.delete("/api/boardgames/:id", async (req: Request, res: Response, next: NextFunction) => { try { const success = await gameService.deleteGame(req.params.id); if (success) { res.status(204).send(); } else { res.status(404).json({ message: "Game not found" }); } } catch (error) { next(error); } });
app.post("/api/boardgames/:gameId/plays", async (req: Request, res: Response, next: NextFunction) => { try { if (!req.body.date) return res.status(400).json({ message: "Date is required for a play session." }); const newPlaySession = await gameService.addPlaySessionToGame(req.params.gameId, req.body); if (newPlaySession) { res.status(201).json(newPlaySession); } else { res.status(404).json({ message: "Game not found or could not add play session." }); } } catch (error) { next(error); } });
app.delete("/api/boardgames/:gameId/plays/:playId", async (req: Request, res: Response, next: NextFunction) => { try { const success = await gameService.deletePlaySessionFromGame(req.params.gameId, req.params.playId); if (success) { res.status(200).json({ message: "Play session deleted." }); } else { res.status(404).json({ message: "Play session or game not found." }); } } catch (error) { next(error); } });

const bggClient = BggClient.Create();
app.get("/api/bgg/search", async(req,res,next)=>{try{const n=req.query.name as string;if(!n)return res.status(400).json({message:"Game name query parameter required"});const sr=await bggClient.search.query({query:n,type:"boardgame,boardgameexpansion"});res.json(sr||[]);}catch(e){next(e);}});
app.get("/api/bgg/game/:bggId", async(req,res,next)=>{try{const idNum=parseInt(req.params.bggId,10);if(isNaN(idNum))return res.status(400).json({message:"Valid BGG ID required"});const tr=await bggClient.thing.query({id:[idNum],stats:1,versions:1,videos:1});if(!tr||!tr.length)return res.status(404).json({message:"Game not found on BGG"});const gd=tr[0];let isExp=false,bggBaseId:number|undefined=undefined;const bggExpIds:number[]=[],des:string[]=[],pub:string[]=[],cat:string[]=[],mec:string[]=[];let webUrl:string|undefined=undefined;const subdom:string[]=[],fam:string[]=[];const vidsFromBgg:BggVideoLink[]=[];const reimplementationsFromBgg:BggReimplementation[]=[];if(typeof gd.website==="object"&&gd.website!==null&&"value"in gd.website)webUrl=(gd.website as{value:string}).value;else if(typeof gd.website==="string")webUrl=gd.website;if(gd.links&&Array.isArray(gd.links)){gd.links.forEach((l:Link)=>{switch(l.type){case"boardgameexpansion":if(l.inbound==="true"){isExp=true;bggBaseId=l.id}else{bggExpIds.push(l.id)}break;case"boardgamedesigner":des.push(l.value);break;case"boardgamepublisher":p.push(l.value);break;case"boardgamecategory":cat.push(l.value);break;case"boardgamemechanic":mec.push(l.value);break;case"boardgamesubdomain":subdom.push(l.value);break;case"boardgamefamily":fam.push(l.value);break;case"reimplementation":reimplementationsFromBgg.push({bggId:l.id,name:l.value});break;}});}if(gd.videos&&Array.isArray(gd.videos.video)){gd.videos.video.forEach((v:Video)=>{vidsFromBgg.push({title:v["@_title"],url:v["@_link"],language:v["@_language"],uploader:v["@_username"],postDate:v["@_postdate"]});});}const augDetails={...gd,_isExpansionFromBgg:isExp,_bggBaseGameIdFromBgg:bggBaseId,_bggExpansionIdsFromBgg:bggExpIds,_designers:des,_publishers:pub,_categories:cat,_mechanics:mec,_officialWebsiteFromBgg:webUrl,_bggSubdomains:subdom,_bggFamilies:fam,_bggVideos:vidsFromBgg,_bggReimplementations:reimplementationsFromBgg};res.json(augDetails);}catch(e){next(e);}});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler caught:", err.message);
  res.status(500).json({message: "An internal server error occurred.", error: err.message});
});

app.get("/",(req,res)=>res.send("Backend OK - DB Version"));
app.listen(port,()=>console.log(`Server on port ${port} (DB Version)`));
