// Ajuste a base API conforme seu ambiente
const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const API_BASE = isLocal ? "http://127.0.0.1:5000" : "https://kpirdo.onrender.com";



let rdoEditando = null;
let rdosOriginais = [];

// Função auxiliar para formatar datas
// Função auxiliar para formatar datas (segura contra problema de fuso)
function formatarData(dataISO) {
  if (!dataISO) return "";

  // Se vier com tempo "2025-01-01T00:00:00..." só pegamos a parte da data
  const apenasData = (typeof dataISO === "string" && dataISO.includes("T"))
    ? dataISO.split("T")[0]
    : dataISO;

  // Se for no formato YYYY-MM-DD, parsear manualmente (evita interpretação UTC)
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const m = String(apenasData).match(isoRegex);

  let dataObj;
  if (m) {
    const ano = parseInt(m[1], 10);
    const mes = parseInt(m[2], 10) - 1; // mês 0-index
    const dia = parseInt(m[3], 10);
    dataObj = new Date(ano, mes, dia); // cria no horário local
  } else {
    // fallback para outros formatos (tenta criar Date e usa UTC parts)
    const tmp = new Date(dataISO);
    if (isNaN(tmp)) return String(dataISO); // se for inválido, retorna raw
    // usar componentes UTC evita deslocamento indesejado se já tiver time
    const dia = tmp.getUTCDate();
    const mes = tmp.getUTCMonth() + 1;
    const ano = tmp.getUTCFullYear();
    return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${ano}`;
  }

  const dia = String(dataObj.getDate()).padStart(2, '0');
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
  const ano = dataObj.getFullYear();
  return `${dia}/${mes}/${ano}`;
}



async function carregarRDOs() {
  try {
    const resposta = await fetch(`${API_BASE}/API/rdo`);
    const dados = await resposta.json();

    rdosOriginais = dados; // guarda os dados originais
    renderizarTabela(dados);

  } catch (err) {
    console.error("Erro ao carregar RDOs:", err);
  }
}

function renderizarTabela(lista) {
  const tabela = document.querySelector("#tabelaRDO tbody");
  tabela.innerHTML = "";

  lista.forEach(rdo => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${rdo.data ? formatarData(rdo.data) : ""}</td>
      <td>${rdo.obra || ""}</td>
      <td>${rdo.atividades || ""}</td>
      <td>${rdo.status_atividade || ""}</td>
      <td>${rdo.status || ""}</td>
      <td>${rdo.usuario || ""}</td>
      <td>
        <button onclick="editarRDO(${rdo.id})">Editar</button>
        <button onclick='gerarPDFRDO(${JSON.stringify(rdo)})'>PDF</button>
      </td>

    `;

    tabela.appendChild(tr);
  });
}

function aplicarFiltros() {
  const obra = document.getElementById("filtroObra").value.toLowerCase();
  const cliente = document.getElementById("filtroCliente").value.toLowerCase();
  const responsavel = document.getElementById("filtroResponsavel").value.toLowerCase();
  const data = document.getElementById("filtroData").value;
  const statusAtividade = document.getElementById("filtroStatusAtividade").value;
  const status = document.getElementById("filtroStatus").value;

  const filtrados = rdosOriginais.filter(rdo => {
    return (
      (!obra || (rdo.obra || "").toLowerCase().includes(obra)) &&
      (!cliente || (rdo.cliente || "").toLowerCase().includes(cliente)) &&
      (!responsavel || (rdo.responsavel || "").toLowerCase().includes(responsavel)) &&
      (!data || (rdo.data || "").includes(data)) &&
      (!statusAtividade || rdo.status_atividade === statusAtividade) &&
      (!status || rdo.status === status)
    );
  });

  renderizarTabela(filtrados);
}

function limparFiltros() {
  document.getElementById("filtroObra").value = "";
  document.getElementById("filtroCliente").value = "";
  document.getElementById("filtroResponsavel").value = "";
  document.getElementById("filtroData").value = "";
  document.getElementById("filtroStatusAtividade").value = "";
  document.getElementById("filtroStatus").value = "";

  renderizarTabela(rdosOriginais);
}


// Busca dados da obra por ID e preenche campos
async function carregarDadosObra() {
  const select = document.getElementById('obra');
  const obraId = select.value;
  if (!obraId) {
    document.getElementById('cliente').value = "";
    document.getElementById('responsavel').value = "";
    document.getElementById('ncontrato').value = "";
    document.getElementById('localobra').value = "";
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
    document.getElementById('ncontrato').value = obra.ncontrato;
    document.getElementById('localobra').value = obra.endereco;

  } catch (err) {
    console.error("Erro carregar dados da obra:", err);
  }
}

async function salvarRDO() {

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogadoRDO"));

  if (!usuarioLogado) {
    alert("Usuário não autenticado. Faça login novamente.");
    return;
  }

  const dados = {
    data: document.getElementById('data').value,
    obra: document.getElementById('obra').value,
    cliente: document.getElementById('cliente').value,
    responsavel: document.getElementById('responsavel').value,
    ncontrato: document.getElementById('ncontrato').value,
    localobra: document.getElementById('localobra').value,
    atividades: document.getElementById('atividades').value,
    observacoes: document.getElementById('observacoes').value,
    status: document.getElementById('status').value,

    mo_ajudante: document.getElementById('mo_ajudante').value,
    mo_laminador: document.getElementById('mo_laminador').value,
    mo_soldadortemoplastico: document.getElementById('mo_soldadortemoplastico').value,
    mo_encarregado: document.getElementById('mo_encarregado').value,
    mo_supervisor: document.getElementById('mo_supervisor').value,
    mo_inspetorqualidade: document.getElementById('mo_inspetorqualidade').value,
    mo_montador: document.getElementById('mo_montador').value,
    mo_engenheiro: document.getElementById('mo_engenheiro').value,
    mo_ajudantet: document.getElementById('mo_ajudantet').value,
    mo_montadort: document.getElementById('mo_montadort').value,

    ocorrencia: document.getElementById('ocorrencia').value,
    comentario: document.getElementById('comentario').value,
    status_atividade: document.getElementById('status_atividade').value,
    usuario: usuarioLogado.nome
  };

  if (!dados.data || !dados.obra || !dados.atividades) {
    alert("Preencha Data, Obra e Atividades.");
    return;
  }

  const url = rdoEditando ? `${API_BASE}/API/rdo/${rdoEditando}` : `${API_BASE}/API/rdo`;

  try {
    const res = await fetch(url, {
      method: rdoEditando ? "PUT" : "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(dados)
    });

    if (!res.ok) throw new Error("Erro ao salvar");

    rdoEditando = null;
    carregarRDOs();
    limparCampos();
    fecharModal();

  } catch (err) {
    console.error("Erro salvar RDO:", err);
    alert("Erro ao salvar RDO.");
  }
}

async function editarRDO(id) {
  try {
    const r = await fetch(`${API_BASE}/API/rdo/${id}`).then(res => res.json());
    rdoEditando = id;

    document.getElementById('obra').value = r.obra || "";
    document.getElementById('cliente').value = r.cliente || "";
    document.getElementById('responsavel').value = r.responsavel || "";
    document.getElementById('ncontrato').value = r.ncontrato || "";
    document.getElementById('localobra').value = r.localobra || "";
    document.getElementById('data').value = (r.data || "").split("T")[0];
    document.getElementById('atividades').value = r.atividades || "";
    document.getElementById('observacoes').value = r.observacoes || "";
    document.getElementById('status').value = r.status || "";

    document.getElementById('mo_ajudante').value = r.mo_ajudante || "";
    document.getElementById('mo_laminador').value = r.mo_laminador || "";
    document.getElementById('mo_soldadortemoplastico').value = r.mo_soldadortemoplastico || "";
    document.getElementById('mo_encarregado').value = r.mo_encarregado || "";
    document.getElementById('mo_supervisor').value = r.mo_supervisor || "";
    document.getElementById('mo_inspetorqualidade').value = r.mo_inspetorqualidade || "";
    document.getElementById('mo_montador').value = r.mo_montador || "";
    document.getElementById('mo_engenheiro').value = r.mo_engenheiro || "";
    document.getElementById('mo_ajudantet').value = r.mo_ajudantet || "";
    document.getElementById('mo_montadort').value = r.mo_montadort || "";

    document.getElementById('ocorrencia').value = r.ocorrencia || "";
    document.getElementById('comentario').value = r.comentario || "";
    document.getElementById('status_atividade').value = r.status_atividade || "";

    document.getElementById('salvarBtn').textContent = 'Atualizar Registro';
    abrirModal();

  } catch (err) {
    console.error("Erro editar RDO:", err);
    alert("Erro ao carregar RDO.");
  }
}



function cancelarEdicao() {
  rdoEditando = null;
  limparCampos();
  document.getElementById('salvarBtn').textContent = 'Salvar Registro';
}

function limparCampos() {
  const campos = [
    'obra','cliente','responsavel','ncontrato','localobra','data',
    'atividades','observacoes','status',
    'mo_ajudante','mo_laminador','mo_soldadortemoplastico','mo_encarregado',
    'mo_supervisor','mo_inspetorqualidade','mo_montador','mo_engenheiro',
    'mo_ajudantet','mo_montadort',
    'ocorrencia','comentario','status_atividade'
  ];

  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById('status').value = "Aprovado";
  document.getElementById('salvarBtn').textContent = 'Salvar Registro';
}


async function verDetalhesRDO(id) {
  try {
    const r = await fetch(`${API_BASE}/API/rdo/${id}`).then(res => {
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
    const res = await fetch(`${API_BASE}/API/rdo/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Falha ao excluir");
    carregarRDOs();
  } catch (err) {
    console.error("Erro excluir RDO:", err);
    alert("Erro ao excluir RDO.");
  }
}

function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = '/';
}

window.onload = async () => {
  try { await carregarRDOs(); } catch(e){ console.error(e); }

  const obraSel = document.getElementById('obra');
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
    const rdos = await fetch(`${API_BASE}/API/rdo`).then(r => {
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
      "Nº Contrato": r.ncontrato || r.ncontrato || "",
      "Local da Obra": r.localobra || r.localobra || "",
      "Atividades": r.atividades || "",
      "Observações": r.observacoes || "",
      "Status": r.status || ""
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
          ncontrato: map['nº contrato'] || map['ncontrato'] || "",
          localobra: map['local da obra'] || map['localobra'] || "",
          atividades: map['atividades'] || "",
          observacoes: map['observações'] || map['observacoes'] || "",
          status: map['status'] || "Aprovado"
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
          await fetch(`${API_BASE}/API/rdo`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(dados)
          });
        } catch (err) {
          console.error("Erro ao enviar RDO importado:", err);
        }
      }

      alert("Importação concluída (tentou salvar todos os registros).");
      carregarRDOs();
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
            ncontrato: row['Nº Contrato'] || row['ncontrato'] || "",
            localobra: row['Local da Obra'] || row['localobra'] || "",
            atividades: row['Atividades'] || row['atividades'] || "",
            observacoes: row['Observações'] || row['observacoes'] || "",
            status: row['Status'] || "Aprovado"
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
            await fetch(`${API_BASE}/API/rdo`, {
              method: "POST",
              headers: {"Content-Type":"application/json"},
              body: JSON.stringify(dados)
            });
          } catch (err) {
            console.error("Erro salvar importado (Excel):", err);
          }
        }
        alert("Importação do Excel concluída (registros enviados ao servidor).");
        carregarRDOs();
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

async function gerarPDFRDO(rdo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let y = 20;

  // ✅ LOGO
  const logo = new Image();
  logo.src = "/static/imagem/logo.png";

  logo.onload = function () {
    doc.addImage(logo, "PNG", 15, 10, 30, 15);

    // ✅ TÍTULO
    doc.setFontSize(16);
    doc.text("RELATÓRIO DIÁRIO DE OBRA (RDO)", 105, 18, { align: "center" });

    y = 35;
    doc.setFontSize(11);

    function linha(titulo, valor) {
      doc.text(`${titulo}: ${valor || ""}`, 20, y);
      y += 7;
    }

    // ✅ DADOS PRINCIPAIS
    linha("Data", formatarData(rdo.data));
    linha("Obra", rdo.obra);
    linha("Cliente", rdo.cliente);
    linha("Responsável", rdo.responsavel);
    linha("Contrato", rdo.ncontrato);
    linha("Local da Obra", rdo.localobra);

    y += 6;

    // ✅ TÍTULO MÃO DE OBRA
    doc.setFontSize(13);
    doc.text("MÃO DE OBRA", 20, y);
    y += 6;

    doc.setFontSize(11);

    // ✅ DADOS DA TABELA
    const maoDeObra = [
      ["Ajudante", rdo.mo_ajudante],
      ["Laminador", rdo.mo_laminador],
      ["Soldador Termoplástico", rdo.mo_soldadortemoplastico],
      ["Encarregado", rdo.mo_encarregado],
      ["Supervisor", rdo.mo_supervisor],
      ["Inspetor de Qualidade", rdo.mo_inspetorqualidade],
      ["Montador", rdo.mo_montador],
      ["Engenheiro", rdo.mo_engenheiro],
      ["Ajudante Terceirizado", rdo.mo_ajudantet],
      ["Montador Terceirizado", rdo.mo_montadort]
    ];

    const col1 = 20;
    const col2 = 140;
    const rowHeight = 7;

    // ✅ CABEÇALHO DA TABELA
    doc.rect(col1, y, 120, rowHeight);
    doc.rect(col2, y, 30, rowHeight);
    doc.text("Função:", col1 + 2, y + 5);
    doc.text("Qnt:", col2 + 10, y + 5);

    y += rowHeight;

    // ✅ LINHAS DA TABELA
    maoDeObra.forEach(item => {
      doc.rect(col1, y, 120, rowHeight);
      doc.rect(col2, y, 30, rowHeight);
      doc.text(String(item[0]), col1 + 2, y + 5);
      doc.text(String(item[1] || "0"), col2 + 12, y + 5);
      y += rowHeight;
    });

    y += 6;

    // ✅ ATIVIDADES
    doc.setFontSize(13);
    doc.text("ATIVIDADES EXECUTADAS:", 20, y);
    y += 8;

    doc.setFontSize(11);
    const atividades = doc.splitTextToSize(rdo.atividades || "", 170);
    doc.text(atividades, 20, y);
    y += atividades.length * 6;

    y += 4;
    linha("Status da Atividade:", rdo.status_atividade);

    // ✅ OBSERVAÇÕES
    y += 4;
    doc.setFontSize(13);
    doc.text("OBSERVAÇÕES:", 20, y);
    y += 8;

    doc.setFontSize(11);
    const obs = doc.splitTextToSize(rdo.observacoes || "", 170);
    doc.text(obs, 20, y);
    y += obs.length * 6;

    // ✅ OCORRÊNCIA
    y += 4;
    doc.setFontSize(13);
    doc.text("OCORRÊNCIA:", 20, y);
    y += 8;

    doc.setFontSize(11);
    const ocorrencia = doc.splitTextToSize(rdo.ocorrencia || "", 170);
    doc.text(ocorrencia, 20, y);
    y += ocorrencia.length * 6;

    // ✅ COMENTÁRIO
    y += 4;
    doc.setFontSize(13);
    doc.text("COMENTÁRIO:", 20, y);
    y += 8;

    doc.setFontSize(11);
    const comentario = doc.splitTextToSize(rdo.comentario || "", 170);
    doc.text(comentario, 20, y);
    y += comentario.length * 6;

    y += 5;
    linha("STATUS RDO", rdo.status);

    // ========================
    // ASSINATURAS LADO A LADO
    // ========================
    y += 15;

    const linhaY = y;
    const linhaW = 70;   // largura da linha de assinatura
    const espaco = 20;   // espaço entre as duas linhas

    // Linha Responsável
    doc.line(20, linhaY, 20 + linhaW, linhaY);

    // Linha Fiscal
    doc.line(20 + linhaW + espaco, linhaY, 20 + linhaW + espaco + linhaW, linhaY);

    // Texto abaixo das linhas
    doc.setFontSize(11);
    doc.text("Responsável", 20 + linhaW / 2, linhaY + 6, { align: "center" });
    doc.text("Fiscal", 20 + linhaW + espaco + linhaW / 2, linhaY + 6, { align: "center" });

    // Atualiza Y para continuar
    y = linhaY + 15;

    // ✅ RODAPÉ
    doc.setFontSize(9);
    doc.text("Documento gerado automaticamente pelo sistema kpirdo", 105, 290, { align: "center" });

    // ✅ NOME DO ARQUIVO
    const nomeArquivo = `RDO_${(rdo.obra || "obra").replace(/\s+/g, "_")}_${(rdo.data || "").split("T")[0]}.pdf`;
    doc.save(nomeArquivo);
  };
}



document.addEventListener("DOMContentLoaded", carregarRDOs);
