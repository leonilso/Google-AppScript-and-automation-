function separarPorTurma() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const informacoes = ss.getSheetByName("informacoes");
  const gerarAbas = informacoes.getRange("C3");
  // const gerarAbas = true;
  const diaRecado = informacoes.getRange("C8" ).getValue().toString().slice(0, 1);
  const horaRecado = informacoes.getRange("C8" ).getValue()

  if(gerarAbas.getValue()){
    criarTriggerPara(diaRecado, horaRecado);
    const sheetOrigem = ss.getSheetByName("Formadores em Ação Relação de cursistas_Formador Leonilso - Sheet1");
    const dados = sheetOrigem.getDataRange().getValues();
    const cabecalho = dados[0];

    
    const dadosSemCabecalho = dados.slice(1);
    
    const turmas = {};
    
    dadosSemCabecalho.forEach(linha => {
      let regex = /(.*?)\s/;
      var match = linha[1].match(regex);
      const turma = match[1];
      if (!turmas[turma]) {
        turmas[turma] = [];
      }
      turmas[turma].push(linha);
    });
    
    // Criar uma aba para cada turma
    for (let turma in turmas) {
      let aba;
      try {
        aba = ss.getSheetByName(turma);
        if (aba) ss.deleteSheet(aba);
      } catch (e) {}
      aba = ss.insertSheet(turma);
      aba.appendRow(cabecalho);
      aba.getRange(2, 1, turmas[turma].length, cabecalho.length).setValues(turmas[turma]);
      // aba.getRange(2, 3, turmas[turma].length).setNumberFormat("hh:mm");
    }


    // Cria informações das turmas
    const infoTurmas = ["turma",	"dia_semana",	"horario", "link_meet", "link_turmas", "id_curso", "último_aviso", "link_vídeo"];
    informacoes.getRange(`E1:L1`).setValues([infoTurmas]);


    const resumoSet = new Set();
    dadosSemCabecalho.forEach(linha => {
      let horaFormatada = linha[1].match(/(\d{2})h(\d{2})/);
      const chave = `${linha[1].match(/(.*?)\s/)[0]}|${pegarDiaSemanaFormatado(linha[1])}|${horaFormatada[1]}:${horaFormatada[2]}`;
      resumoSet.add(chave);
    });

    const linhasResumo = Array.from(resumoSet).map(item => item.split("|"));

    informacoes.getRange(2, 5, linhasResumo.length, 3).setValues(linhasResumo);
    informacoes.getRange(2, 8, linhasResumo.length).setNumberFormat("hh:mm");


    // Cria aba de slides
    let slides;
    let quantidadeTurmas = Object.keys(turmas).length
    let nomeTurmas = Object.keys(turmas);
    nomeTurmas.unshift("Reuniões");
    nomeTurmas.push("tema")
    const numeros = Array.from({ length: 10 }, (_, i) => [i + 1]);
    try {
        slides = ss.getSheetByName("slides");
        slides.getRange(1, 1, 1, nomeTurmas.length).setValues([nomeTurmas])
        slides.getRange(2, 1, 10, 1).setValues(numeros);
    } catch (e) {
        slides = ss.insertSheet("slides");
        slides.getRange(1, 1, 1, nomeTurmas.length).setValues([nomeTurmas])
        slides.getRange(2, 1, 10, 1).setValues(numeros);
      }

    // Criando aba datas
    let datas;
    try {
        datas = ss.getSheetByName("datas");
        datas.getRange(1, 1, 1, nomeTurmas.length).setValues([nomeTurmas])
        datas.getRange(2, 1, 10, 1).setValues(numeros);
    } catch (e) {
        datas = ss.insertSheet("datas");
        datas.getRange(1, 1, 1, nomeTurmas.length).setValues([nomeTurmas])
        datas.getRange(2, 1, 10, 1).setValues(numeros);
      }
    const dataInicial = informacoes.getRange("C9").getValue();
    for(let i = 0; i<quantidadeTurmas; i++){
      let diaSemana = parseInt(pegarNumeroDiaSemana(ss.getSheetByName(Object.keys(turmas)[i]).getRange('B2').getValue()));
      let horarioTemp = new Date(informacoes.getRange(2,7, quantidadeTurmas).getValues()[i]);
      let hora;
      let minuto = horarioTemp.getMinutes()
      if(i==1){
        hora = horarioTemp.getHours() + 5
      } else {
        hora = horarioTemp.getHours() + 4
      }
      inserirDiasEspecificosGT(datas, i+2, dataInicial, diaSemana, hora, minuto);
    }
    gerarAbas.setValue(false);
    informacoes.getRange(`C4`).setValue(quantidadeTurmas)
  }
}


function inserirDiasEspecificosGT(sheet, colunaDestino, dataInicial, diaSemanaDesejado, hora, minuto) {

  const primeiraData = getProximoDiaSemana(dataInicial, diaSemanaDesejado);
  let celula;
  for (let i = 0; i < 10; i++) {
    const data = new Date(primeiraData);
    data.setDate(primeiraData.getDate() + i * 7);
    data.setHours(hora, minuto, 0);
    celula = sheet.getRange(i + 2, colunaDestino);
    celula.setValue(data);
    celula.setNumberFormat("dd/mm/yyyy hh:mm");
  }
  // for (let i = 7; i < 10; i++) {
  //   const data = new Date(primeiraData);
  //   data.setDate(primeiraData.getDate() + i * 7 + 3 * 7);
  //   data.setHours(hora, minuto, 0);
  //   celula = sheet.getRange(i + 2, colunaDestino);
  //   celula.setValue(data);
  //   celula.setNumberFormat("dd/mm/yyyy hh:mm");
  // }
}

function getProximoDiaSemana(dataBase, diaSemanaDesejado) {
  const resultado = new Date(dataBase);
  const atual = resultado.getDay() + 1;
  const diasAte = (diaSemanaDesejado - atual + 7) % 7;
  resultado.setDate(resultado.getDate() + diasAte);
  return resultado;
}

function pegarIdCurso(url) {
  var regex = /\/c\/([a-zA-Z0-9-]+)/;
  var match = url.match(regex);
  return match[1];
}

function criarTriggerPara(diaDaSemana, hora) {
  const hoje = new Date();
  const diasParaSabado = (6 - diaDaSemana + 7) % 7;
  const [horas, minutos] = hora.split(':').map(Number);

  const proximoSabado = new Date(hoje);
  proximoSabado.setDate(hoje.getDate() + diasParaSabado);
  proximoSabado.setHours(horas, minutos, 0, 0); // 08:00:00 da manhã

  ScriptApp.newTrigger('enviarAviso')
           .timeBased()
           .at(proximoSabado)
           .create();
}

function pegarDiaSemanaFormatado(texto) {
  var match = texto.match(/-\s*([\p{L}]+)\s*-/u);
  if (!match) return null;
  var dia = match[1]
  var dias = {
    "Segunda": "2. Segunda-feira",
    "Terça": "3. Terça-feira",
    "Quarta": "4. Quarta-feira",
    "Quinta": "5. Quinta-feira",
    "Sexta": "6. Sexta-feira",
    "Sábado": "7. Sábado",
    "Domingo": "1. Domingo"
  };
  
  return dias[dia];
}

function pegarNumeroDiaSemana(texto) {
  var match = texto.match(/-\s*([\p{L}]+)\s*-/u);
  if (!match) return null;
  var dia = match[1]
  var dias = {
    "Segunda": 2,
    "Terça": 3,
    "Quarta": 4,
    "Quinta": 5,
    "Sexta": 6,
    "Sábado": 7,
    "Domingo": 1
  };
  
  return dias[dia];
}
