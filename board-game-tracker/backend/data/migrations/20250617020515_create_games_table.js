exports.up = function(knex) {
  return knex.schema.createTable('games', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('version');
    table.integer('bggId').unique().nullable();
    table.string('status');
    table.float('bggRating');
    table.float('bggComplexity');
    table.integer('yearPublished');
    table.integer('minPlayers');
    table.integer('maxPlayers');
    table.integer('playingTime');
    table.string('thumbnailUrl');
    table.string('imageUrl');
    table.boolean('isExpansion').defaultTo(false).notNullable();
    table.string('baseGameAppId').nullable();
    table.integer('bggBaseGameId').nullable();
    table.string('officialWebsiteUrl');
    table.string('crowdfundingPlatform');
    table.string('crowdfundingUrl');
    table.string('crowdfundingStatus');
    table.string('onlineManualUrl');
    table.string('localManualUrl');

    table.text('userImageUrls').defaultTo('[]');
    table.text('bggExpansionIds').defaultTo('[]');
    table.text('designers').defaultTo('[]');
    table.text('publishers').defaultTo('[]');
    table.text('categories').defaultTo('[]');
    table.text('mechanics').defaultTo('[]');
    table.text('bggSubdomains').defaultTo('[]');
    table.text('bggFamilies').defaultTo('[]');
    table.text('bggVideoLinks').defaultTo('[]');
    table.text('bggReimplementations').defaultTo('[]');
    table.text('otherLinks').defaultTo('[]');
    table.text('cardSets').defaultTo('[]');
    table.text('plays').defaultTo('[]');

    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('games');
};
