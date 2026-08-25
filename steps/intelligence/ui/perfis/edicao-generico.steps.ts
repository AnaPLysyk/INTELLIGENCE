import { Given, When, Then } from '@cucumber/cucumber';
import type { IntelligenceWorld } from '../../../../cucumber/world.js';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence.js';
import { autenticarAdmin, envObrigatoria } from '../helpers.js';

Given('que sou usuário administrador', async function (this: IntelligenceWorld) {
  await autenticarAdmin(this);
});

Given('acesso um perfil com campo de data preenchido', async function (this: IntelligenceWorld) {
  const page = await this.intelligence();
  await page.abrirDetalhesDoPerfilPorPguid(
    obterValorObrigatorioDaMassa('PGUID', process.env.INT_40_PGUID),
  );
});

When('abro a edição do perfil', async function (this: IntelligenceWorld) {
  const page = await this.intelligence();
  await page.abrirEdicaoAtual();
});

Then('o campo de data permanece preenchido', async function (this: IntelligenceWorld) {
  const page = await this.intelligence();
  await page.validarCampoDataPreenchidoNaEdicao(envObrigatoria('INT_40_DATE_FIELD_LABEL'));
});
