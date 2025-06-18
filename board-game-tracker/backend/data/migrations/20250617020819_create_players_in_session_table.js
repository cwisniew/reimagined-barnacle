exports.up = function(knex) {
  return knex.schema.createTable('players_in_session', function(table) {
    table.string('id').primary();
    table.string('play_session_id').notNullable().references('id').inTable('play_sessions').onDelete('CASCADE');
    table.string('name').notNullable();
    table.integer('enjoyment');
    table.boolean('won');
    table.text('notes');
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTableIfExists('players_in_session'); };
