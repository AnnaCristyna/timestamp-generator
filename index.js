const fileInput = document.getElementById('fileInput');
const fileListDiv = document.getElementById('fileList');
const offsetInput = document.getElementById('offsetInput');
const output = document.getElementById('output');
const chapterNamesInput = document.getElementById('chapterNames');
const generateButton = document.getElementById('generateButton');
const downloadLink = document.getElementById('downloadLink');
const sortOptions = document.getElementById('sortOptions');
const chapterCounter = document.getElementById('chapterCounter');

let arquivosSelecionados = [];
let currentSortType = 'name';

const extensoesValidas = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac'];

// Atualizar contador de capítulos
function updateChapterCounter() {
  const lines = chapterNamesInput.value.trim().split('\n').filter(line => line.trim());
  const chapterCount = lines.length;
  const fileCount = arquivosSelecionados.length;

  if (chapterCount === 0) {
    chapterCounter.textContent = fileCount > 0 ? `(0/${fileCount})` : '';
    chapterCounter.className = 'counter empty';
  } else if (chapterCount === fileCount) {
    chapterCounter.textContent = `(${chapterCount}/${fileCount}) ✓`;
    chapterCounter.className = 'counter match';
  } else {
    chapterCounter.textContent = `(${chapterCount}/${fileCount})`;
    chapterCounter.className = 'counter mismatch';
  }
}

// Observar mudanças no textarea
chapterNamesInput.addEventListener('input', updateChapterCounter);

fileInput.addEventListener('change', (event) => {
  arquivosSelecionados = Array.from(event.target.files)
    .filter(file => {
      const nome = file.name.toLowerCase();
      return extensoesValidas.some(ext => nome.endsWith(ext));
    });

  if (arquivosSelecionados.length === 0) {
    fileListDiv.innerHTML = 'Nenhum arquivo de áudio selecionado.';
    sortOptions.style.display = 'none';
  } else {
    sortOptions.style.display = 'block';
    sortFiles('name', 'asc');
  }
  updateChapterCounter();
});

// Eventos de ordenação (delegação de eventos)
sortOptions.addEventListener('click', (e) => {
  const button = e.target.closest('.sort-btn');
  if (!button) return;

  const sortType = button.dataset.sort;

  // Se for manual, apenas ativa
  if (sortType === 'manual') {
    sortFiles(sortType, 'asc');
    return;
  }

  // Toggle da direção se clicar no mesmo botão
  let direction = button.dataset.direction || 'asc';
  if (button.classList.contains('active')) {
    direction = direction === 'asc' ? 'desc' : 'asc';
    button.dataset.direction = direction;
  } else {
    direction = 'asc';
    button.dataset.direction = 'asc';
  }

  sortFiles(sortType, direction);
});

// Função de ordenação
function sortFiles(type, direction = 'asc') {
  currentSortType = type;

  // Atualizar botões ativos
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeButton = document.querySelector(`[data-sort="${type}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
    if (type !== 'manual') {
      activeButton.dataset.direction = direction;
    }
  }

  switch(type) {
    case 'name':
      arquivosSelecionados.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        return direction === 'asc' ? comparison : -comparison;
      });
      break;
    case 'date-modified':
      arquivosSelecionados.sort((a, b) => {
        const comparison = a.lastModified - b.lastModified;
        return direction === 'asc' ? comparison : -comparison;
      });
      break;
    case 'date-created':
      // Nota: Em navegadores, não há acesso direto à data de criação do arquivo
      // Usamos lastModified como aproximação
      arquivosSelecionados.sort((a, b) => {
        const comparison = a.lastModified - b.lastModified;
        return direction === 'asc' ? comparison : -comparison;
      });
      break;
    case 'manual':
      // Mantém ordem atual, habilita drag and drop
      break;
  }

  renderFileList(type === 'manual');
}

// Renderizar lista de arquivos
function renderFileList(enableDragDrop = false) {
  if (arquivosSelecionados.length === 0) return;

  let html = `<div class="file-list-header">✓ ${arquivosSelecionados.length} arquivo(s) selecionado(s)</div>`;

  arquivosSelecionados.forEach((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeMB = sizeKB > 1024 ? (sizeKB / 1024).toFixed(2) + ' MB' : sizeKB + ' KB';
    const date = new Date(file.lastModified).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    html += `
      <div class="file-list-item" data-index="${index}" draggable="${enableDragDrop}">
        ${enableDragDrop ? '<span class="drag-handle">⋮⋮</span>' : ''}
        <div class="file-info">
          <div class="file-name">${index + 1}. ${file.name}</div>
          <div class="file-details">${sizeMB} • Modificado em ${date}</div>
        </div>
        <button class="delete-btn" data-index="${index}" title="Remover arquivo">✕</button>
      </div>
    `;
  });

  fileListDiv.innerHTML = html;

  // Adicionar eventos de exclusão
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      removeFile(index);
    });
  });

  if (enableDragDrop) {
    setupDragAndDrop();
  }
}

// Função para remover arquivo
function removeFile(index) {
  arquivosSelecionados.splice(index, 1);

  if (arquivosSelecionados.length === 0) {
    fileListDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div>Nenhum arquivo selecionado</div>';
    sortOptions.style.display = 'none';
  } else {
    renderFileList(currentSortType === 'manual');
  }

  updateChapterCounter();
}

// Configurar drag and drop
function setupDragAndDrop() {
  const items = fileListDiv.querySelectorAll('.file-list-item');
  let draggedElement = null;
  let draggedIndex = null;

  items.forEach(item => {
    item.addEventListener('dragstart', () => {
      draggedElement = item;
      draggedIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(fileListDiv, e.clientY);
      if (afterElement == null) {
        fileListDiv.appendChild(draggedElement);
      } else {
        fileListDiv.insertBefore(draggedElement, afterElement);
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropIndex = parseInt(item.dataset.index);

      if (draggedIndex !== dropIndex) {
        // Reordenar array
        const [removed] = arquivosSelecionados.splice(draggedIndex, 1);
        arquivosSelecionados.splice(dropIndex, 0, removed);
        renderFileList(true);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.file-list-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Botões auxiliares para nomes de capítulos
document.getElementById('useFileNames').addEventListener('click', () => {
  if (arquivosSelecionados.length === 0) {
    alert('Selecione arquivos de áudio primeiro.');
    return;
  }
  const names = arquivosSelecionados.map(file => file.name);
  chapterNamesInput.value = names.join('\n');
  updateChapterCounter();
});

document.getElementById('useFileNamesClean').addEventListener('click', () => {
  if (arquivosSelecionados.length === 0) {
    alert('Selecione arquivos de áudio primeiro.');
    return;
  }
  const names = arquivosSelecionados.map(file => cleanFileName(file.name));
  chapterNamesInput.value = names.join('\n');
  updateChapterCounter();
});

document.getElementById('addNumbers').addEventListener('click', () => {
  const currentText = chapterNamesInput.value.trim();
  if (!currentText) {
    alert('Adicione nomes de capítulos primeiro.');
    return;
  }
  const lines = currentText.split('\n');
  const numberedLines = lines.map((line, index) => {
    // Remove numeração existente no início (padrão: "1. ", "01 - ", etc)
    const cleanLine = line.replace(/^\d+[\.\)\-\s]+/, '').trim();
    return `${index + 1}. ${cleanLine}`;
  });
  chapterNamesInput.value = numberedLines.join('\n');
  updateChapterCounter();
});

document.getElementById('removeExtensions').addEventListener('click', () => {
  const currentText = chapterNamesInput.value.trim();
  if (!currentText) {
    alert('Adicione nomes de capítulos primeiro.');
    return;
  }
  const lines = currentText.split('\n');
  const cleanedLines = lines.map(line => line.replace(/\.[^.]+$/, ''));
  chapterNamesInput.value = cleanedLines.join('\n');
  updateChapterCounter();
});

document.getElementById('capitalizeAll').addEventListener('click', () => {
  const currentText = chapterNamesInput.value.trim();
  if (!currentText) {
    alert('Adicione nomes de capítulos primeiro.');
    return;
  }
  const lines = currentText.split('\n');
  const capitalizedLines = lines.map(line => {
    return line.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });
  chapterNamesInput.value = capitalizedLines.join('\n');
  updateChapterCounter();
});

document.getElementById('clearChapters').addEventListener('click', () => {
  if (chapterNamesInput.value.trim() && !confirm('Tem certeza que deseja limpar todos os nomes?')) {
    return;
  }
  chapterNamesInput.value = '';
  updateChapterCounter();
});

// Função para limpar nomes de arquivos
function cleanFileName(fileName) {
  // Remove a extensão
  let name = fileName.replace(/\.[^.]+$/, '');

  // Remove números no início (ex: "01 - ", "1. ", "001_")
  name = name.replace(/^\d+[\.\)\-_\s]+/, '');

  // Remove conteúdo entre parênteses e colchetes
  name = name.replace(/\([^)]*\)/g, '');  // Remove (conteúdo)
  name = name.replace(/\[[^\]]*\]/g, '');  // Remove [conteúdo]
  name = name.replace(/\{[^}]*\}/g, '');   // Remove {conteúdo}

  // Substitui underscores e hífens por espaços
  name = name.replace(/[_\-]+/g, ' ');

  // Remove múltiplos espaços
  name = name.replace(/\s+/g, ' ').trim();

  // Capitaliza primeira letra de cada palavra
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name;
}

// 👉 Correção principal aqui: adicionando evento no botão.
generateButton.addEventListener('click', gerar);

async function gerar() {
  if (arquivosSelecionados.length === 0) {
    alert('Selecione os arquivos de áudio.');
    return;
  }

  const offset = parseFloat(offsetInput.value) || 0;
  const nomesCapitulos = chapterNamesInput.value.trim().split('\n').map(n => n.trim()).filter(n => n);

  // Aviso se as quantidades não correspondem, mas permite gerar
  if (nomesCapitulos.length !== arquivosSelecionados.length && nomesCapitulos.length > 0) {
    const confirmMsg = `Aviso: Você tem ${nomesCapitulos.length} nome(s) de capítulo(s) e ${arquivosSelecionados.length} arquivo(s).\n\nDeseja continuar?`;
    if (!confirm(confirmMsg)) {
      return;
    }
  }

  let timestamps = [];
  let acumulado = offset;

  for (let i = 0; i < arquivosSelecionados.length; i++) {
    const file = arquivosSelecionados[i];
    const duracao = await obterDuracao(file);
    const timestamp = formatarTempo(acumulado);

    // Usa o nome do capítulo se existir, senão usa o nome do arquivo
    const chapterName = nomesCapitulos[i] || file.name.replace(/\.[^.]+$/, '');
    timestamps.push(`${timestamp} - ${chapterName}`);

    acumulado += duracao;
  }

  const resultado = timestamps.join('\n');
  output.value = resultado;

  gerarArquivoTxt(resultado);
}

function gerarArquivoTxt(conteudo) {
  const blob = new Blob([conteudo], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.style.display = 'inline-block';
}

function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function obterDuracao(file) {
  return new Promise((resolve, reject) => {
    const elemento = document.createElement('audio');
    elemento.preload = 'metadata';

    elemento.onloadedmetadata = function () {
      URL.revokeObjectURL(elemento.src);
      resolve(elemento.duration);
    };

    elemento.onerror = function () {
      reject("Erro ao carregar " + file.name);
    };

    elemento.src = URL.createObjectURL(file);
  });
}
