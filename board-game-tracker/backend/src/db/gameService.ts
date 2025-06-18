// Knex instance setup
const knexConfig = require("../../knexfile.js");
const knex = require("knex")(knexConfig.development);

import type { BoardGame, OtherLink, CardSet, PlaySession, PlayerInPlaySession, BggVideoLink, BggReimplementation } from "../types";
import { v4 as uuidv4 } from "uuid";

// Helper to parse JSON columns
function parseJsonColumn<T>(jsonString: string | null | undefined, defaultValue: T[] = []): T[] {
  if (jsonString === null || jsonString === undefined) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    // Ensure it's an array, or an array of objects if T implies object structure (like BggVideoLink[])
    if (Array.isArray(parsed)) {
        // If defaultValue is an array of objects, we might want to check if parsed items match the structure.
        // For simplicity, just checking if it's an array.
        return parsed;
    }
    return defaultValue;
  } catch (e) {
    // console.warn("Failed to parse JSON column, returning default. String was:", jsonString, e);
    return defaultValue;
  }
}

// Helper to reconstruct a full BoardGame object
async function mapRowsToBoardGame(gameRow: any): Promise<BoardGame> {
  if (!gameRow) throw new Error("mapRowsToBoardGame received null gameRow");
  const otherLinksDb = await knex("other_links").where({ game_id: gameRow.id });
  const cardSetsDb = await knex("card_sets").where({ game_id: gameRow.id });
  const playSessionsResults = await knex("play_sessions").where({ game_id: gameRow.id }).orderBy("date", "desc");

  const plays: PlaySession[] = [];
  for (const psr of playSessionsResults) {
    const playersInSessionDb = await knex("players_in_session").where({ play_session_id: psr.id });
    plays.push({
      id: psr.id,
      date: psr.date,
      notes: psr.notes,
      playersInSession: playersInSessionDb.map((pisp: PlayerInPlaySession) => ({
        id: pisp.id,
        name: pisp.name,
        enjoyment: pisp.enjoyment,
        won: !!pisp.won,
        notes: pisp.notes
      }))
    });
  }

  return {
    id: gameRow.id,
    name: gameRow.name,
    description: gameRow.description,
    version: gameRow.version,
    bggId: gameRow.bggId,
    status: gameRow.status,
    bggRating: gameRow.bggRating,
    bggComplexity: gameRow.bggComplexity,
    yearPublished: gameRow.yearPublished,
    minPlayers: gameRow.minPlayers,
    maxPlayers: gameRow.maxPlayers,
    playingTime: gameRow.playingTime,
    thumbnailUrl: gameRow.thumbnailUrl,
    imageUrl: gameRow.imageUrl,
    isExpansion: !!gameRow.isExpansion,
    baseGameAppId: gameRow.baseGameAppId,
    bggBaseGameId: gameRow.bggBaseGameId,
    officialWebsiteUrl: gameRow.officialWebsiteUrl,
    crowdfundingPlatform: gameRow.crowdfundingPlatform,
    crowdfundingUrl: gameRow.crowdfundingUrl,
    crowdfundingStatus: gameRow.crowdfundingStatus,
    onlineManualUrl: gameRow.onlineManualUrl,
    localManualUrl: gameRow.localManualUrl,

    userImageUrls: parseJsonColumn<string>(gameRow.userImageUrls),
    bggExpansionIds: parseJsonColumn<number>(gameRow.bggExpansionIds),
    designers: parseJsonColumn<string>(gameRow.designers),
    publishers: parseJsonColumn<string>(gameRow.publishers),
    categories: parseJsonColumn<string>(gameRow.categories),
    mechanics: parseJsonColumn<string>(gameRow.mechanics),
    bggSubdomains: parseJsonColumn<string>(gameRow.bggSubdomains),
    bggFamilies: parseJsonColumn<string>(gameRow.bggFamilies),
    bggVideoLinks: parseJsonColumn<BggVideoLink>(gameRow.bggVideoLinks),
    bggReimplementations: parseJsonColumn<BggReimplementation>(gameRow.bggReimplementations),

    otherLinks: otherLinksDb.map((link: any) => ({ title: link.title, url: link.url })),
    cardSets: cardSetsDb.map((cs: any) => ({
        id: cs.id, categoryName: cs.categoryName, cardCount: cs.cardCount,
        cardSize: cs.cardSize, sleevedCount: cs.sleevedCount, sleeveNotes: cs.sleeveNotes
    })),
    plays: plays,
    // created_at: gameRow.created_at, // Usually not directly part of the domain model sent to FE
    // updated_at: gameRow.updated_at
  };
}

export async function getAllGames(): Promise<BoardGame[]> {
  const gameRows = await knex("games").select("*").orderBy("name", "asc");
  const gamesPromises = gameRows.map(row => mapRowsToBoardGame(row));
  return Promise.all(gamesPromises);
}
export async function getGameById(id: string): Promise<BoardGame | null> {
  const gameRow = await knex("games").where({ id }).first();
  if (!gameRow) return null;
  return mapRowsToBoardGame(gameRow);
}

// --- CUD Operations for Games ---
export async function createGame(gameData: Omit<BoardGame, "id" | "created_at" | "updated_at">): Promise<BoardGame> {
  const gameId = uuidv4(); // Always generate new ID for backend consistency

  return knex.transaction(async trx => {
    const { otherLinks, cardSets, plays, ...mainGameData } = gameData;

    const gameToInsert = {
      ...mainGameData,
      id: gameId,
      userImageUrls: JSON.stringify(mainGameData.userImageUrls || []),
      bggExpansionIds: JSON.stringify(mainGameData.bggExpansionIds || []),
      designers: JSON.stringify(mainGameData.designers || []),
      publishers: JSON.stringify(mainGameData.publishers || []),
      categories: JSON.stringify(mainGameData.categories || []),
      mechanics: JSON.stringify(mainGameData.mechanics || []),
      bggSubdomains: JSON.stringify(mainGameData.bggSubdomains || []),
      bggFamilies: JSON.stringify(mainGameData.bggFamilies || []),
      bggVideoLinks: JSON.stringify(mainGameData.bggVideoLinks || []),
      bggReimplementations: JSON.stringify(mainGameData.bggReimplementations || []),
      // Knex typically handles created_at/updated_at with table.timestamps(true,true)
    };
    await trx("games").insert(gameToInsert);

    if (otherLinks && otherLinks.length > 0) {
      await trx("other_links").insert(otherLinks.map(ol => ({ ...ol, game_id: gameId, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
    }
    if (cardSets && cardSets.length > 0) {
      await trx("card_sets").insert(cardSets.map(cs => ({ ...cs, game_id: gameId, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
    }
    if (plays && plays.length > 0) {
      for (const play of plays) {
        const { playersInSession, ...playMain } = play;
        const playIdToUse = play.id || uuidv4();
        await trx("play_sessions").insert({ ...playMain, id: playIdToUse, game_id: gameId, created_at:knex.fn.now(), updated_at:knex.fn.now() });
        if (playersInSession && playersInSession.length > 0) {
          await trx("players_in_session").insert(playersInSession.map(pisp => ({ ...pisp, id: pisp.id || uuidv4(), play_session_id: playIdToUse, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
        }
      }
    }
    const newGame = await trx("games").where({ id: gameId }).first();
    return mapRowsToBoardGame(newGame);
  });
}

export async function updateGame(id: string, gameData: Partial<BoardGame>): Promise<BoardGame | null> {
  return knex.transaction(async trx => {
    const { otherLinks, cardSets, plays, ...mainGameData } = gameData;
    const gameToUpdate: Record<string, any> = { ...mainGameData };

    const arrayFieldsToStringify: (keyof BoardGame)[] = [
        "userImageUrls", "bggExpansionIds", "designers", "publishers", "categories",
        "mechanics", "bggSubdomains", "bggFamilies", "bggVideoLinks", "bggReimplementations"
    ];
    arrayFieldsToStringify.forEach(field => {
        if (mainGameData.hasOwnProperty(field)) {
            gameToUpdate[field] = JSON.stringify((mainGameData as any)[field] || []);
        }
    });
    // Ensure specific fields like id are not part of the update payload for the main table
    delete gameToUpdate.id;
    // gameToUpdate.updated_at = new Date().toISOString(); // Knex handles this with .update()

    const updatedCount = await trx("games").where({ id }).update(gameToUpdate);
    if (updatedCount === 0) return null;

    if (gameData.hasOwnProperty("otherLinks")) {
      await trx("other_links").where({ game_id: id }).delete();
      if (otherLinks && otherLinks.length > 0) {
        await trx("other_links").insert(otherLinks.map(ol => ({ ...ol, game_id: id, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
      }
    }
    if (gameData.hasOwnProperty("cardSets")) {
      await trx("card_sets").where({ game_id: id }).delete();
      if (cardSets && cardSets.length > 0) {
        await trx("card_sets").insert(cardSets.map(cs => ({ ...cs, game_id: id, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
      }
    }
    if (gameData.hasOwnProperty("plays")) {
      await trx("players_in_session").whereIn("play_session_id", function() { this.select("id").from("play_sessions").where("game_id", id); }).delete();
      await trx("play_sessions").where({ game_id: id }).delete();
      if (plays && plays.length > 0) {
        for (const play of plays) {
          const { playersInSession, ...playMain } = play;
          const playIdToUse = play.id || uuidv4();
          await trx("play_sessions").insert({ ...playMain, id: playIdToUse, game_id: id, created_at:knex.fn.now(), updated_at:knex.fn.now() });
          if (playersInSession && playersInSession.length > 0) {
            await trx("players_in_session").insert(playersInSession.map(pisp => ({ ...pisp, id: pisp.id || uuidv4(), play_session_id: playIdToUse, created_at:knex.fn.now(), updated_at:knex.fn.now() })));
          }
        }
      }
    }
    const updatedGameRow = await trx("games").where({ id }).first();
    if (!updatedGameRow) return null; // Should not happen if updatedCount > 0
    return mapRowsToBoardGame(updatedGameRow);
  });
}

export async function deleteGame(id: string): Promise<boolean> {
  const deletedCount = await knex("games").where({ id }).delete();
  return deletedCount > 0;
}

export async function addPlaySessionToGame(gameId: string, playData: Omit<PlaySession, "id">): Promise<PlaySession> {
  return knex.transaction(async trx => {
    const playId = uuidv4();
    const { playersInSession, ...mainPlayData } = playData;

    await trx("play_sessions").insert({
      ...mainPlayData, id: playId, game_id: gameId,
      created_at:knex.fn.now(), updated_at:knex.fn.now()
    });

    let createdPlayersInSession: PlayerInPlaySession[] = [];
    if (playersInSession && playersInSession.length > 0) {
      const playersToInsert = playersInSession.map(pisp => ({
        ...pisp, id: pisp.id || uuidv4(), play_session_id: playId,
        created_at:knex.fn.now(), updated_at:knex.fn.now()
      }));
      await trx("players_in_session").insert(playersToInsert);
      createdPlayersInSession = playersToInsert.map(p => ({...p, won: !!p.won})); // Ensure boolean for won
    }
    const newPlaySessionData = await trx("play_sessions").where({id:playId}).first();
    return { ...newPlaySessionData, date: newPlaySessionData.date, playersInSession: createdPlayersInSession } as PlaySession;
  });
}

export async function deletePlaySessionFromGame(gameId: string, playId: string): Promise<boolean> {
  const deletedCount = await knex("play_sessions").where({ id: playId, game_id: gameId }).delete();
  return deletedCount > 0;
}
