import mysql from 'mysql2/promise';

const COMANDO_SOMENTE_LEITURA = /^\s*(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i;

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`CONFIGURACAO: informe ${nome} para consultar o banco SMART.`);
  return valor;
}

function validarSqlSomenteLeitura(sql: string): void {
  if (!COMANDO_SOMENTE_LEITURA.test(sql)) {
    throw new Error('SEGURANCA: o gerador SMART aceita somente SELECT/SHOW/DESCRIBE/EXPLAIN.');
  }

  const semTerminadores = sql.trim().replace(/;+$/, '');
  if (semTerminadores.includes(';')) {
    throw new Error('SEGURANCA: consultas SQL empilhadas nao sao permitidas.');
  }
}

async function criarConexaoSmart(): Promise<mysql.Connection> {
  const port = Number(process.env.SMART_DB_PORT?.trim() || '3306');
  if (!Number.isInteger(port) || port <= 0) throw new Error('CONFIGURACAO: SMART_DB_PORT deve ser uma porta valida.');

  return mysql.createConnection({
    host: envObrigatoria('SMART_DB_HOST'),
    port,
    user: envObrigatoria('SMART_DB_USER'),
    password: envObrigatoria('SMART_DB_PASSWORD'),
    database: process.env.SMART_DB_NAME?.trim() || 'SMART',
    connectTimeout: 8_000,
    multipleStatements: false,
  });
}

export async function consultarSmart<T>(sql: string, parametros: unknown[] = []): Promise<T[]> {
  validarSqlSomenteLeitura(sql);
  const conexao = await criarConexaoSmart();

  try {
    const [linhas] = await conexao.query(sql, parametros);
    return linhas as T[];
  } finally {
    await conexao.end();
  }
}
