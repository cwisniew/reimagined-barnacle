exports.up = function(knex) {
  return knex.schema.createTable('play_sessions', function(table) {
    table.string('id').primary();
    table.string('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.datetime('date').notNullable();
    table.text('notes');
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTableIfExists('play_sessions'); };
