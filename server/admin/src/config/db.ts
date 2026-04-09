import { MongoClient, Db} from "mongodb";

let client: MongoClient | null = null;
const dbCache = new Map<string, Db>();

export const connectDb = async (dbName: string): Promise<Db> => {
    const cachedDb = dbCache.get(dbName);
    if (cachedDb) {
        return cachedDb;
    }

    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI!);
        await client.connect();
        console.log("Admin connected to MongoDB");
    }

    const db = client.db(dbName);
    dbCache.set(dbName, db);
    return db;
};