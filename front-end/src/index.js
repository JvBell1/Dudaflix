class App {
  constructor(root) {
    this.root = root;
    this.routes = {
      home: this.renderHome.bind(this),
      add: this.renderAddMovie.bind(this),
      list: this.renderList.bind(this),
    };
    this.movies = [];
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
      <h1>Lista de Filmes</h1>
      <button onclick="location.hash='add'">Indicar Filme </button>
      <a href="#list">Lista</a>
    `;
    this.root.appendChild(container);
  }

  renderAddMovie() {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>Adicionar Filmes</h1>
      <form id="movie-form">
        <input type="text" id="name" placeholder="Nome do Filme" required />
        <input type="text" id="genre" placeholder="Gênero" required />
        <textarea id="recommendation" placeholder="Motivo da Indicação"></textarea>
        <button type="submit">Salvar</button>
      </form>
      <button onclick="location.hash='home'">Voltar</button>
    `;
    this.root.appendChild(container);

    document.getElementById("movie-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const genre = document.getElementById("genre").value;
      const recommendation = document.getElementById("recommendation").value;
      this.movies.push({ name, genre, recommendation });
      location.hash = "list";
    });
  }

  renderList() {
    this.root.innerHTML = ""; // Limpa a tela antes de renderizar
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>Filmes Cadastrados</h1>
      <a href="#home">Voltar</a>
      <div id="movie-cards"></div>
    `;
    this.root.appendChild(container);
    this.updateList();
  }

  updateList() {
    const listContainer = document.getElementById("movie-cards");
    if (!listContainer) return;
    listContainer.innerHTML = ""; // Evita duplicação
    this.movies.forEach((movie, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <strong>${movie.name} (${movie.genre})</strong>
        <p>${movie.recommendation}</p>
        <button onclick="app.removeMovie(${index})">Remover</button>
      `;
      listContainer.appendChild(card);
    });
  }

  removeMovie(index) {
    this.movies.splice(index, 1);
    this.renderList();
  }
}

const app = new App(document.getElementById("root"));