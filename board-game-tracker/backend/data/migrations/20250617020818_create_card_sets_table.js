exports.up = function(knex) {
  return knex.schema.createTable('card_sets', function(table) {
    table.string('id').primary();
    table.string('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.string('categoryName').notNullable();
    table.integer('cardCount').notNullable();
    table.string('cardSize');
    table.integer('sleevedCount');
    table.text('sleeveNotes');
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTableIfExists('card_sets'); };
