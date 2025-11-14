/**
 * Executes a database query using the provided SQL statement.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.sql - SQL query to be executed.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "sql": "SELECT * FROM users" }
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export default async function dbQuery(params = {}) {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    const [rows] = await conn.query(params.sql ?? "SELECT NOW() as time");
    await conn.end();
    return { rows };
}