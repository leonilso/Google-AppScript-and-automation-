const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB


function startUploadProcess(turmaEscolhida) {
  const folder = DriveApp.getFoldersByName("Meet Recordings").next();
  const files = coletarArquivos(folder);
  let lastFile = null;
  let dataMaisRecente = 0;
  files.forEach(function(file) {
    if (file.getName().includes(`_${turmaEscolhida}_`)) {
      if (file.getMimeType().startsWith("video/")) {
        if (file.getDateCreated().getTime() > dataMaisRecente) {
          dataMaisRecente = file.getDateCreated().getTime();
          lastFile = file;
        }
      }
    }
  });
  if (!lastFile) throw new Error("Nenhum arquivo encontrado");

  const fileId = lastFile.getId();
  const fileSize = lastFile.getSize();

  // // Monta metadados para upload
  // const hoje = new Date();
  // const dia = hoje.getDate();
  // const mes = hoje.getMonth() + 1;
  // const ano = hoje.getFullYear();
  // var char_mes;
  // if(mes < 10){
  //   char_mes = `0${mes}`
  // } else {
  //   char_mes = mes
  // }
  const originalName = lastFile.getName();
  let base = originalName.replace(/ - .*/, "");
  base = base.replace(/__/, "_");
  const matchDate = originalName.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  let finalName = base;
  if (matchDate) {
    const ano = matchDate[1];
    const mes = matchDate[2];
    const dia = matchDate[3];
    finalName += `${dia}-${mes}-${ano}`;
  }

  const resource = {
    snippet: {
      title: finalName,
      description: "",
      tags: ["meet", "gravação"],
      categoryId: "22",
    },
    status: {
      privacyStatus: "unlisted",
      selfDeclaredMadeForKids: false,
    },
  };

  // 1. Iniciar upload resumível para YouTube e pegar upload URL (Location)
  const headers = { Authorization: "Bearer " + ScriptApp.getOAuthToken() };
  const url1 = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
  const res1 = UrlFetchApp.fetch(url1, {
    headers,
    method: "post",
    payload: JSON.stringify(resource),
    contentType: "application/json",
    muteHttpExceptions: true,
  });
  if (res1.getResponseCode() != 200) {
    Logger.log("Erro ao iniciar upload: " + res1.getContentText());
    return;
  }
  const location = res1.getAllHeaders()["Location"];

  // Salvar estado no PropertiesService para continuar upload depois
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    fileId,
    fileSize: fileSize.toString(),
    chunkIndex: "0",
    location,
    turma: turmaEscolhida,
  });

  Logger.log(scriptProperties.getProperty("location"))

  // Criar trigger para continuar upload daqui a 1 min
  ScriptApp.newTrigger("uploadChunks").timeBased().after(60 * 1000).create();

  Logger.log("Upload iniciado e trigger criado.");
}

function uploadChunks() {
  deleteTriggers();
  ScriptApp.newTrigger("uploadChunks").timeBased().after(90 * 1000).create();

  const scriptProperties = PropertiesService.getScriptProperties();
  let fileId = scriptProperties.getProperty("fileId");
  let fileSize = parseInt(scriptProperties.getProperty("fileSize"), 10);
  let chunkIndex = parseInt(scriptProperties.getProperty("chunkIndex"), 10);
  let location = scriptProperties.getProperty("location");
  let turma = scriptProperties.getProperty("turma");
  if (!fileId || !location) {
    Logger.log("Nenhum upload pendente encontrado.");
    return;
  }

  const startByte = chunkIndex * CHUNK_SIZE;
  const endByte = Math.min(fileSize - 1, (chunkIndex + 1) * CHUNK_SIZE - 1);
  const chunkSize = endByte - startByte + 1;

  // Pegar o chunk do Drive
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const headers = {
    Authorization: "Bearer " + ScriptApp.getOAuthToken(),
    Range: `bytes=${startByte}-${endByte}`,
  };
  const chunkContent = UrlFetchApp.fetch(url, { headers }).getContent();

  // Fazer upload do chunk para o YouTube
  const uploadHeaders = {
    // "Content-Length": chunkSize,
    "Content-Range": `bytes ${startByte}-${endByte}/${fileSize}`,
  };
  const res = UrlFetchApp.fetch(location, {
    method: "put",
    headers: uploadHeaders,
    payload: chunkContent,
    muteHttpExceptions: true,
  });

  const statusCode = res.getResponseCode();
  Logger.log(`Chunk ${chunkIndex} enviado, status: ${statusCode}`);

  if (statusCode === 200 || statusCode === 201) {
    Logger.log("Upload finalizado!");
    const responseData = JSON.parse(res.getContentText());
    const videoId = responseData.id;
    const videoUrl = `https://youtu.be/${videoId}`;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const informacoes = ss.getSheetByName("informacoes");
    const quantidadeTurma = informacoes.getRange('C4').getValue();
    let idTurmas = informacoes.getRange(2, 10, quantidadeTurma).getValues();

    for(const idTurma in idTurmas){
      if(informacoes.getRange(parseInt(idTurma) + 2, 5).getValue() == turma){
        informacoes.getRange(parseInt(idTurma) + 2, 12).setValue(videoUrl);
        editarAviso(turma);
      }
    }
    Logger.log("Link do vídeo: " + videoUrl);
    const playlistId = informacoes.getRange('C7').getValue().toString().match(/(?:\?|&)list=([a-zA-Z0-9_-]+)/)[1];

    const payload = {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId: videoId,
        }
      }
  };

  UrlFetchApp.fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken(),
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  // Limpar propriedades e triggers
  scriptProperties.deleteAllProperties();
  deleteTriggers();
  } else if (statusCode === 308) {
    // Continua upload
    chunkIndex++;
    scriptProperties.setProperty("chunkIndex", chunkIndex.toString());
    // deleteTriggers()

    // Criar trigger para continuar daqui a 1 min
    
  } else {
    Logger.log("Erro no upload: " + res.getContentText());
    // Opcional: deletar propriedades e triggers para reiniciar depois
    scriptProperties.deleteAllProperties();
    deleteTriggers();
  }
}

function deleteTriggers() {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === "uploadChunks") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}
