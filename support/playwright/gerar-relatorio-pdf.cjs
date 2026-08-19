'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('@playwright/test');

const PASTA_RELATORIO = path.resolve(__dirname, '..', '..', 'playwright-report');
const SAIDA_PDF = path.resolve(PASTA_RELATORIO, 'relatorio.pdf');

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function criarServidor() {
  return http.createServer((requisicao, resposta) => {
    const urlSemQuery = (requisicao.url || '/').split('?')[0];
    const caminhoRelativo = urlSemQuery === '/' ? '/index.html' : urlSemQuery;
    const caminhoAbsoluto = path.join(PASTA_RELATORIO, decodeURIComponent(caminhoRelativo));

    if (!caminhoAbsoluto.startsWith(PASTA_RELATORIO)) {
      resposta.writeHead(403);
      resposta.end('Acesso negado.');
      return;
    }

    fs.readFile(caminhoAbsoluto, (erro, conteudo) => {
      if (erro) {
        resposta.writeHead(404);
        resposta.end('Nao encontrado.');
        return;
      }
      const extensao = path.extname(caminhoAbsoluto).toLowerCase();
      resposta.writeHead(200, { 'Content-Type': TIPOS_MIME[extensao] || 'application/octet-stream' });
      resposta.end(conteudo);
    });
  });
}

async function main() {
  if (!fs.existsSync(path.join(PASTA_RELATORIO, 'index.html'))) {
    console.error(
      '[relatorio-pdf] playwright-report/index.html nao existe. Rode os testes antes '
      + '(ex: npm run test:regression) para gerar o relatorio HTML.',
    );
    process.exit(2);
  }

  const servidor = criarServidor();
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const { port } = servidor.address();

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.emulateMedia({ media: 'screen' });
    await page.pdf({
      path: SAIDA_PDF,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
    });
  } finally {
    await browser.close();
    await new Promise((resolve) => servidor.close(resolve));
  }

  console.log(`[relatorio-pdf] gerado em ${SAIDA_PDF}`);
}

main().catch((erro) => {
  console.error('[relatorio-pdf]', erro);
  process.exit(1);
});
