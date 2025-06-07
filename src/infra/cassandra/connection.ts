import { Client } from "cassandra-driver";

export class CassandraConnection {
  private client: Client;

  constructor() {
    this.client = new Client({
      contactPoints: [
        process.env.CASSANDRA_HOST?.includes(":")
          ? process.env.CASSANDRA_HOST!
          : `${process.env.CASSANDRA_HOST || "127.0.0.1"}:9042`,
      ],
      localDataCenter: process.env.CASSANDRA_DATACENTER || "datacenter1",
      keyspace: process.env.CASSANDRA_KEYSPACE,
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
      return await this.client.execute(query, params ?? [], { prepare: true });
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
