import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

/**
 * IO layer for dbQuery tool.
 * Handles DB connections and queries.
 */
export const dbQueryIO = {
    async query(sql) {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const [rows] = await conn.query(sql);
        await conn.end();
        return rows;
    }
};
