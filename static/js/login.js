// Ajuste a base API conforme seu ambiente
const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const API_BASE = isLocal ? "http://127.0.0.1:5000" : "https://kpirdo.onrender.com";

function login() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "ok") {
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      window.location.href = "inicio";
    } else {
      alert("Usuário ou senha incorretos");
    }
  })
  .catch(err => console.log("ERRO:", err));
}


function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}

// Funções do modal
function abrirModal() {
  document.getElementById('modalUsuario').style.display = 'block';
}

function fecharModal() {
  document.getElementById('modalUsuario').style.display = 'none';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
  const modal = document.getElementById('modalUsuario');
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function salvarUsuario() {
  const payload = {
    nome: document.getElementById('nome').value,
    cargo: document.getElementById('cargo_Cadastro').value,
    email: document.getElementById('email_Cadastro').value,
    contato: document.getElementById('contato_Cadastro').value,
    senha: document.getElementById('senha_Cadastro').value,
    status: document.getElementById('status').value
  };

  fetch(`${API_BASE}/usuario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "ok") {
      alert("Usuário cadastrado com sucesso!");
      fecharModal();
    }
  });
}

