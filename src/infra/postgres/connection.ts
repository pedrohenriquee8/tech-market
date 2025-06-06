import { Pool } from "pg";

export class PostgresConnection {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    });
  }

  async connect() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }
}
