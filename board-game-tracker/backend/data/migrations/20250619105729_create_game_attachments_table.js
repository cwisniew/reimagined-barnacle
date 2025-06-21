exports.up = function(knex) {
  return knex.schema.createTable('game_attachments', function(table) {
    table.string('id').primary(); // Client-generated UUID
    table.string('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('fileUrl').notNullable(); // Path/URL to the stored file
    table.string('originalName').notNullable();
    table.string('fileType'); // MIME type
    table.datetime('uploadedAt').notNullable(); // When this record was created / associated
    table.text('notes');
    table.timestamps(true, true); // created_at and updated_at for this record
  });
};
exports.down = function(knex) { return knex.schema.dropTableIfExists('game_attachments'); };
