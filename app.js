const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

// GET list of All Movies Names API
app.get("/movies/", async (request, response) => {
  const getMovieNamesQuery = `SELECT * FROM movie;`;
  const movieNamesArray = await db.all(getMovieNamesQuery);
  const movieNames = (eachMovie) => {
    return {
      movieName: eachMovie.movie_name,
    };
  };
  response.send(movieNamesArray.map((eachMovie) => movieNames(eachMovie)));
});

// POST movie API
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const createMovieQuery = `
        INSERT INTO movie (director_id, movie_name, lead_actor)
        VALUES (
            ${directorId},
            '${movieName}',
            '${leadActor}'
        );`;
  await db.run(createMovieQuery);
  response.send("Movie Successfully Added");
});

function convertDbObjectToResponseObject(eachMovie) {
  return {
    movieId: eachMovie.movie_id,
    directorId: eachMovie.director_id,
    movieName: eachMovie.movie_name,
    leadActor: eachMovie.lead_actor,
  };
}

// GET movie based on movie_id API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId}`;
  const movieArray = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movieArray));
});

// UPDATE movie API
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const updateMovieDetails = request.body;
  const { directorId, movieName, leadActor } = updateMovieDetails;
  const updateMovieQuery = `UPDATE movie 
      SET director_id = ${directorId},
      movie_name = '${movieName}',
      lead_actor = '${leadActor}'
      WHERE movie_id = ${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

// DELETE movie API
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId}`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

// GET directors API
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director;`;
  const convertCamelCaseObject = (eachDirector) => {
    return {
      directorId: eachDirector.director_id,
      directorName: eachDirector.director_name,
    };
  };
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) => convertCamelCaseObject(eachDirector))
  );
});

// GET given director_id in movie API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovieQuery = `SELECT * FROM movie WHERE director_id = ${directorId}`;
  const directorIdCorrespondingMovieNames = (eachMovie) => {
    return {
      movieName: eachMovie.movie_name,
    };
  };
  const movies = await db.all(getDirectorMovieQuery);
  response.send(
    movies.map((eachMovie) => directorIdCorrespondingMovieNames(eachMovie))
  );
});

module.exports = app;
