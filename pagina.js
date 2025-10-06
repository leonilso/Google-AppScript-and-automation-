
function doGet(e) {
  // Se não tiver token, exibe a tela de login
  var authUrl = "https://auth-cs.identidadedigital.pr.gov.br/centralautenticacao/login.html?" +
    "response_type=token" +
    "&client_id=f340f1b1f65b6df5b5e3f94d95b11daf" +
    "&redirect_uri=" + encodeURIComponent(getWebAppUrl()) +
    "&scope=emgpr.mobile emgpr.v1.ocorrencia.post";

  var template = HtmlService.createTemplateFromFile("login");
  template.authUrl = authUrl;
  return template.evaluate().setTitle("Autenticação RCO");
}

// Função chamada pelo login.html para salvar o token
function salvarToken(token) {
  PropertiesService.getScriptProperties().setProperty("access_token", token);
  return "Token salvo com sucesso: " + token;
}

function getWebAppUrl() {
  return "https://script.google.com/macros/s/AKfycbz0ttSGKxFJvUHQ08VgjIfRHv0sGesNZKvlkxFyQSqflFqj5wBxdt4nXnGd8BopWNVi/exec";
}
