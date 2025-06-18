const knexConfig = require("../knexfile.js");
const knex = require("knex")(knexConfig.development);
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // Import uuid for playerInSession ID generation if needed

const JSON_FILE_PATH = path.join(__dirname, "..", "data", "boardgames.json");

async function migrateData() {
  console.log("Starting data migration from JSON to SQLite...");

  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.log("JSON data file not found. No data to migrate.");
    return knex.destroy();
  }

  const jsonData = fs.readFileSync(JSON_FILE_PATH, "utf-8");
  if (!jsonData) {
    console.log("JSON data file is empty. No data to migrate.");
    return knex.destroy();
  }

  const gamesFromFile = JSON.parse(jsonData);
  if (!Array.isArray(gamesFromFile) || gamesFromFile.length === 0) {
    console.log("No games found in JSON data or data is not an array. Migration skipped.");
    return knex.destroy();
  }

  console.log(`Found ${gamesFromFile.length} games in JSON file.`);

  try {
    for (const game of gamesFromFile) {
      await knex.transaction(async (trx) => {
        console.log(`Migrating game: ${game.name} (ID: ${game.id})`);

        // Migrate old manualUrl to onlineManualUrl if present and onlineManualUrl is not
        if (game.manualUrl && game.onlineManualUrl === undefined) {
          game.onlineManualUrl = game.manualUrl;
        }
        // Ensure old manualUrl is not part of the insert object
        const { manualUrl, ...gameWithoutOldManualUrl } = game;

        const gameToInsert = {
          ...gameWithoutOldManualUrl, // Spread all fields from game after potential manualUrl migration
          id: game.id, // Ensure ID is explicitly set
          name: game.name, // Ensure name is explicitly set
          isExpansion: game.isExpansion || false,
          // Ensure array fields are stringified JSON or default to empty array string
          userImageUrls: JSON.stringify(game.userImageUrls || []),
          bggExpansionIds: JSON.stringify(game.bggExpansionIds || []),
          designers: JSON.stringify(game.designers || []),
          publishers: JSON.stringify(game.publishers || []),
          categories: JSON.stringify(game.categories || []),
          mechanics: JSON.stringify(game.mechanics || []),
          bggSubdomains: JSON.stringify(game.bggSubdomains || []),
          bggFamilies: JSON.stringify(game.bggFamilies || []),
          bggVideoLinks: JSON.stringify(game.bggVideoLinks || []),
          bggReimplementations: JSON.stringify(game.bggReimplementations || []),
          // Related table data will be handled separately
          // Remove otherLinks, cardSets, plays from gameToInsert as they go to separate tables
          otherLinks: undefined,
          cardSets: undefined,
          plays: undefined,
          created_at: game.created_at || new Date().toISOString(),
          updated_at: game.updated_at || new Date().toISOString()
        };

        // Remove any top-level keys that are not actual columns in the 'games' table
        // (e.g. if original JSON had fields not in the new schema, or related table data temporarily on game object)
        delete gameToInsert.otherLinks;
        delete gameToInsert.cardSets;
        delete gameToInsert.plays;


        // Clean gameToInsert: remove undefined keys to rely on DB defaults/nullability
        for (const key in gameToInsert) {
          if (gameToInsert[key] === undefined) {
            delete gameToInsert[key];
          }
        }

        await trx("games").insert(gameToInsert).onConflict('id').ignore(); // Ignore if game ID already exists
        console.log(`  Upserted game: ${game.name}`);

        if (game.otherLinks && game.otherLinks.length > 0) {
          const linksToInsert = game.otherLinks.map(link => ({
            game_id: game.id, title: link.title, url: link.url,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          }));
          if (linksToInsert.length > 0) {
            await trx("other_links").insert(linksToInsert).onConflict(['game_id', 'url']).ignore(); // Example conflict handling
            console.log(`    Inserted/ignored ${linksToInsert.length} other links.`);
          }
        }

        if (game.cardSets && game.cardSets.length > 0) {
          const cardSetsToInsert = game.cardSets.map(cs => ({
            id: cs.id || uuidv4(), game_id: game.id, categoryName: cs.categoryName, cardCount: cs.cardCount,
            cardSize: cs.cardSize, sleevedCount: cs.sleevedCount, sleeveNotes: cs.sleeveNotes,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          }));
           if (cardSetsToInsert.length > 0) {
            await trx("card_sets").insert(cardSetsToInsert).onConflict('id').ignore();
            console.log(`    Inserted/ignored ${cardSetsToInsert.length} card sets.`);
          }
        }

        if (game.plays && game.plays.length > 0) {
          for (const play of game.plays) {
            // Migrate old playerNames to playersInSession if necessary
            let playersInSessionForDb = play.playersInSession || [];
            if ((play as any).playerNames && Array.isArray((play as any).playerNames) && playersInSessionForDb.length === 0) {
                playersInSessionForDb = ((play as any).playerNames as string[]).map(name => ({
                id: uuidv4(), name: name,
              }));
            }

            const playToInsert = {
              id: play.id || uuidv4(), game_id: game.id, date: play.date, notes: play.notes,
              created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            };
            await trx("play_sessions").insert(playToInsert).onConflict('id').ignore();
            console.log(`    Inserted/ignored play session (ID: ${playToInsert.id})`);

            if (playersInSessionForDb.length > 0) {
              const playersToInsert = playersInSessionForDb.map(player => ({
                id: player.id || uuidv4(), play_session_id: playToInsert.id, name: player.name,
                enjoyment: player.enjoyment, won: player.won, notes: player.notes,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString()
              }));
              if (playersToInsert.length > 0) {
                await trx("players_in_session").insert(playersToInsert).onConflict('id').ignore();
                console.log(`      Inserted/ignored ${playersToInsert.length} players for session ${playToInsert.id}.`);
              }
            }
          }
        }
      });
    }
    console.log("Data migration completed successfully!");
  } catch (error) {
    console.error("Error during data migration:", error);
  } finally {
    await knex.destroy();
    console.log("Database connection closed.");
  }
}
migrateData();
