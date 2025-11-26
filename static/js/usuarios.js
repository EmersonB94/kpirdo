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

let usuarioEditando = null; // controla se está editando

function salvarUsuario() {
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const cargo = document.getElementById('cargo').value;
  const contato = document.getElementById('contato').value;
  const perfilacesso = document.getElementById('perfilacesso').value;
  const statususuario = document.getElementById('status').value;
  const assinatura = document.getElementById('assinatura').value;
  const obras = Array.from(document.getElementById('obrasVinculadas').selectedOptions).map(o => o.value);

  if (!nome || !email || !senha || !statususuario) {
    alert('Preencha todos os campos!');
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

  if (usuarioEditando !== null) {
    // atualiza usuário existente
    usuarios[usuarioEditando] = {
      ...usuarios[usuarioEditando],
      nome, email, senha, obras, cargo, contato, perfilacesso, statususuario, assinatura
    };
    usuarioEditando = null;
  } else {
    // novo cadastro
    usuarios.push({ id: Date.now(), nome, email, senha, obras, cargo, contato, perfilacesso, statususuario, assinatura });
  }

  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  listarUsuarios();
  limparFormulario();
}

function listarUsuarios() {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const tbody = document.querySelector('#tabelaUsuarios tbody');
  tbody.innerHTML = '';

  usuarios.forEach((u, i) => {
    const obrasTexto = u.obras && u.obras.length > 0 ? u.obras.join(', ') : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.cargo}</td>
      <td>${u.email}</td>
      <td>${u.senha}</td>
      <td>${u.statususuario}</td>
      <td>${obrasTexto}</td>
      <td>
        <button onclick="editarUsuario(${i})">Editar</button>
        <button onclick="excluirUsuario(${i})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editarUsuario(index) {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const u = usuarios[index];
  usuarioEditando = index;

  document.getElementById('nome').value = u.nome;
  document.getElementById('email').value = u.email;
  document.getElementById('senha').value = u.senha;
  document.getElementById('cargo').value = u.cargo || '';
  document.getElementById('contato').value = u.contato || '';
  document.getElementById('perfilacesso').value = u.perfilacesso || '';
  document.getElementById('status').value = u.statususuario || '';

  // marca as obras vinculadas
  const select = document.getElementById('obrasVinculadas');
  Array.from(select.options).forEach(opt => {
    opt.selected = u.obras && u.obras.includes(opt.value);
  });
  
  // Abre o modal ao editar
  abrirModal();
}

function limparFormulario() {
  document.getElementById('nome').value = '';
  document.getElementById('email').value = '';
  document.getElementById('senha').value = '';
  document.getElementById('cargo').value = '';
  document.getElementById('contato').value = '';
  document.getElementById('perfilacesso').value = '';
  document.getElementById('status').value = '';
  document.getElementById('assinatura').value = '';
  Array.from(document.getElementById('obrasVinculadas').options).forEach(opt => (opt.selected = false));
}

function excluirUsuario(index) {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  usuarios.splice(index, 1);
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  listarUsuarios();
}

function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}

window.onload = () => {
  atualizarSelectObras();
  listarUsuarios();
};

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
