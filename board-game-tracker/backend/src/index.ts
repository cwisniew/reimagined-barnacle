import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
// Types are now primarily used by gameService, but can be here for request body typing
import type { BoardGame, PlaySession } from "./types";
import { v4 as uuidv4 } from "uuid";
// fs might still be needed for Multer's directory creation, or remove if Multer handles it all.
// For now, keeping it for safety as Multer config uses fs.mkdirSync.
import fs from "fs";
import path from "path";
import multer from "multer";
import { BggClient } from "boardgamegeekclient";
// import type { Link, Video } from "boardgamegeekclient/dist/esm/types"; // For BGG client, if needed directly

import * as gameService from "./db/gameService";

dotenv.config();
const app = express(); const port = process.env.PORT || 3000;
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Image & Manual Upload Config & Endpoints (Multer config needs fs and path)
const gameImageStorage = multer.diskStorage({ destination:(req,f,cb)=>{const p=path.join(__dirname,"..","uploads","game-images");fs.mkdirSync(p,{recursive:true});cb(null,p)}, filename:(req,f,cb)=>{const uS=Date.now()+"-"+Math.round(Math.random()*1E9);cb(null,f.fieldname+"-"+uS+path.extname(f.originalname))}});
const imageFileFilter = (req:Request,f:Express.Multer.File,cb:multer.FileFilterCallback)=>{if(f.mimetype.startsWith("image/"))cb(null,true);else cb(new Error("Only image files are allowed!"))};
const gameImageUpload = multer({ storage: gameImageStorage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const manualFileStorage = multer.diskStorage({ destination:(req,f,cb)=>{const p=path.join(__dirname,"..","uploads","game-manuals");fs.mkdirSync(p,{recursive:true});cb(null,p)}, filename:(req,f,cb)=>{const uS=Date.now()+"-"+Math.round(Math.random()*1E9);cb(null,f.fieldname+"-"+uS+path.extname(f.originalname))}});
const manualFileFilter=(req:Request,f:Express.Multer.File,cb:multer.FileFilterCallback)=>{const at=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];if(at.includes(f.mimetype))cb(null,true);else cb(new Error("Invalid file type for manual."))};
const manualUpload = multer({storage:manualFileStorage,fileFilter:manualFileFilter,limits:{fileSize:20*1024*1024}});
app.post("/api/images/upload/game", gameImageUpload.single("gameImage"), (req,res)=>{if(!req.file)return res.status(400).json({message:"No file uploaded."});res.status(201).json({message:"Image uploaded.",imageUrl:\`/uploads/game-images/\${req.file.filename}\`})},(err:Error,req:Request,res:Response,next:NextFunction)=>{if(err instanceof multer.MulterError)return res.status(400).json({message:err.message});else if(err)return res.status(400).json({message:err.message});next()});
app.post("/api/files/upload/manual", manualUpload.single("gameManualFile"), (req,res)=>{if(!req.file)return res.status(400).json({message:"No manual file uploaded."});res.status(201).json({message:"Manual uploaded.",manualUrl:\`/uploads/game-manuals/\${req.file.filename}\`})},(err:Error,req:Request,res:Response,next:NextFunction)=>{if(err instanceof multer.MulterError)return res.status(400).json({message:err.message});else if(err)return res.status(400).json({message:err.message});next()});


// --- Board Game CRUD API Endpoints ---
app.get("/api/boardgames", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const games = await gameService.getAllGames();
    res.json(games);
  } catch (error) {
    console.error("Error in GET /api/boardgames:", error);
    next(error);
  }
});

app.get("/api/boardgames/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const game = await gameService.getGameById(req.params.id);
    if (game) {
      res.json(game);
    } else {
      res.status(404).json({ message: "Game not found" });
    }
  } catch (error) {
    console.error(`Error in GET /api/boardgames/\${req.params.id}:`, error);
    next(error);
  }
});

app.post("/api/boardgames", async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).send({message: "POST /api/boardgames not yet implemented with DB"});
});
app.put("/api/boardgames/:id", async (req, res, next: NextFunction) => {
  res.status(501).send({message: "PUT /api/boardgames/:id not yet implemented with DB"});
});
app.delete("/api/boardgames/:id", async (req, res, next: NextFunction) => {
  res.status(501).send({message: "DELETE /api/boardgames/:id not yet implemented with DB"});
});
app.post("/api/boardgames/:gameId/plays", async (req, res, next: NextFunction) => {
  res.status(501).send({message: "POST /api/boardgames/:gameId/plays not yet implemented with DB"});
});
app.delete("/api/boardgames/:gameId/plays/:playId", async (req, res, next: NextFunction) => {
  res.status(501).send({message: "DELETE /api/boardgames/:gameId/plays/:playId not yet implemented with DB"});
});

// BGG Endpoints (remain same for now, might be refactored later if needed)
const bggClient = BggClient.Create();
app.get("/api/bgg/search", async(req,res, next)=>{try{const n=req.query.name as string;if(!n)return res.status(400).json({message:"Game name query parameter required"});const sr=await bggClient.search.query({query:n,type:"boardgame,boardgameexpansion"});res.json(sr||[]);}catch(e){next(e);}});
app.get("/api/bgg/game/:bggId", async(req,res, next)=>{try{const idNum=parseInt(req.params.bggId,10);if(isNaN(idNum))return res.status(400).json({message:"Valid BGG ID required"});const tr=await bggClient.thing.query({id:[idNum],stats:1,versions:1,videos:1});if(!tr||!tr.length)return res.status(404).json({message:"Game not found on BGG"});const gd=tr[0];let isExp=false,bggBaseId:number|undefined=undefined;const bggExpIds:number[]=[],des:string[]=[],pub:string[]=[],cat:string[]=[],mec:string[]=[];let webUrl:string|undefined=undefined;const subdom:string[]=[],fam:string[]=[];const vidsFromBgg:any[]=[];const reimplementationsFromBgg:any[]=[];if(typeof gd.website==="object"&&gd.website!==null&&"value"in gd.website)webUrl=(gd.website as{value:string}).value;else if(typeof gd.website==="string")webUrl=gd.website;if(gd.links&&Array.isArray(gd.links)){gd.links.forEach((l:Link)=>{switch(l.type){case"boardgameexpansion":if(l.inbound==="true"){isExp=true;bggBaseId=l.id}else{bggExpIds.push(l.id)}break;case"boardgamedesigner":des.push(l.value);break;case"boardgamepublisher":p.push(l.value);break;case"boardgamecategory":cat.push(l.value);break;case"boardgamemechanic":mec.push(l.value);break;case"boardgamesubdomain":subdom.push(l.value);break;case"boardgamefamily":fam.push(l.value);break;case"reimplementation":reimplementationsFromBgg.push({bggId:l.id,name:l.value});break;}});}if(gd.videos&&Array.isArray(gd.videos.video)){gd.videos.video.forEach((v:Video)=>{vidsFromBgg.push({title:v["@_title"],url:v["@_link"],language:v["@_language"],uploader:v["@_username"],postDate:v["@_postdate"]});});}const augDetails={...gd,_isExpansionFromBgg:isExp,_bggBaseGameIdFromBgg:bggBaseId,_bggExpansionIdsFromBgg:bggExpIds,_designers:des,_publishers:pub,_categories:cat,_mechanics:mec,_officialWebsiteFromBgg:webUrl,_bggSubdomains:subdom,_bggFamilies:fam,_bggVideos:vidsFromBgg,_bggReimplementations:reimplementationsFromBgg};res.json(augDetails);}catch(e){next(e);}});

app.get("/",(req,res)=>res.send("Backend OK - DB Version"));
app.listen(port,()=>console.log(\`Server on port \${port} (DB Version)\`));

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler caught an error:", err.stack);
  res.status(500).json({ message: "Something broke on the server!", error: err.message });
});
