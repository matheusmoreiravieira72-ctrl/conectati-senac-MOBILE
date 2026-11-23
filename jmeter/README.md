# ConectaTI Senac — Teste de Carga com Apache JMeter

Plano de teste pronto para o Apache JMeter (`conectati-teste-carga.jmx`).

## Cenário simulado

| Elemento | Configuração |
| --- | --- |
| Usuários virtuais | 20 threads |
| Ramp-up | 20 segundos (1 novo usuário por segundo) |
| Repetições por usuário | 5 loops |
| Servidor alvo | variáveis `SERVIDOR` / `PORTA` (padrão `localhost:3000`) |

## Requisições testadas

1. **GET /api/chamados** — lista de chamados (assert HTTP 200)
2. **GET /api/equipamentos** — lista de notebooks (assert HTTP 200)
3. **POST /api/avaliacoes** — registra avaliação 5 estrelas (assert HTTP 201)

> O endpoint `/api/chat` (Conecta Robot) **não** entra no teste de carga de
> propósito: cada chamada consome uma requisição de modelo de IA, o que
> deixaria o teste lento e custoso.

## Como executar (interface gráfica)

1. Instale o JMeter: https://jmeter.apache.org/download_jmeter.cgi
2. Abra o JMeter e carregue `jmeter/conectati-teste-carga.jmx`
3. Com o servidor do ConectaTI rodando (`bun run dev` na raiz), clique em **Iniciar** (verde)
4. Veja os resultados em **Relatório Agregado** / **Relatório Resumido** / **Ver Árvore de Resultados**

## Como executar (linha de comando — recomendado para números reais)

```bash
# dentro da pasta jmeter
jmeter -n -t conectati-teste-carga.jmx -l resultado.jtl -e -o relatorio-html/
```

- `-n` modo não-GUI (mais preciso)
- `-l resultado.jtl` grava as amostras
- `-e -o relatorio-html/` gera o relatório HTML com gráficos (a pasta não pode existir antes)

Para testar contra o servidor publicando em rede, altere as variáveis
`SERVIDOR` e `PORTA` no Test Plan (elemento *User Defined Variables*).
