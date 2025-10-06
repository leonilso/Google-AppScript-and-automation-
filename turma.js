function verificarFaltantes(e) {
  const id = e.triggerUid;
  Logger.log(id)
  const turmaEscolhida = PropertiesService.getScriptProperties().getProperty(`turma_${id}`);
  Logger.log(turmaEscolhida);
  if (!turmaEscolhida) return;
  // const turmaEscolhida = 'AG'

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const informacoes = ss.getSheetByName("informacoes");
  var folderLink = informacoes.getRange("C5").getValue();
  var folderId = folderLink.substring(39, folderLink.length)
  var pastaRelatorios = DriveApp.getFolderById(folderId);
  var arquivos = coletarArquivos(pastaRelatorios);

  

  var ultimoArquivo = null;
  var dataMaisRecente = 0;

  arquivos.forEach(function(arquivo) {
    if (arquivo.getName().includes(`_${turmaEscolhida}_`)) {
      if (arquivo.getDateCreated().getTime() > dataMaisRecente) {
        dataMaisRecente = arquivo.getDateCreated().getTime();
        ultimoArquivo = arquivo;
      }
    }
  });

  if (ultimoArquivo) {
    var sheetName = ultimoArquivo.getName()
    var meetId_drive = sheetName.substring(sheetName.length - 31, sheetName.length - 19)
    var arquivoSpreadsheet = SpreadsheetApp.open(ultimoArquivo);
    var relatorio = arquivoSpreadsheet.getSheetByName("Participantes");
    var presencas = relatorio.getRange("C2:C").getValues().flat();

    
    var alunos = ss.getSheetByName(turmaEscolhida).getRange("E2:E").getValues().flat();
    var nomes = ss.getSheetByName(turmaEscolhida).getRange("C2:C").getValues().flat();
    var telefones = ss.getSheetByName(turmaEscolhida).getRange("D2:D").getValues().flat(); 

    var faltantes = alunos.filter(aluno => aluno && presencas.indexOf(aluno) === -1);
    var abaFaltantes = ss.insertSheet(`${turmaEscolhida} ${pegarData(new Date())}`);
    abaFaltantes.getRange(1, 1).setValue("Faltantes");
    abaFaltantes.getRange(1, 2).setValue("Link WhatsApp");

    var faltantesComLinks = faltantes.map(function(aluno, index) {
      var telefone = `+55${telefones[alunos.indexOf(aluno)]}`;
      var abaMensagem = ss.getSheetByName("mensagens")
      var mensagem = `Olá prof. ${formatarNome(nomes[alunos.indexOf(aluno)])} ` + abaMensagem.getRange(`B${2}`).getValue()
      var whatsappLink = createWhatsAppLink(telefone, mensagem);
      return [aluno, whatsappLink];
    });

    Logger.log(faltantesComLinks)

    abaFaltantes.getRange(2, 1, faltantesComLinks.length, 2).setValues(faltantesComLinks);
  }
   startUploadProcess(turmaEscolhida);

}


function createWhatsAppLink(phoneNumber, message) {
  var url = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
  return url
}


function formatarNome(nome) {
  var nomeFormatado = nome.toLowerCase().replace(/\b\w/g, function(letra) {
    return letra.toUpperCase();
  });

  var primeiroNome = nomeFormatado.split(' ')[0];

  return primeiroNome
}

function pegarData(data){
  let dataFormatada = new Date(data)
  let dia = dataFormatada.getDate().toString().padStart(2, '0');
  let mes = (dataFormatada.getMonth() + 1).toString().padStart(2, '0');
  let ano = dataFormatada.getFullYear()
  return `${dia}/${mes}/${ano}`;
}


function coletarArquivos(pasta) {
  var arquivos = [];
  var arquivosPasta = pasta.getFiles();

  while (arquivosPasta.hasNext()) {
    arquivos.push(arquivosPasta.next());
  }

  var subpastas = pasta.getFolders();
  while (subpastas.hasNext()) {
    var subpasta = subpastas.next();
    arquivos = arquivos.concat(coletarArquivos(subpasta));
  }

  return arquivos;
}
