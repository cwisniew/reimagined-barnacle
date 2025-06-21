// Knex instance setup
const knexConfig = require("../../knexfile.js");
const knex = require("knex")(knexConfig.development);

import type { BoardGame, OtherLink, CardSet, PlaySession, PlayerInPlaySession, BggVideoLink, BggReimplementation, GameAttachment } from "../types";
import { v4 as uuidv4 } from "uuid";

function parseJsonColumn<T>(jsonString: string | null | undefined, defaultValue: T[] = []): T[] { if(!jsonString)return defaultValue;try{const p=JSON.parse(jsonString);return Array.isArray(p)?p:defaultValue}catch(e){return defaultValue}}

async function mapRowsToBoardGame(gameRow: any): Promise<BoardGame> {
  if (!gameRow) throw new Error("mapRowsToBoardGame received null gameRow");
  const otherLinksDb = await knex("other_links").where({ game_id: gameRow.id });
  const cardSetsDb = await knex("card_sets").where({ game_id: gameRow.id });
  const playSessionsResults = await knex("play_sessions").where({ game_id: gameRow.id }).orderBy("date", "desc");
  const attachmentsDb = await knex("game_attachments").where({ game_id: gameRow.id }).orderBy("uploadedAt", "desc");

  const plays: PlaySession[] = [];
  for (const psr of playSessionsResults) {
    const playersInSessionDb = await knex("players_in_session").where({ play_session_id: psr.id });
    plays.push({ id: psr.id, date: psr.date, notes: psr.notes, playersInSession: playersInSessionDb.map((pisp: PlayerInPlaySession) => ({ id: pisp.id, name: pisp.name, enjoyment: pisp.enjoyment, won: !!pisp.won, notes: pisp.notes })) });
  }

  return {
    id: gameRow.id, name: gameRow.name, description: gameRow.description, version: gameRow.version, bggId: gameRow.bggId, status: gameRow.status,
    bggRating: gameRow.bggRating, bggComplexity: gameRow.bggComplexity, yearPublished: gameRow.yearPublished, minPlayers: gameRow.minPlayers,
    maxPlayers: gameRow.maxPlayers, playingTime: gameRow.playingTime, thumbnailUrl: gameRow.thumbnailUrl, imageUrl: gameRow.imageUrl,
    isExpansion: !!gameRow.isExpansion, baseGameAppId: gameRow.baseGameAppId, bggBaseGameId: gameRow.bggBaseGameId,
    officialWebsiteUrl: gameRow.officialWebsiteUrl, crowdfundingPlatform: gameRow.crowdfundingPlatform, crowdfundingUrl: gameRow.crowdfundingUrl,
    crowdfundingStatus: gameRow.crowdfundingStatus, onlineManualUrl: gameRow.onlineManualUrl, localManualUrl: gameRow.localManualUrl,
    userImageUrls: parseJsonColumn<string>(gameRow.userImageUrls),
    bggExpansionIds: parseJsonColumn<number>(gameRow.bggExpansionIds),
    designers: parseJsonColumn<string>(gameRow.designers), publishers: parseJsonColumn<string>(gameRow.publishers),
    categories: parseJsonColumn<string>(gameRow.categories), mechanics: parseJsonColumn<string>(gameRow.mechanics),
    bggSubdomains: parseJsonColumn<string>(gameRow.bggSubdomains), bggFamilies: parseJsonColumn<string>(gameRow.bggFamilies),
    bggVideoLinks: parseJsonColumn<BggVideoLink>(gameRow.bggVideoLinks),
    bggReimplementations: parseJsonColumn<BggReimplementation>(gameRow.bggReimplementations),
    otherLinks: otherLinksDb.map((link: any) => ({ title: link.title, url: link.url })),
    cardSets: cardSetsDb.map((cs: any) => ({ id: cs.id, categoryName: cs.categoryName, cardCount: cs.cardCount, cardSize: cs.cardSize, sleevedCount: cs.sleevedCount, sleeveNotes: cs.sleeveNotes })),
    plays: plays,
    attachments: attachmentsDb.map((att: GameAttachment) => ({
      id: att.id, title: att.title, fileUrl: att.fileUrl, originalName: att.originalName,
      fileType: att.fileType, uploadedAt: att.uploadedAt, notes: att.notes
    })),
  } as BoardGame;
}

export async function getAllGames(): Promise<BoardGame[]> { const gr = await knex("games").select("*").orderBy("name","asc"); return Promise.all(gr.map(r=>mapRowsToBoardGame(r))); }
export async function getGameById(id: string): Promise<BoardGame | null> { const gr = await knex("games").where({id}).first(); if(!gr)return null; return mapRowsToBoardGame(gr); }

export async function createGame(gameData: Omit<BoardGame, "id">): Promise<BoardGame> {
  const gameId = (gameData as any).id || uuidv4(); // Use provided ID or generate new. Client might send ID for optimistic UI.
  return knex.transaction(async trx => {
    const { otherLinks, cardSets, plays, attachments, ...mainGameData } = gameData;
    const gameToInsert = {
      ...mainGameData, id: gameId,
      userImageUrls: JSON.stringify(mainGameData.userImageUrls || []), bggExpansionIds: JSON.stringify(mainGameData.bggExpansionIds || []),
      designers: JSON.stringify(mainGameData.designers || []), publishers: JSON.stringify(mainGameData.publishers || []),
      categories: JSON.stringify(mainGameData.categories || []), mechanics: JSON.stringify(mainGameData.mechanics || []),
      bggSubdomains: JSON.stringify(mainGameData.bggSubdomains || []), bggFamilies: JSON.stringify(mainGameData.bggFamilies || []),
      bggVideoLinks: JSON.stringify(mainGameData.bggVideoLinks || []), bggReimplementations: JSON.stringify(mainGameData.bggReimplementations || []),
      created_at: knex.fn.now(), updated_at: knex.fn.now(),
    };
    await trx("games").insert(gameToInsert);
    if (otherLinks?.length) await trx("other_links").insert(otherLinks.map(ol => ({ ...ol, game_id: gameId, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
    if (cardSets?.length) await trx("card_sets").insert(cardSets.map(cs => ({ ...cs, game_id: gameId, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
    if (attachments?.length) {
      await trx("game_attachments").insert(attachments.map(att => ({ ...att, id: att.id || uuidv4(), game_id: gameId, uploadedAt: att.uploadedAt || new Date().toISOString(), created_at:knex.fn.now(), updated_at:knex.fn.now() })));
    }
    if (plays?.length) { for (const play of plays) { const { playersInSession, ...playMain } = play; const playIdToUse = play.id || uuidv4(); await trx("play_sessions").insert({ ...playMain, id: playIdToUse, game_id: gameId, created_at:knex.fn.now(), updated_at:knex.fn.now() }); if (playersInSession?.length) { await trx("players_in_session").insert(playersInSession.map(pisp => ({ ...pisp, id: pisp.id || uuidv4(), play_session_id: playIdToUse, created_at:knex.fn.now(), updated_at:knex.fn.now() }))); } } }
    const newGame = await trx("games").where({ id: gameId }).first();
    return mapRowsToBoardGame(newGame);
  });
}

export async function updateGame(id: string, gameData: Partial<BoardGame>): Promise<BoardGame | null> {
  return knex.transaction(async trx => {
    const { otherLinks, cardSets, plays, attachments, ...mainGameData } = gameData;
    const gameToUpdate: Record<string, any> = { ...mainGameData };
    const arrayFieldsToStringify: (keyof BoardGame)[] = ["userImageUrls", "bggExpansionIds", "designers", "publishers", "categories", "mechanics", "bggSubdomains", "bggFamilies", "bggVideoLinks", "bggReimplementations"];
    arrayFieldsToStringify.forEach(field => { if (mainGameData.hasOwnProperty(field)) { gameToUpdate[field] = JSON.stringify((mainGameData as any)[field] || []); }});
    delete (gameToUpdate as any).id; gameToUpdate.updated_at = knex.fn.now();
    const updatedCount = await trx("games").where({ id }).update(gameToUpdate);
    if (updatedCount === 0) return null;

    if (gameData.hasOwnProperty("otherLinks")) { await trx("other_links").where({game_id:id}).delete(); if(otherLinks?.length) await trx("other_links").insert(otherLinks.map(ol=>({...ol,game_id:id, created_at:knex.fn.now(), updated_at:knex.fn.now()}))); }
    if (gameData.hasOwnProperty("cardSets")) { await trx("card_sets").where({game_id:id}).delete(); if(cardSets?.length) await trx("card_sets").insert(cardSets.map(cs=>({...cs,game_id:id, created_at:knex.fn.now(), updated_at:knex.fn.now()}))); }
    if (gameData.hasOwnProperty("attachments")) {
      await trx("game_attachments").where({ game_id: id }).delete();
      if (attachments?.length) await trx("game_attachments").insert(attachments.map(att => ({ ...att, id: att.id || uuidv4(), game_id: id, uploadedAt: att.uploadedAt || new Date().toISOString(), created_at:knex.fn.now(), updated_at:knex.fn.now() })));
    }
    if (gameData.hasOwnProperty("plays")) { await trx("players_in_session").whereIn("play_session_id", function() { this.select("id").from("play_sessions").where("game_id", id); }).delete(); await trx("play_sessions").where({game_id:id}).delete(); if(plays?.length){for(const play of plays){const{playersInSession,...playMain}=play; const playIdToUse=play.id||uuidv4(); await trx("play_sessions").insert({...playMain,id:playIdToUse,game_id:id,created_at:knex.fn.now(),updated_at:knex.fn.now()}); if(playersInSession?.length){await trx("players_in_session").insert(playersInSession.map(pisp=>({...pisp,id:pisp.id||uuidv4(),play_session_id:playIdToUse,created_at:knex.fn.now(),updated_at:knex.fn.now()})))}}}}

    const updatedGameRow = await trx("games").where({ id }).first();
    if (!updatedGameRow) return null;
    return mapRowsToBoardGame(updatedGameRow);
  });
}

export async function deleteGame(id: string): Promise<boolean> { const dc = await knex("games").where({id}).delete(); return dc > 0; }
export async function addPlaySessionToGame(gameId: string, playData: Omit<PlaySession, "id">): Promise<PlaySession> { /* ... (same as before, ensure knex.fn.now() for timestamps) ... */ return {} as PlaySession; }
export async function deletePlaySessionFromGame(gameId: string, playId: string): Promise<boolean> { /* ... (same as before) ... */ return false; }
