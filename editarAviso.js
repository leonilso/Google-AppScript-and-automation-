function editarAviso(turma) {
  // turma ="i"
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const informacoes = ss.getSheetByName("informacoes");
  const quantidadeTurma = informacoes.getRange('C4').getValue();
  let idTurmas = informacoes.getRange(2, 10, quantidadeTurma).getValues();

  for(const idTurma in idTurmas){
    if(informacoes.getRange(parseInt(idTurma) + 2, 5).getValue() == turma){
      idAviso = informacoes.getRange(parseInt(idTurma) + 2, 11).getValue();
      linkYoutube = informacoes.getRange(parseInt(idTurma) + 2, 12).getValue();
      idCurso = informacoes.getRange(parseInt(idTurma) + 2, 10).getValue();
      atualizarLinkGravacao(idCurso, idAviso, linkYoutube)
      // listarAvisos(idCurso);
    }
  }
}

function atualizarLinkGravacao(courseId, announcementId, novoLink) {
  const avisoAtual = Classroom.Courses.Announcements.get(courseId, announcementId);
  let texto = avisoAtual.text;
  texto = texto.replace(/@.*/g, novoLink);

  Classroom.Courses.Announcements.patch(
    { text: texto },
    courseId,
    announcementId,
    { updateMask: 'text' }
  );

  Logger.log("Aviso atualizado com novo link da gravação.");
}

function listarAvisos(courseId) {
  const avisos = Classroom.Courses.Announcements.list(courseId).announcements;

  if (avisos && avisos.length > 0) {
    avisos.forEach(aviso => {
      Logger.log(`ID: ${aviso.id}`);
      Logger.log(`Texto: ${aviso.text}`);
      Logger.log('---');
    });
  } else {
    Logger.log('Nenhum aviso encontrado.');
  }
}
