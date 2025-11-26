const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

const API_BASE = isLocal
  ? "http://127.0.0.1:5000"
  : "https://kpirdo.onrender.com";


let obraEditando = null;

// === SALVAR OBRA ===
async function salvarObra() {
  const nome = document.getElementById('nomeObra').value;
  const empresa = document.getElementById('localObra').value;
  const contrato = document.getElementById('NContrato').value;
  const contratoprazo = document.getElementById('dtfim').value;
  const contratoresponsavel = document.getElementById('responsavelObra').value;
  const statusobra = document.getElementById('status').value;

  if (!nome || !empresa || !statusobra) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  const dados = {
    nome,
    empresa,
    contraton: contrato,
    contratoprazo,
    contratoresponsavel,
    status: statusobra
  };

  let url = `${API_BASE}/API/obra`;
  let metodo = "POST";

  if (obraEditando != null) {
    url = `${API_BASE}/API/obra/${obraEditando}`;
    metodo = "PUT";
  }

  const resp = await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });

  const resultado = await resp.json();

  if (resultado.status === "ok") {
    alert("Obra salva com sucesso!");
    fecharModal();
    listarObras();
    limparCampos();
    obraEditando = null;
  } else {
    alert("Erro ao salvar obra.");
  }
}


// === EDITAR OBRA ===
async function editarObra(id) {
  obraEditando = id;

  const obras = await fetch(`${API_BASE}/API/obras`).then(r => r.json());
  const o = obras.find(x => x.id === id);

  document.getElementById('nomeObra').value = o.nome;
  document.getElementById('localObra').value = o.empresa;
  document.getElementById('responsavelObra').value = o.contratoresponsavel;
  document.getElementById('NContrato').value = o.contraton;
  document.getElementById('dtfim').value = o.contratoprazo;
  document.getElementById('status').value = o.status;

  abrirModal();
}


// === CANCELAR EDIÇÃO ===
function cancelarEdicao() {
  obraEditando = null;
  limparCampos();
}


// === LISTAR OBRAS ===
async function listarObras() {
  const tbody = document.querySelector('#tabelaObras tbody');
  tbody.innerHTML = "";

  const obras = await fetch(`${API_BASE}/API/obras`).then(r => r.json());

  obras.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.nome}</td>
      <td>${o.empresa}</td>
      <td>${o.contratoresponsavel ?? '-'}</td>
      <td>${o.contratoprazo ?? '-'}</td>
      <td>${o.status}</td>
      <td>
        <button onclick="editarObra(${o.id})">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


// === EXCLUIR OBRA ===
async function excluirObra(id) {
  if (!confirm("Tem certeza que deseja excluir?")) return;

  const resp = await fetch(`${API_BASE}/API/obra/${id}`, { method: "DELETE" });
  const data = await resp.json();

  if (data.status === "ok") {
    listarObras();
  } else {
    alert("Erro ao excluir.");
  }
}


// === LIMPAR FORMULÁRIO ===
function limparCampos() {
  document.getElementById('nomeObra').value = '';
  document.getElementById('localObra').value = '';
  document.getElementById('responsavelObra').value = '';
  document.getElementById('NContrato').value = '';
  document.getElementById('Contratante').value = '';
  document.getElementById('dtinicio').value = '';
  document.getElementById('dtfim').value = '';
  document.getElementById('status').value = '';
  document.getElementById('coordenacao').value = '';
  document.getElementById('fiscalizacao').value = '';
  document.getElementById('gerenteConstrucao').value = '';
}


// === CARREGAR USUÁRIOS NOS SELECTS ===
function carregarUsuariosSelect() {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const selects = ['coordenacao', 'fiscalizacao', 'gerenteConstrucao'];

  selects.forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Selecione</option>';
    usuarios.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.nome;
      opt.textContent = u.nome;
      select.appendChild(opt);
    });
  });
}


// === LOGOUT ===
function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}


// === AO INICIAR ===
window.onload = () => {
  listarObras();
  carregarUsuariosSelect();
};


// === MODAL ===
function abrirModal() {
  document.getElementById('modalObra').style.display = 'block';
  carregarUsuariosSelect();
}

function fecharModal() {
  document.getElementById('modalObra').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modalObra');
  if (event.target === modal) {
    modal.style.display = "none";
  }
};


// === EXPORTAR OBRAS ===
async function exportarObrasExcel() {
  const obras = await fetch(`${API_BASE}/API/obras`).then(r => r.json());

  if (!obras || obras.length === 0) {
    alert("Nenhuma obra cadastrada para exportar.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(obras);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Obras");

  XLSX.writeFile(wb, "obras_cadastradas.xlsx");
}


// === IMPORTAR OBRAS ===
function importarObrasExcel(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = function(e) {
    const dados = new Uint8Array(e.target.result);
    const workbook = XLSX.read(dados, { type: 'array' });

    const planilha = workbook.Sheets[workbook.SheetNames[0]];
    const obrasImportadas = XLSX.utils.sheet_to_json(planilha);

    if (obrasImportadas.length === 0) {
      alert("Nenhum dado encontrado na planilha!");
      return;
    }

    const obras = JSON.parse(localStorage.getItem('obras')) || [];

    obrasImportadas.forEach(o => {
      o.id = Date.now() + Math.random();
      obras.push(o);
    });

    localStorage.setItem('obras', JSON.stringify(obras));
    listarObras();
    alert("Importação concluída com sucesso!");
  };

  leitor.readAsArrayBuffer(arquivo);
}
