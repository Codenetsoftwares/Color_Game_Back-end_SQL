import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function executeQuery(sql, values = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        console.log("Query results:", results);
        if (results instanceof Array) {
          if (results.length > 0) {
            resolve(results);
          } else {
            reject(new Error("Query result is an empty array"));
          }
        } else {
          resolve(results);
        }
      }
    });
  });
}

export const UserController = {
  eligibilityCheck: async (userId, eligibilityCheck) => {
    try {
      const userQuery = "SELECT * FROM user WHERE id = ?";
      const user = await executeQuery(userQuery, [userId]);

      if (user.length === 0) {
        throw { code: 404, message: "User not found" };
      }

      const updateQuery = "UPDATE user SET eligibilityCheck = ? WHERE id = ?";
      const updatedRows = await executeQuery(updateQuery, [
        eligibilityCheck ? 1 : 0,
        userId,
      ]);

      if (updatedRows.affectedRows > 0) {
        return {
          message: eligibilityCheck ? "User Eligible" : "User Not Eligible",
        };
      } else {
        throw { code: 500, message: "Failed to update user eligibility" };
      }
    } catch (err) {
      throw { code: err.code || 500, message: err.message };
    }
  },
};
