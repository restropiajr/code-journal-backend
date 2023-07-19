/* eslint-disable no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import ClientError from './lib/client-error.js';
import errorMiddleware from './lib/error-middleware.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();

app.use(express.json());

app.get('/api/entries', async (req, res, next) => {
  try {
    const sql = `
          select *
          from "entries"
          order by "entryId"
    `;
    const result = await db.query(sql);
    const entries = result.rows;
    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
});

app.post('/api/entries', async (req, res, next) => {
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title) {
      throw new ClientError(400, 'title is a required field. ');
    }
    if (!notes) {
      throw new ClientError(400, 'notes is a required field. ');
    }
    if (!photoUrl) {
      throw new ClientError(400, 'photoUrl is a required field. ');
    }
    const sql = `
          insert into "entries" ("title", "notes", "photoUrl")
          values ($1, $2, $3)
          returning *;
    `;
    const params = [title, notes, photoUrl];
    const result = await db.query(sql, params);
    const [entry] = result.rows;
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

app.put('/api/entries/:entryId', async (req, res, next) => {
  try {
    const entryId = Number(req.params.entryId);
    const { title, notes, photoUrl } = req.body;
    if (!title) {
      throw new ClientError(400, 'title is a required field. ');
    }
    if (!notes) {
      throw new ClientError(400, 'notes is a required field. ');
    }
    if (!photoUrl) {
      throw new ClientError(400, 'photoUrl is a required field. ');
    }
    if (!(entryId >= 0)) {
      throw new ClientError(400, 'entryId needs to be a positive integer. ');
    }
    const sql = `
          update "entries"
          set "title" = $1, "notes" = $2, "photoUrl" = $3
          where "entryId" = $4
          returning *;
    `;
    const params = [title, notes, photoUrl, entryId];
    const result = await db.query(sql, params);
    const [entry] = result.rows;
    if (!entry) {
      throw new ClientError(404, 'entry does not exist in the database.');
    }
    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/entries/:entryId', async (req, res, next) => {
  try {
    const entryId = Number(req.params.entryId);
    if (!(entryId >= 0)) {
      throw new ClientError(400, 'entryId needs to be a positive integer. ');
    }
    const sql = `
          delete from "entries"
          where "entryId" = $1
          returning *;
    `;
    const params = [entryId];
    const result = await db.query(sql, params);
    const [entry] = result.rows;
    if (!entry) {
      throw new ClientError(404, 'entry does not exist in the database.');
    }
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
