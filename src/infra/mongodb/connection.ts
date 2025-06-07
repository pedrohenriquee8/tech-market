import { MongoClient, Db } from "mongodb";

export class MongoDBConnection {
  private client: MongoClient;
  private db: Db | undefined;

  constructor() {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/tech_market";
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<Db> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db(process.env.MONGO_DB_NAME);
      console.log("Connected to MongoDB");
    }
    return this.db;
  }

  async close(): Promise<void> {
    await this.client.close();
    this.db = undefined;
    console.log("Disconnected from MongoDB");
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("MongoDB not connected. Call connect() first.");
    }
    return this.db;
  }
}
