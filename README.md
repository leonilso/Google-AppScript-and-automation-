# Google-AppScript and Automation

Scripts para automação de envio de mensagens e integração com Google Classroom, Google Drive, YouTube e API Gemini.

## Visão Geral

Este repositório reúne diversos scripts em Google Apps Script (JavaScript para o ecossistema Google) visando facilitar automações educativas e de conteúdo, entre eles:

- Envio de avisos ou mensagens para turmas no **Google Classroom**  
- Integração com **Google Sheets** como interface de dados / controle  
- Operações com **Google Drive** (upload, organização, etc.)  
- Integração com **YouTube** (upload de vídeos, etc.)  
- Uso da **API Gemini** para funcionalidades adicionais (ex: geração automática de conteúdos ou textos)  

O objetivo é poupar tempo de professores ou gestores que queiram automatizar fluxos entre essas plataformas.

---

## Estrutura do Projeto

| Arquivo / Pasta       | Descrição |
|------------------------|-----------|
| `enviarAviso.js`       | Script responsável pelo envio de avisos para turmas no Google Classroom |
| `editarAviso.js`       | Script para editar avisos com o link do youtube  |
| `uploadVideo.js`       | Envio de vídeos para o YouTube  |
| `turma.js`             | consulta de turmas no Classroom |
| `separarTurmas.js`     | Lógica para segmentação de turmas com base em csv |
| `pagina.js`            | Página de front-end / interface (não implementado ainda) |
| `login.html`           | Página de login / autorização (não implementado ainda)  |
| `IA.js`                | Integrações ou funções relacionadas à API Gemini / inteligência artificial |
| `teste.js`             | Scripts de teste |
| `appsscript.json`      | Configurações de projeto Apps Script |
| `.clasp.json`          | Configurações do CLASP (ferramenta para deploy local de Apps Script) |

---

## Como usar / instalar

### Pré-requisitos

1. Conta Google com acesso ao Google Classroom e permissão para APIs (Drive, YouTube, etc.).  
2. Projeto no Google Cloud com APIs habilitadas (Drive, YouTube Data, Classroom).  
3. Ferramenta **clasp** instalada localmente para desenvolvimento (opcional, mas recomendado).  
4. Configuração de credenciais OAuth / API Keys conforme exigido pelas integrações.

### Passos

```bash
# Clone o repositório
git clone https://github.com/leonilso/Google-AppScript-and-automation.git
cd Google-AppScript-and-automation

# Login no clasp
clasp login

# Crie ou conecte ao seu projeto Apps Script
clasp create   # ou clasp clone <scriptId>

# Faça deploy
clasp push
```

5. Configure suas credenciais / tokens nos scripts ou via variáveis de ambiente.
6. Autorize os escopos solicitados (Drive, Classroom, YouTube, etc.).
7. Teste os scripts conforme o uso desejado (ex: chamar enviarAviso()).

## Licença

Este projeto está licenciado sob a MIT License.
Consulte o arquivo LICENSE para mais detalhes.

## Contribuição

Contribuições são bem-vindas! Algumas ideias:

* Cobrir mais casos de erro / tratamento de exceções
* Adicionar integração com outras APIs (ex: Drive compartilhado, YouTube captioning)
* Modularizar os scripts para reutilização
* Escrever testes automatizados

Para contribuir: faça um fork, crie uma branch de feature/fix e envie um pull request.

## Recursos úteis

- [Google Apps Script - Documentação Oficial](https://developers.google.com/apps-script)  
- [API Google Classroom](https://developers.google.com/classroom)  
- [API Google Drive](https://developers.google.com/drive)  
- [API YouTube Data](https://developers.google.com/youtube)  
- [API Gemini](https://ai.google.dev)  
- [Ferramenta CLASP (Command Line Apps Script)](https://github.com/google/clasp)  


