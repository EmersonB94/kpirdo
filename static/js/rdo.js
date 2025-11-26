// Ajuste a base API conforme seu ambiente
const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const API_BASE = isLocal ? "http://127.0.0.1:5000" : "https://kpirdo.onrender.com";

let rdoEditando = null;

async function listarRDOs() {
  const tbody = document.querySelector('#tabelaRDO tbody');
  tbody.innerHTML = '';

  try {
    const rdos = await fetch(`${API_BASE}/rdo`).then(r => {
      if (!r.ok) throw new Error("Falha ao buscar RDOs");
      return r.json();
    });

    rdos.forEach(rdo => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${rdo.data || '-'}</td>
        <td>${rdo.obra || '-'}</td>
        <td>${rdo.atividades || '-'}</td>
        <td>${rdo.observacoes || '-'}</td>
        <td>${rdo.status || '-'}</td>
        <td>
          <button onclick="editarRDO(${rdo.id})">Editar</button>
          <button onclick="verDetalhesRDO(${rdo.id})">Ver Detalhes</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro listar RDOs:", err);
    tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar RDOs</td></tr>`;
  }
}

// Busca dados da obra por ID e preenche campos
async function carregarDadosObra() {
  const select = document.getElementById('obraSelect');
  const obraId = select.value;
  if (!obraId) {
    document.getElementById('cliente').value = "";
    document.getElementById('responsavel').value = "";
    document.getElementById('NContrato').value = "";
    document.getElementById('localObra').value = "";
    return;
  }

  try {
    const obra = await fetch(`${API_BASE}/obras/${obraId}`).then(r => {
      if (!r.ok) throw new Error("Obra não encontrada");
      return r.json();
    });

    // Ajuste nomes de propriedades conforme seu backend
    document.getElementById('cliente').value = obra.nome;
    document.getElementById('responsavel').value = obra.responsavel;
    document.getElementById('NContrato').value = obra.contraton;
    document.getElementById('localObra').value = obra.endereco;

  } catch (err) {
    console.error("Erro carregar dados da obra:", err);
  }
}

async function salvarRDO() {
  const dados = {
    data: document.getElementById('datardo').value,
    obra: (document.getElementById('obraSelect').value),
    cliente: document.getElementById('cliente').value,
    responsavel: document.getElementById('responsavel').value,
    NContrato: document.getElementById('NContrato').value,
    localObra: document.getElementById('localObra').value,
    atividades: document.getElementById('atividades').value,
    observacoes: document.getElementById('observacoes').value,
    status: document.getElementById('status').value,
  };

  try {
    if (rdoEditando) {
      await fetch(`${API_BASE}/rdo/${rdoEditando}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(dados)
      }).then(res => {
        if (!res.ok) throw new Error("Falha ao atualizar RDO");
        return res.json();
      });
    } else {
      await fetch(`${API_BASE}/rdo`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(dados)
      }).then(res => {
        if (!res.ok) throw new Error("Falha ao salvar RDO");
        return res.json();
      });
    }

    listarRDOs();
    limparCampos();
    fecharModal();
  } catch (err) {
    console.error("Erro salvar RDO:", err);
    alert("Erro ao salvar RDO. Veja console.");
  }
}



async function editarRDO(id) {
  try {
    const r = await fetch(`${API_BASE}/rdo/${id}`).then(res => {
      if (!res.ok) throw new Error("RDO não encontrado");
      return res.json();
    });

    rdoEditando = id;

    // r.obra pode ser id => definimos o select para esse id
    document.getElementById('obraSelect').value = r.obra || r.obra_id || "";
    // depois que definir o select, carregar dados da obra para preencher campos readonly
    await carregarDadosObra();

    document.getElementById('datardo').value = (r.data && r.data.split && r.data.split('T')[0]) || r.data || "";
    document.getElementById('atividades').value = r.atividades || "";
    document.getElementById('observacoes').value = r.observacoes || "";
    document.getElementById('status').value = r.status || 'Aprovado';

    document.getElementById('salvarBtn').textContent = 'Atualizar Registro';
    document.getElementById('cancelarEdicaoBtn').style.display = 'inline';

    abrirModal();
  } catch (err) {
    console.error("Erro editar RDO:", err);
    alert("Não foi possível carregar o RDO para edição.");
  }
}

function cancelarEdicao() {
  rdoEditando = null;
  limparCampos();
  document.getElementById('salvarBtn').textContent = 'Salvar Registro';
  document.getElementById('cancelarEdicaoBtn').style.display = 'none';
}

function limparCampos() {
  document.getElementById('atividades').value = '';
  document.getElementById('observacoes').value = '';
  document.getElementById('datardo').value = '';
  document.getElementById('anexo').value = '';
  document.getElementById('status').value = 'Aprovado';
  document.getElementById('obraSelect').value = '';
  carregarDadosObra();
}

async function verDetalhesRDO(id) {
  try {
    const r = await fetch(`${API_BASE}/rdo/${id}`).then(res => {
      if (!res.ok) throw new Error("RDO não encontrado");
      return res.json();
    });

    localStorage.setItem("rdoParaImpressao", JSON.stringify(r));
    window.open('rdo_impressao.html', '_blank');
  } catch (err) {
    console.error("Erro verDetalhesRDO:", err);
    alert("Erro ao abrir detalhes do RDO.");
  }
}

async function excluirRDO(id) {
  if (!confirm("Confirma exclusão deste RDO?")) return;

  try {
    const res = await fetch(`${API_BASE}/rdo/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Falha ao excluir");
    listarRDOs();
  } catch (err) {
    console.error("Erro excluir RDO:", err);
    alert("Erro ao excluir RDO.");
  }
}

function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}

window.onload = async () => {
  try { await atualizarSelectObrasRDO(); } catch(e){ console.error(e); }
  try { await listarRDOs(); } catch(e){ console.error(e); }

  const obraSel = document.getElementById('obraSelect');
  if (obraSel) obraSel.addEventListener('change', carregarDadosObra);
};


// Modal controls
function abrirModal() {
  document.getElementById('modalRDO').style.display = 'block';
  document.getElementById('tituloModal').textContent = rdoEditando ? 'Editar registro diário' : 'Novo registro diário';
}

function fecharModal() {
  document.getElementById('modalRDO').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modalRDO');
  if (event.target == modal) {
    fecharModal();
  }
};

// Exporta RDOs buscados na API para Excel
async function exportarRDO() {
  try {
    const rdos = await fetch(`${API_BASE}/rdo`).then(r => {
      if (!r.ok) throw new Error("Falha ao buscar RDOs para exportação");
      return r.json();
    });

    if (!rdos || rdos.length === 0) {
      alert("Não há registros de RDO para exportar.");
      return;
    }

    const dados = rdos.map(r => ({
      "Data": (r.data && r.data.split && r.data.split('T')[0]) || r.data || "",
      "Obra": r.nome || r.obra || "",
      "Cliente": r.cliente || "",
      "Responsável": r.responsavel || "",
      "Nº Contrato": r.contraton || r.contraton || "",
      "Local da Obra": r.local_obra || r.localObra || "",
      "Atividades": r.atividades || "",
      "Observações": r.observacoes || "",
      "Status": r.status || "",
      "Anexos": (r.anexos || []).join(", ")
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RDOs");
    XLSX.writeFile(wb, "RDOs_Exportados.xlsx");
  } catch (err) {
    console.error("Erro exportarRDO:", err);
    alert("Falha ao exportar RDOs.");
  }
}

// Importa CSV/Excel e envia para API (cada linha vira um POST)
function importarRDO(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    let text = e.target.result;

    // Suporta CSV simples (ponto-e-vírgula ou vírgula) ou arquivo Excel via XLSX lib
    // Se for CSV:
    if (arquivo.name.endsWith('.csv') || arquivo.type === 'text/csv') {
      const linhas = text.split(/\r?\n/).filter(l => l.trim());
      const cabec = linhas.shift().split(/;|,/).map(h => h.trim());

      for (const linha of linhas) {
        const cols = linha.split(/;|,/).map(c => c.replace(/(^"|"$)/g, "").trim());
        if (cols.length < 2) continue;

        // Mapear colunas por nomes mais comuns
        const map = {};
        cabec.forEach((h, i) => map[h.toLowerCase()] = cols[i] || "");

        const dados = {
          data: map['data'] || map['dia'] || cols[0],
          obra: null,
          cliente: map['cliente'] || "",
          responsavel: map['responsavel'] || "",
          NContrato: map['nº contrato'] || map['contraton'] || "",
          localObra: map['local da obra'] || map['localobra'] || "",
          atividades: map['atividades'] || "",
          observacoes: map['observações'] || map['observacoes'] || "",
          status: map['status'] || "Aprovado",
          anexo: (map['anexos'] || "").split(',').map(a => a.trim()).filter(Boolean)
        };

        // Se no CSV a coluna 'obra' vier como nome, tentamos achar o id na lista de obras localmente
        if (map['obra']) {
          try {
            // busca obras e tenta achar correspondência pelo nome
            const obras = await fetch(`${API_BASE}/obras`).then(r => r.json());
            const found = obras.find(o => (o.nome || '').toLowerCase() === map['obra'].toLowerCase());
            if (found) dados.obra = found.id;
          } catch (err) { /* ignora */ }
        }

        // Faz POST para o servidor
        try {
          await fetch(`${API_BASE}/rdo`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(dados)
          });
        } catch (err) {
          console.error("Erro ao enviar RDO importado:", err);
        }
      }

      alert("Importação concluída (tentou salvar todos os registros).");
      listarRDOs();
    } else {
      // Tenta processar como Excel usando XLSX
      try {
        const wb = XLSX.read(e.target.result, {type:'binary'});
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const json = XLSX.utils.sheet_to_json(ws, {defval:""});
        for (const row of json) {
          const dados = {
            data: row['Data'] || row['data'] || "",
            obra: null,
            cliente: row['Cliente'] || row['cliente'] || "",
            responsavel: row['Responsável'] || row['Responsavel'] || "",
            NContrato: row['Nº Contrato'] || row['NContrato'] || "",
            localObra: row['Local da Obra'] || row['localObra'] || "",
            atividades: row['Atividades'] || row['atividades'] || "",
            observacoes: row['Observações'] || row['observacoes'] || "",
            status: row['Status'] || "Aprovado",
            anexo: (row['Anexos'] || "").toString().split(',').map(a => a.trim()).filter(Boolean)
          };

          // tentar mapear obra pelo nome (se vier)
          if (row['Obra']) {
            try {
              const obras = await fetch(`${API_BASE}/obras`).then(r => r.json());
              const found = obras.find(o => (o.nome || '').toLowerCase() === row['Obra'].toLowerCase());
              if (found) dados.obra = found.id;
            } catch (err) {}
          }

          try {
            await fetch(`${API_BASE}/rdo`, {
              method: "POST",
              headers: {"Content-Type":"application/json"},
              body: JSON.stringify(dados)
            });
          } catch (err) {
            console.error("Erro salvar importado (Excel):", err);
          }
        }
        alert("Importação do Excel concluída (registros enviados ao servidor).");
        listarRDOs();
      } catch (err) {
        console.error("Erro importar arquivo:", err);
        alert("Erro ao processar o arquivo. Verifique o formato.");
      }
    }

    event.target.value = '';
  };

  // Se for binário (XLSX) precisamos ler como binary string
  if (arquivo.name.endsWith('.xlsx') || arquivo.name.endsWith('.xls')) {
    reader.readAsBinaryString(arquivo);
  } else {
    reader.readAsText(arquivo, "UTF-8");
  }
}

listarRDOs()