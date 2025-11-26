function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}

window.onload = async () => {

  // 1️⃣ Buscar obras do banco
  const obras = await fetch("http://localhost:5000/obras")
    .then(r => r.json())
    .catch(e => []);

  // 2️⃣ Buscar RDOs do banco
  const rdos = await fetch("http://localhost:5000/rdos")
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
    const totalRDO = rdos.filter(r => r.obra_id === o.id).length;

    let statusColor = '#ccc';
    switch (o.statusobra) {
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
      <p><b>Responsável:</b> ${o.responsavel || '-'}</p>
      <p><b>Local:</b> ${o.local || '-'}</p>
      <p><b>Contratante:</b> ${o.contratante || '-'}</p>
      <p><b>Status:</b> <span style="color:${statusColor}; font-weight:bold;">${o.statusobra || '-'}</span></p>
    `;
    cardsContainer.appendChild(card);
  });

};

