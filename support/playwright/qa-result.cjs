'use strict';

const fs = require('node:fs');
const path = require('node:path');

function mensagensDoResultado(resultado) {
  const mensagens = [];
  if (resultado?.error?.message) mensagens.push(String(resultado.error.message));
  for (const erro of resultado?.errors || []) {
    if (erro?.message) mensagens.push(String(erro.message));
  }
  return [...new Set(m