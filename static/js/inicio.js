// Ajuste a base API conforme seu ambiente
const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const API_BASE = isLocal ? "http://127.0.0.1:5000" : "https://kpirdo.onrender.com";

function logout() {
  localStorage.removeItem('usuarioLogadoRDO');
  window.location.href = '/';
}

// Função para formatar datas
function formatarData(dataISO) {
  if (!dataISO) return "";
  const d = new Date(dataISO);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

window.onload = async () => {
  // 1️⃣ Buscar obras do banco
  const obras = await fetch(`${API_BASE}/api_index/obras`)
    .then(r => r.json())
    .catch(e => []);

  // 2️⃣ Buscar RDOs do banco
  const rdos = await fetch(`${API_BASE}/api_index/rdos`)
    .then(r => r.json())
    .catch(e => []);

  const resumoDiv = document.getElementById('resumo');
  resumoDiv.innerHTML = `
    <p><b>Obras:</b> ${obras.length}</p>
    <p><b>Registros RDO:</b> ${rdos.length}</p>
    <h2>Resumo das Obras</h2>
    <div id="cardsObras" class="cards-container"></div>
  `;

  const cardsContainer = document.getElementById('cardsObras');
  cardsContainer.innerHTML = '';

  obras.forEach(o => {
    const totalRDO = rdos.filter(r => r.obra === o.nome).length;

    let statusColor = '#ccc';
    switch (o.status) {
      case 'Não iniciada': statusColor = '#f0ad4e'; break;
      case 'Em andamento': statusColor = '#5bc0de'; break;
      case 'Paralisada': statusColor = '#d9534f'; break;
      case 'Concluída': statusColor = '#5cb85c'; break;
      case 'Cancelada': statusColor = '#777'; break;
    }

    const card = document.createElement('div');
    card.classList.add('card');
    card.style.borderLeft = `6px solid ${statusColor}`;
    card.innerHTML = `
      <h3>${o.nome}</h3>
      <p>Relatórios: ${totalRDO}</p>
      <p><b>Responsável:</b> ${o.contratoresponsavel || '-'}</p>
      <p><b>Local:</b> ${o.id || '-'}</p>
      <p><b>Contratante:</b> ${o.empresa || '-'}</p>
      <p><b>Status:</b> <span style="color:${statusColor}; font-weight:bold;">${o.status || '-'}</span></p>
    `;
    cardsContainer.appendChild(card);
  });
};