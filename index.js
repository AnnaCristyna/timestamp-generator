const fileInput = document.getElementById('fileInput');
const fileListDiv = document.getElementById('fileList');
const offsetInput = document.getElementById('offsetInput');
const output = document.getElementById('output');
const chapterNamesInput = document.getElementById('chapterNames');
const generateButton = document.getElementById('generateButton');

let arquivosSelecionados = [];

const extensoesValidas = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac'];

fileInput.addEventListener('change', (event) => {
  arquivosSelecionados = Array.from(event.target.files)
    .filter(file => {
      const nome = file.name.toLowerCase();
      return extensoesValidas.some(ext => nome.endsWith(ext));
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (arquivosSelecionados.length === 0) {
    fileListDiv.innerHTML = 'Nenhum arquivo de áudio encontrado na pasta.';
  } else {
    fileListDiv.innerHTML = `<strong>${arquivosSelecionados.length}</strong> arquivos de áudio encontrados:<br>` +
      arquivosSelecionados.map(f => f.name).join('<br>');
  }
});

// 👉 Correção principal aqui: adicionando evento no botão.
generateButton.addEventListener('click', gerar);

async function gerar() {
  if (arquivosSelecionados.length === 0) {
    alert('Selecione uma pasta que contenha arquivos de áudio.');
    return;
  }

  const offset = parseFloat(offsetInput.value) || 0;
  const nomesCapitulos = chapterNamesInput.value.trim().split('\n').map(n => n.trim()).filter(n => n);

  if (nomesCapitulos.length !== arquivosSelecionados.length) {
    alert(`O número de nomes dos capítulos (${nomesCapitulos.length}) não corresponde ao número de arquivos de áudio (${arquivosSelecionados.length}).`);
    return;
  }

  let timestamps = [];
  let acumulado = offset;

  for (let i = 0; i < arquivosSelecionados.length; i++) {
    const file = arquivosSelecionados[i];
    const duracao = await obterDuracao(file);
    const timestamp = formatarTempo(acumulado);

    timestamps.push(`${timestamp} ${nomesCapitulos[i]}`);

    acumulado += duracao;
  }

  output.value = timestamps.join('\n');
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
