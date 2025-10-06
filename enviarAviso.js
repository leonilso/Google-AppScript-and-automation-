function enviarAviso() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const informacoes = ss.getSheetByName("informacoes");
  const datas = ss.getSheetByName("datas");
  const slides = ss.getSheetByName("slides");
  const quantidadeTurma = informacoes.getRange('C4').getValue();
  let linksTurmas = informacoes.getRange(2, 9, quantidadeTurma).getValues();
  let idTurmas = informacoes.getRange(2, 10, quantidadeTurma).getValues();
  let nomesTurmas = informacoes.getRange(2, 5, quantidadeTurma).getValues();
  let diaSemana = informacoes.getRange(2, 6, quantidadeTurma).getValues();
  let horario = informacoes.getRange(2, 7, quantidadeTurma).getValues();
  let linkMeet = informacoes.getRange(2, 8, quantidadeTurma).getValues();
  let horarioFim = horario.map( hora => {return new Date(hora[0].getTime() + (1 * 60 + 40) * 60 * 1000)}) 
  let ultimaReuniao = informacoes.getRange('C2').getValue();
  const diaRecado = informacoes.getRange("C8" ).getValue().toString().slice(0, 1);
  const data = new Date(informacoes.getRange('C9').getValue());
  let reuniaoAtual = verificarReuniaoAtual(data);
  // let hoje =  new Date("Wed Jun 18 2025 22:11:31 GMT-0300 (Brasilia Standard Time)");
  // criarTriggerParaData(hoje, "I");

  if(ultimaReuniao != reuniaoAtual){
    if(!idTurmas[0][0]){
      let objIdTurmas = {}
      try {
        const response = Classroom.Courses.list();
        const courses = response.courses;
        if (!courses || courses.length === 0) {
          console.log('No courses found.');
          return;
        }
        for (const course in courses) {
          for(const link in linksTurmas){
            if(courses[course].alternateLink == linksTurmas[link]){
              objIdTurmas[linksTurmas[link]] = courses[course].id
            }
          }
        }
        const ids = linksTurmas.map(chave => objIdTurmas[chave]);

        informacoes.getRange(2, 10, quantidadeTurma).setValues(ids.map(v => [v]));
        idTurmas = informacoes.getRange(2, 10, quantidadeTurma).getValues();
      } catch (err) {
        console.log('Failed with error %s', err.message);
      }
    } 

    let linhaId;

    for(let i = 2; i<12; i++){
      if(reuniaoAtual == datas.getRange(i, 1).getValue()){
        linhaId = i
      }
    }

    for(const idTurma in idTurmas){
      let diaTabela = diaSemana[idTurma].toString();
      let diaMensagem = diaTabela.slice(3, diaTabela.length);
      let horaInicio = horario[idTurma][0];
      let horaFinal = horarioFim[idTurma];
      let dataReuniao = datas.getRange(linhaId, parseInt(idTurma) + 2).getValue();
      criarTriggerParaData(dataReuniao, nomesTurmas[idTurma][0]);
      let linkSlide = slides.getRange(linhaId, parseInt(idTurma) + 2).getValue();
      informacoes.getRange('C10').setValue(gerarTextoIA(linkSlide))
      let mensagem = informacoes.getRange('C10').getValue();


      let announcement = {
        text: `
              Bom dia pessoal da turma ${nomesTurmas[idTurma]}!
              ${mensagem}
              ${reuniaoAtual}º Encontro
              🤩 Pauta: ${slides.getRange(linhaId, 5).getValue()}
              📆 Data: ${diaMensagem}, ${pegarData(dataReuniao)}
              ⏰ Horário: ${pegarHorasMinutos(horaInicio)}h às ${pegarHorasMinutos(horaFinal)}h

              🖥️ Slides: ${linkSlide}
              📲 Link da Reunião: ${linkMeet[idTurma]}
              🎞️ Link da gravação: @ainda não gravado
              `,
      };


      const resultado = Classroom.Courses.Announcements.create(announcement, idTurmas[idTurma]);
      const announcementId = resultado.id;
      informacoes.getRange(parseInt(idTurma) + 2, 11).setValue(announcementId);

    }
    informacoes.getRange('C2').setValue(reuniaoAtual);

  } else {
    console.log("Estamos na mesma semana ainda")
  }
  criarTriggerParaEnviarAviso(diaRecado); 
}


function pegarHorasMinutos(data){
  let dataFormatada = new Date(data)
  let horas = dataFormatada.getHours().toString().padStart(2, '0');
  let minutos = dataFormatada.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}


function pegarData(data){
  let dataFormatada = new Date(data)
  let dia = dataFormatada.getDate().toString().padStart(2, '0');
  let mes = (dataFormatada.getMonth() + 1).toString().padStart(2, '0');
  let ano = dataFormatada.getFullYear()
  return `${dia}/${mes}/${ano}`;
}

function removerTriggersDaFuncao(nomeFuncao) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === nomeFuncao) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function criarTriggerParaData(data, nomeTurma) {
  const trigger = ScriptApp.newTrigger("verificarFaltantes")
                           .timeBased()
                           .at(data)
                           .create();

  const triggerId = trigger.getUniqueId();
  PropertiesService.getScriptProperties().setProperty(`turma_${triggerId}`, nomeTurma);
}

function criarTriggerParaEnviarAviso(diaDaSemana) {
  removerTriggersDaFuncao('enviarAviso');
  const hoje = new Date();
  const diasParaSabado = (6 - diaDaSemana + 7) % 7; // se hoje for sábado, agenda para o próximo

  const proximoSabado = new Date(hoje);
  proximoSabado.setDate(hoje.getDate() + diasParaSabado);
  proximoSabado.setHours(8, 0, 0, 0); // 08:00:00 da manhã

  ScriptApp.newTrigger('enviarAviso')
           .timeBased()
           .at(proximoSabado)
           .create();
}


function inserirDiasEspecificos(dataInicial) {
  let diaSemanaDesejado = 6;
  let semanas = []
  const primeiraData = getProximoDiaSemana(dataInicial, diaSemanaDesejado);

  for (let i = 0; i < 7; i++) {
    const data = new Date(primeiraData);
    data.setDate(primeiraData.getDate() + i * 7);
    semanas.push(data)
  }
  for (let i = 7; i < 11; i++) {
    const data = new Date(primeiraData);
    data.setDate(primeiraData.getDate() + i * 7 + 3 * 7);
    semanas.push(data)
  }
  return semanas;
}

function teste2(){

}


function verificarReuniaoAtual(data) {
  const reunioes = inserirDiasEspecificos(data)

  const agora = new Date();
  let reuniaoAtual = 0;

  for (let i = 0; i < reunioes.length-1; i++) {
    if (agora > reunioes[i] && agora < reunioes[i+1]) {
      reuniaoAtual = i + 1;
      break;
    }
  }
  return reuniaoAtual;
}



