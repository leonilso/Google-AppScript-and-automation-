function myFunction() {
  Logger.log(PropertiesService.getScriptProperties().getKeys())
  Logger.log(PropertiesService.getScriptProperties().getProperty("turma_6838553766002688000"))
}

function extrairTextoDoSlide(slideId) {
  try {
    const apresentacao = SlidesApp.openById(slideId);
    const slides = apresentacao.getSlides();
    let textoCompleto = "";

    slides.forEach(slide => {
      slide.getShapes().forEach(shape => {
        if (shape.getText) {
          textoCompleto += shape.getText().asString() + "\n";
        }
      });
    });

    // Logger.log(textoCompleto);
    return textoCompleto;

  } catch (e) {
    Logger.log("Erro ao acessar o slide: " + e.toString());
    return null;
  }
}



function gerarTextoIA(linkSlide){
  let regex = /\/d\/([a-zA-Z0-9-_]+)/;
  let match = linkSlide.match(regex);
  let textoSlide = extrairTextoDoSlide(match[1]);

  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const prompt = "Com base no seguinte conteúdo de um slide, gere uma mensagem amigável e informativa para alunos no Google Classroom sobre o tópico da aula. A mensagem deve ser concisa e curta no máximo 2 linhas, retorne somente o coteúdo da mensagem. Conteúdo do slide:\n\n" + textoSlide;

  const payload = {
    "contents": [{
      "parts": [{
        "text": prompt
      }]
    }]
  };


  const options = {
    'method': 'post',
    'headers': {
      'x-goog-api-key': apiKey,
    },
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  // Extrai o texto gerado da resposta da API
  const mensagemGerada = data.candidates[0].content.parts[0].text;
  Logger.log(mensagemGerada);
  return mensagemGerada;
}