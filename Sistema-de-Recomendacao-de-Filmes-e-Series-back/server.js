
const express = require('express'); 
const Datastore = require('nedb'); 
const cors = require('cors'); 

const app = express(); 
const port = 3000; 


const db = new Datastore({ filename: 'movies.db', autoload: true }); //


app.use(express.json()); 
app.use(cors());


let moviesInMemory = []; 
let moviesByGenre = {}; 
let moviesByRating = {}; 

function rebuildHashMaps() { 
    moviesByGenre = {}; 
    moviesByRating = {}; 

    moviesInMemory.forEach(movie => { 
        
        if (!moviesByGenre[movie.genre]) { 
            moviesByGenre[movie.genre] = []; 
        }
        moviesByGenre[movie.genre].push(movie); 

        
        if (!moviesByRating[movie.rating]) { 
            moviesByRating[movie.rating] = []; 
        }
        moviesByRating[movie.rating].push(movie); 
    });
}


db.find({}, (err, docs) => { 
    if (err) { 
        console.error('Erro ao carregar filmes do banco de dados:', err); 
        return; 
    }
    moviesInMemory = docs; 
    rebuildHashMaps(); 
    console.log('Filmes carregados do banco de dados para a memória.'); 
});


app.post('/movies', (req, res) => { 
    const { name, genre, recommendation } = req.body; 


    const rating = parseInt(recommendation, 10); 
    if (isNaN(rating) || rating < 1 || rating > 5) { 
        return res.status(400).json({ error: 'A avaliação (recommendation) deve ser um número entre 1 e 5.' }); 
    }

    const movie = { name, genre, rating }; 

    db.insert(movie, (err, newDoc) => { 
        if (err) { 
            console.error('Erro ao inserir filme:', err); 
            return res.status(500).json({ error: 'Erro ao salvar o filme.' }); 
        }
        moviesInMemory.push(newDoc); 
        rebuildHashMaps(); 
        res.status(201).json(newDoc); 
    });
});


app.get('/movies', (req, res) => { 
    res.json(moviesInMemory); 
});


app.delete('/movies/:id', (req, res) => { 
    const { id } = req.params; 

    db.remove({ _id: id }, {}, (err, numRemoved) => { 
        if (err) { 
            console.error('Erro ao remover filme:', err); 
            return res.status(500).json({ error: 'Erro ao remover o filme.' }); 
        }
        if (numRemoved === 0) { 
            return res.status(404).json({ error: 'Filme não encontrado.' }); 
        }

        moviesInMemory = moviesInMemory.filter(movie => movie._id !== id); 
        rebuildHashMaps(); 
        res.status(200).json({ message: 'Filme removido com sucesso.' }); 
    });
});


app.get('/movies/filter', (req, res) => { 
    const { genre, rating } = req.query; 
    let filteredMovies = []; 

    if (genre) { 

        filteredMovies = moviesByGenre[genre] || []; 
    } else if (rating) { 
        const parsedRating = parseInt(rating, 10); 
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) { 
            return res.status(400).json({ error: 'A avaliação para filtro deve ser um número entre 1 e 5.' }); 
        }

        filteredMovies = moviesByRating[parsedRating] || []; 
    } else { 
        return res.status(400).json({ error: 'Forneça um gênero ou uma avaliação para filtrar.' }); 
    }

    res.json(filteredMovies); 
});


app.listen(port, () => { 
    console.log(`Servidor DudaFlix rodando em http://localhost:${port}`); 
});
