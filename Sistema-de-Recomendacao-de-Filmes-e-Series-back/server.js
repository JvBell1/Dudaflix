// server.js
const express = require('express'); //
const Datastore = require('nedb'); //
const cors = require('cors'); //

const app = express(); //
const port = 3000; //

// Inicializa o banco de dados NeDB
// O arquivo 'movies.db' será criado automaticamente na pasta do back-end
const db = new Datastore({ filename: 'movies.db', autoload: true }); //
// Documentação: 'filename' especifica o caminho para o arquivo do banco de dados, e 'autoload: true' garante que o banco de dados seja carregado automaticamente ao iniciar a aplicação.

app.use(express.json()); // Middleware para parsear JSON no corpo das requisições
// Documentação: `express.json()` é um middleware embutido do Express que parseia requisições com o cabeçalho `Content-Type: application/json`.
app.use(cors()); // Habilita o CORS para permitir requisições do front-end
// Documentação: `cors()` habilita o Cross-Origin Resource Sharing, permitindo que seu front-end (que estará em um domínio/porta diferente) faça requisições para este servidor.

// Estruturas de Dados em memória para otimização (Hash Maps)
let moviesInMemory = []; // Array para armazenar todos os filmes
let moviesByGenre = {}; // Hash Map para filmes por gênero
let moviesByRating = {}; // Hash Map para filmes por avaliação (1-5)

// Função para reconstruir os Hash Maps a partir de moviesInMemory
function rebuildHashMaps() { //
    moviesByGenre = {}; //
    moviesByRating = {}; //

    moviesInMemory.forEach(movie => { //
        // Adiciona ao Hash Map de gêneros
        if (!moviesByGenre[movie.genre]) { //
            moviesByGenre[movie.genre] = []; //
        }
        moviesByGenre[movie.genre].push(movie); //

        // Adiciona ao Hash Map de avaliações
        if (!moviesByRating[movie.rating]) { //
            moviesByRating[movie.rating] = []; //
        }
        moviesByRating[movie.rating].push(movie); //
    });
}

// Carregar filmes do banco de dados para a memória ao iniciar o servidor
db.find({}, (err, docs) => { //
    if (err) { //
        console.error('Erro ao carregar filmes do banco de dados:', err); //
        return; //
    }
    moviesInMemory = docs; //
    rebuildHashMaps(); //
    console.log('Filmes carregados do banco de dados para a memória.'); //
});

// Rota para adicionar um novo filme
app.post('/movies', (req, res) => { //
    const { name, genre, recommendation } = req.body; //

    // Validação da avaliação (recommendation)
    const rating = parseInt(recommendation, 10); //
    if (isNaN(rating) || rating < 1 || rating > 5) { //
        return res.status(400).json({ error: 'A avaliação (recommendation) deve ser um número entre 1 e 5.' }); //
    }

    const movie = { name, genre, rating }; // Cria o objeto filme com a avaliação numérica

    db.insert(movie, (err, newDoc) => { // Insere o filme no NeDB
        if (err) { //
            console.error('Erro ao inserir filme:', err); //
            return res.status(500).json({ error: 'Erro ao salvar o filme.' }); //
        }
        moviesInMemory.push(newDoc); // Adiciona à lista em memória
        rebuildHashMaps(); // Reconstrói os Hash Maps
        res.status(201).json(newDoc); // Retorna o novo filme criado
    });
});

// Rota para listar todos os filmes
app.get('/movies', (req, res) => { //
    res.json(moviesInMemory); // Retorna a lista de filmes em memória
});

// Rota para remover um filme por ID
app.delete('/movies/:id', (req, res) => { //
    const { id } = req.params; //

    db.remove({ _id: id }, {}, (err, numRemoved) => { // Remove do NeDB pelo _id
        if (err) { //
            console.error('Erro ao remover filme:', err); //
            return res.status(500).json({ error: 'Erro ao remover o filme.' }); //
        }
        if (numRemoved === 0) { //
            return res.status(404).json({ error: 'Filme não encontrado.' }); //
        }
        // Remove da lista em memória e reconstrói os Hash Maps
        moviesInMemory = moviesInMemory.filter(movie => movie._id !== id); //
        rebuildHashMaps(); //
        res.status(200).json({ message: 'Filme removido com sucesso.' }); //
    });
});

// Rota para filtrar filmes por gênero ou avaliação
app.get('/movies/filter', (req, res) => { //
    const { genre, rating } = req.query; //
    let filteredMovies = []; //

    if (genre) { //
        // Filtra por gênero usando o Hash Map
        filteredMovies = moviesByGenre[genre] || []; //
    } else if (rating) { //
        const parsedRating = parseInt(rating, 10); //
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) { //
            return res.status(400).json({ error: 'A avaliação para filtro deve ser um número entre 1 e 5.' }); //
        }
        // Filtra por avaliação usando o Hash Map
        filteredMovies = moviesByRating[parsedRating] || []; //
    } else { //
        return res.status(400).json({ error: 'Forneça um gênero ou uma avaliação para filtrar.' }); //
    }

    res.json(filteredMovies); // Retorna os filmes filtrados
});

// Inicia o servidor
app.listen(port, () => { //
    console.log(`Servidor DudaFlix rodando em http://localhost:${port}`); //
});