exports.up = function(knex) {
  return knex.schema.createTable('other_links', function(table) {
    table.increments('id').primary();
    table.string('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('url').notNullable();
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTableIfExists('other_links'); };
