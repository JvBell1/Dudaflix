
class App {
  constructor(root) {
    this.root = root;
    this.routes = {
      home: this.renderHome.bind(this),
      add: this.renderAddMovie.bind(this),
      list: this.renderList.bind(this),
      filter: this.renderFilterMovies.bind(this), 
    };
    
    this.API_URL = 'http://localhost:3000/movies'; 
    this.init();
  }

  init() {
    this.render();
    window.addEventListener("hashchange", () => this.render());
  }

  render() {
    const route = window.location.hash.replace("#", "") || "home";
    this.root.innerHTML = "";
    (this.routes[route] || this.renderNotFound).call(this);
  }

  renderHome() {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>DudaFlix</h1>
      <button onclick="location.hash='add'">Indicar Filme </button>
      <a href="#list">Meus Filmes</a>
      <a href="#filter">Filtrar Filmes</a> `;
    this.root.appendChild(container);
  }

  renderAddMovie() {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>Adicionar Filme</h1>
      <form id="movie-form">
        <input type="text" id="name" placeholder="Nome do Filme" required />
        <input type="text" id="genre" placeholder="Gênero" required />
        <input type="number" id="recommendation" placeholder="Avaliação (1-5)" min="1" max="5" required /> <button type="submit">Salvar</button>
      </form>
      <button onclick="location.hash='home'">Voltar</button>
    `;
    this.root.appendChild(container);

    document.getElementById("movie-form").addEventListener("submit", async (e) => { 
      e.preventDefault();
      const name = document.getElementById("name").value;
      const genre = document.getElementById("genre").value;
      const recommendation = document.getElementById("recommendation").value; 

      try {
        const response = await fetch(this.API_URL, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, genre, recommendation }), 
        });

        if (!response.ok) {
          throw new Error('Erro ao adicionar filme');
        }

        const newMovie = await response.json();
        console.log('Filme adicionado:', newMovie);
        location.hash = "list"; 
      } catch (error) {
        console.error("Erro ao adicionar filme:", error);
        alert("Erro ao adicionar filme. Verifique o console para mais detalhes.");
      }
    });
  }

  async renderList() { 
    this.root.innerHTML = "";
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>Meus Filmes</h1>
      <a href="#home">Voltar</a>
      <div id="movie-cards"></div>
    `;
    this.root.appendChild(container);
    await this.updateList(); 
  }

  async updateList() { 
    const listContainer = document.getElementById("movie-cards");
    if (!listContainer) return;

    listContainer.innerHTML = "Carregando filmes..."; 

    try {
      const response = await fetch(this.API_URL); 
      if (!response.ok) {
        throw new Error('Erro ao carregar filmes');
      }
      const movies = await response.json(); 

      listContainer.innerHTML = ""; 
      if (movies.length === 0) {
        listContainer.innerHTML = "<p>Nenhum filme cadastrado ainda.</p>";
      } else {
        movies.forEach((movie) => {
          const card = document.createElement("div");
          card.className = "card";
          
          card.innerHTML = `
            <strong>${movie.name} (${movie.genre})</strong>
            <p>Avaliação: ${movie.rating}/5</p>
            <button onclick="app.removeMovie('${movie._id}')">Remover</button> `;
          listContainer.appendChild(card);
        });
      }
    } catch (error) {
      console.error("Erro ao carregar filmes:", error);
      listContainer.innerHTML = "<p>Erro ao carregar filmes.</p>";
    }
  }

  async removeMovie(id) { 
    if (!confirm('Tem certeza que deseja remover este filme?')) {
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/${id}`, { 
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover filme');
      }

      console.log('Filme removido com sucesso!');
      await this.updateList(); 
    } catch (error) {
      console.error("Erro ao remover filme:", error);
      alert("Erro ao remover filme. Verifique o console para mais detalhes.");
    }
  }

  renderFilterMovies() {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>Filtrar Filmes</h1>
      <form id="filter-form">
        <label for="filter-type">Filtrar por:</label>
        <select id="filter-type">
          <option value="">Selecione</option>
          <option value="genre">Gênero</option>
          <option value="rating">Avaliação</option>
        </select>

        <div id="genre-filter-field" style="display: none;">
          <input type="text" id="filter-genre-value" placeholder="Digite o Gênero" />
        </div>

        <div id="rating-filter-field" style="display: none;">
          <input type="number" id="filter-rating-value" placeholder="Digite a Avaliação (1-5)" min="1" max="5" />
        </div>

        <button type="submit">Filtrar</button>
      </form>
      <a href="#home">Voltar</a>
      <div id="filtered-movie-cards" class="movie-cards-container"></div>
    `;
    this.root.appendChild(container);

    const filterTypeSelect = document.getElementById("filter-type");
    const genreFilterField = document.getElementById("genre-filter-field");
    const ratingFilterField = document.getElementById("rating-filter-field");
    const filterForm = document.getElementById("filter-form");
    const filteredMovieCards = document.getElementById("filtered-movie-cards");

    filterTypeSelect.addEventListener("change", () => {
      genreFilterField.style.display = "none";
      ratingFilterField.style.display = "none";
      filteredMovieCards.innerHTML = ""; 

      if (filterTypeSelect.value === "genre") {
        genreFilterField.style.display = "block";
      } else if (filterTypeSelect.value === "rating") {
        ratingFilterField.style.display = "block";
      }
    });

    filterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const filterType = filterTypeSelect.value;
      let filterValue = '';

      if (filterType === "genre") {
        filterValue = document.getElementById("filter-genre-value").value;
        if (!filterValue) {
          alert("Por favor, digite um gênero.");
          return;
        }
      } else if (filterType === "rating") {
        filterValue = document.getElementById("filter-rating-value").value;
        const parsedRating = parseInt(filterValue, 10);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
          alert("Por favor, digite uma avaliação válida entre 1 e 5.");
          return;
        }
      } else {
        alert("Por favor, selecione um tipo de filtro.");
        return;
      }

      filteredMovieCards.innerHTML = "Filtrando filmes...";

      try {
        const response = await fetch(`${this.API_URL}/filter?${filterType}=${encodeURIComponent(filterValue)}`);
        if (!response.ok) {
          throw new Error('Erro ao filtrar filmes');
        }
        const filteredMovies = await response.json();

        filteredMovieCards.innerHTML = "";
        if (filteredMovies.length === 0) {
          filteredMovieCards.innerHTML = "<p>Nenhum filme encontrado com este critério.</p>";
        } else {
          filteredMovies.forEach(movie => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <strong>${movie.name} (${movie.genre})</strong>
              <p>Avaliação: ${movie.rating}/5</p>
            `;
            filteredMovieCards.appendChild(card);
          });
        }
      } catch (error) {
        console.error("Erro ao filtrar filmes:", error);
        filteredMovieCards.innerHTML = "<p>Erro ao filtrar filmes.</p>";
      }
    });
  }


  renderNotFound() {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>Página Não Encontrada</h1>
      <p>A rota que você tentou acessar não existe.</p>
      <a href="#home">Voltar para a Home</a>
    `;
    this.root.appendChild(container);
  }
}

const app = new App(document.getElementById("root"));
