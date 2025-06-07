import { Client } from "cassandra-driver";

export class CassandraConnection {
  private client: Client;

  constructor() {
    this.client = new Client({
      contactPoints: [process.env.CASSANDRA_HOST || "localhost"],
      localDataCenter: process.env.CASSANDRA_DATACENTER || "datacenter1",
    });
  }

  async connect() {
    await this.client.connect();
  }

  async close() {
    await this.client.shutdown();
  }

  async execute(query: string, params?: any[]) {
    try {
      return await this.client.execute(query, params ? params : [], {
        prepare: true,
      });
    } catch (error) {
      console.error(
        "Erro ao executar query:",
        query,
        "com params:",
        params,
        error
      );
      throw error;
    }
  }
}
