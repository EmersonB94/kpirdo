const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const API_BASE = isLocal
  ? "http://127.0.0.1:5000"
  : "https://kpirdo.onrender.com";


function atualizarSelectObras() {
  const obras = JSON.parse(localStorage.getItem('obras')) || [];
  const select = document.getElementById('obrasVinculadas');

  select.innerHTML = '';

  obras.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.nome;
    opt.textContent = o.nome;
    select.appendChild(opt);
  });
}


let usuarioEditando = null;


// SALVAR / EDITAR -------------------------------------------------
async function salvarUsuario() {
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const cargo = document.getElementById('cargo').value;
  const contato = document.getElementById('contato').value;
  const perfilacesso = document.getElementById('perfilacesso').value;
  const statususuario = document.getElementById('status').value;

  const obras = Array.from(document.getElementById('obrasVinculadas').selectedOptions)
    .map(o => o.value);

  if (!nome || !email || !senha) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  const dados = {
    nome,
    email,
    senha,
    cargo,
    contato,
    perfilacesso,
    status: statususuario,
    permissaoobra: obras.join(",")
  };

  let url = `${API_BASE}/usuario`;
  let metodo = "POST";

  if (usuarioEditando !== null) {
    url = `${API_BASE}/usuario/${usuarioEditando}`;
    metodo = "PUT";
  }

  const resp = await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });

  const resultado = await resp.json();

  if (resultado.status === "ok") {
    alert("Usuário salvo com sucesso!");
    fecharModal();
    listarUsuarios();
    limparFormulario();
    usuarioEditando = null;
  } else {
    alert("Erro ao salvar usuário.");
  }
}



// LISTAR -----------------------------------------------------------
async function listarUsuarios() {
  const tbody = document.querySelector('#tabelaUsuarios tbody');
  tbody.innerHTML = "";

  let usuarios;

  try {
    const resp = await fetch(`${API_BASE}/usuarios`);
    usuarios = await resp.json();
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    return;
  }

  if (!Array.isArray(usuarios)) {
    console.error("Retorno inesperado:", usuarios);
    alert("Erro ao carregar usuários.");
    return;
  }

  usuarios.forEach(u => {
    const obras = (u.permissaoobra || "")
      .toString()
      .split(",")
      .filter(x => x.trim() !== "");

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.cargo ?? "-"}</td>
      <td>${u.email}</td>
      <td>${u.senha ?? "-"}</td>
      <td>${u.status}</td>
      <td>${obras.length > 0 ? obras.join(", ") : "-"}</td>
      <td>
        <button onclick="editarUsuario(${u.id})">Editar</button>
        <button onclick="excluirUsuario(${u.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}



// EDITAR -----------------------------------------------------------
async function editarUsuario(id) {
  usuarioEditando = id;

  const u = await fetch(`${API_BASE}/usuario/${id}`).then(r => r.json());

  document.getElementById('nome').value = u.nome;
  document.getElementById('email').value = u.email;
  document.getElementById('senha').value = u.senha;
  document.getElementById('cargo').value = u.cargo;
  document.getElementById('contato').value = u.contato;
  document.getElementById('perfilacesso').value = u.perfilacesso;
  document.getElementById('status').value = u.status;

  const obras = u.permissaoobra ? u.permissaoobra.split(",") : [];

  Array.from(document.getElementById('obrasVinculadas').options).forEach(opt => {
    opt.selected = obras.includes(opt.value);
  });

  abrirModal();
}



// LIMPAR -----------------------------------------------------------
function limparFormulario() {
  document.getElementById('nome').value = '';
  document.getElementById('email').value = '';
  document.getElementById('senha').value = '';
  document.getElementById('cargo').value = '';
  document.getElementById('contato').value = '';
  document.getElementById('perfilacesso').value = 'leitor';
  document.getElementById('status').value = 'Ativo';

  Array.from(document.getElementById('obrasVinculadas').options)
    .forEach(opt => opt.selected = false);
}



// EXCLUIR ----------------------------------------------------------
async function excluirUsuario(id) {
  if (!confirm("Deseja realmente excluir este usuário?")) return;

  const resp = await fetch(`${API_BASE}/usuario/${id}`, { method: "DELETE" });
  const data = await resp.json();

  if (data.status === "ok") {
    listarUsuarios();
  } else {
    alert("Erro ao excluir usuário.");
  }
}


// LOGOUT -----------------------------------------------------------
function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}



// MODAL ------------------------------------------------------------
function abrirModal() {
  document.getElementById('modalUsuario').style.display = 'block';
}

function fecharModal() {
  document.getElementById('modalUsuario').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modalUsuario');
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

window.onload = () => {
  atualizarSelectObras();
  listarUsuarios();
};
