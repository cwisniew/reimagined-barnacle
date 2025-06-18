module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./data/boardgames.db", // Path to the SQLite database file
    },
    useNullAsDefault: true, // Recommended for SQLite
    migrations: {
      directory: "./data/migrations", // Directory for migration files
    },
    seeds: {
      directory: "./data/seeds", // Directory for seed files (optional for now)
    }
  },

  // Example for production (if we were to use a different DB or config)
  // production: {
  //   client: "postgresql",
  //   connection: {
  //     database: "my_db",
  //     user:     "username",
  //     password: "password"
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: "knex_migrations"
  //   }
  // }
};
