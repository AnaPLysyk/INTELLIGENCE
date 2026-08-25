import type { APIRequestContext } from '@playwright/test';

import { abrirSessaoIntelligenceApi } from '../api/intelligence';

export type PerfilIntelligence = 'view-only' | 'sem-permissao';
export type CredenciaisPerfilIntelligence = { usuario: string; senha: string };

type Candidato = CredenciaisPerfilIntelligence & { origem: string };
type CandidatoClassificado = Candidato & { claims: Set<string> };

const cache = new Map<string, CandidatoClassificado>();

function candidato(origem: string, envUsuario: string, envSenha: string): Candidato | undefined {
  const usuario = process.env[envUsuario]?.trim();
  const senha = process.env[envSenha]?.trim();
  return usuario && senha ? { origem, usuario, senha } : undefined;
}

function candidatos(): Candidato[] {
  const lista = [
    candidato('INT_100_VIEWONLY', 'INT_100_VIEWONLY_USERNAME', 'INT_100_VIEWONLY_PASSWORD'),
    candidato('INT_100_SEM_PERMISSAO', 'INT_100_SEM_PERMISSAO_USERNAME', 'INT_100_SEM_PERMISSAO_PASSWORD'),
    candidato('SMART_UI', 'SMART_UI_USERNAME', 'SMART_UI_PASSWORD'),
    candidato('SMART_INTEGRADOR', 'SMART_INTEGRADOR_USERNAME', 'SMART_INTEGRADOR_PASSWORD'),
    candidato('SMART_INTEGRADOR_2', 'SMART_INTEGRADOR_2_USERNAME', 'SMART_INTEGRADOR_2_PASSWORD'),
    candidato('SMART_CONFERENCIA', 'SMART_CONFERENCIA_USERNAME', 'SMART_CONFERENCIA_PASSWORD'),
    candidato('SMART_TRUST_READONLY', 'SMART_TRUST_READONLY_USERNAME', 'SMART_TRUST_READONLY_PASSWORD'),
    candidato('GBDS', 'GBDS_USERNAME', 'GBDS_PASSWORD'),
  ].filter((item): item is Candidato => Boolean(item));
  return [...new Map(lista.map((item) => [item.usuario, item])).values()];
}

function extrairClaims(token: string): Set<string> {
  const partes = token.split('.');
  if (partes.length < 2) throw new Error('AUTOMATION ERROR: token Intelligence nao e um JWT reconhecivel.');
  const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8')) as { permissions?: unknown };
  if (!Array.isArray(payload.permissions)) {
    throw new Error('AUTOMATION ERROR: token Intelligence sem permissions[].');
  }
  return new Set(payload.permissions.filter((claim): claim is string => typeof claim === 'string'));
}

async function classificar(request: APIRequestContext, item: Candidato): Promise<CandidatoClassificado | undefined> {
  const existente = cache.get(item.usuario);
  if (existente) return existente;
  try {
    const sessao = await abrirSessaoIntelligenceApi(request, item);
    const classificado = { ...item, claims: extrairClaims(sessao.token) };
    cache.set(item.usuario, classificado);
    return classificado;
  } catch {
    return undefined;
  }
}

function corresponde(perfil: PerfilIntelligence, claims: Set<string>): boolean {
  const viewOnly = claims.has('intelligence_view_only');
  const acesso = claims.has('intelligence_user');
  const busca = claims.has('intelligence_list_regular');

  return perfil === 'view-only'
    ? viewOnly && !acesso && !busca
    : !viewOnly && !acesso;
}

export async function obterCredenciaisParaPerfilIntelligence(
  request: APIRequestContext,
  perfil: PerfilIntelligence,
): Promise<CredenciaisPerfilIntelligence> {
  const avaliados: string[] = [];
  for (const item of candidatos()) {
    const classificado = await classificar(request, item);
    if (!classificado) {
      avaliados.push(`${item.origem}=nao-autenticou`);
      continue;
    }
    const viewOnly = classificado.claims.has('intelligence_view_only');
    const acesso = classificado.claims.has('intelligence_user');
    const busca = classificado.claims.has('intelligence_list_regular');
    avaliados.push(`${item.origem}=viewOnly:${viewOnly},acesso:${acesso},busca:${busca}`);
    if (corresponde(perfil, classificado.claims)) {
      console.log(
        `INTELLIGENCE_PROFILE_IDENTITY|profile=${perfil}|source=${classificado.origem}`
          + `|viewOnly=${viewOnly}|acesso=${acesso}|busca=${busca}`,
      );
      return { usuario: classificado.usuario, senha: classificado.senha };
    }
  }
  throw new Error(`BLOQUEADO: nenhuma conta SMART atende ao perfil ${perfil}. Candidatos: ${avaliados.join('; ')}.`);
}
