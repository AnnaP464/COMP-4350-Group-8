import { Pool , type QueryResult, type QueryResultRow} from "pg";

const connectionString = process.env.DATABASE_URL!;
export const pool = new Pool({ connectionString });

// Small helper allow us to declare the type of rows returned
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}