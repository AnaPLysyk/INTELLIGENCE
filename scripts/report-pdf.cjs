'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('@playwright/test');

const PASTA = path.resolve(__dirname, '..', 'reports', 'cucumber');
const HTML = path.join(PASTA, 'cucumber.html');
const PDF = path.join(PASTA, 'cucumber.pdf');

function servidor() {
  return http.createServer((req, res) => {
    const relativo = (req.url || '/').split('?')[0] === '/' ? '/cucumber.html' : (req.url || '/').split('?')[0];
    const absoluto = path.join(PASTA, decodeURIComponent(relativo));
    if (!absoluto.startsWith(PASTA)) return res.writeHead(403).end('Acesso negado.');
    fs.readFile(absoluto, (erro, conteudo) => {
      if (erro) return res.writeHead(404).end('Nao encontrado.');
      res.writeHead(200, { 'Content-Type': absoluto.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
      res.end(conteudo);
    });
  });
}

async function main() {
  if (!fs.existsSync(HTML)) throw new Error('reports/cucumber/cucumber.html nao existe. Execute os cenarios Cucumber antes.');
  const server = servidor();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/cucumber.html`, { waitUntil: 'networkidle' });
    await page.pdf({ path: PDF, format: 'A4', landscape: true, printBackground: true });
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log(`[relatorio-pdf] gerado em ${PDF}`);
}

main().catch((erro) => {
  console.error('[relatorio-pdf]', erro);
  process.exit(1);
});
