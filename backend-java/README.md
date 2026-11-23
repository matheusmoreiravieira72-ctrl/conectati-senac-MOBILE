# ConectaTI Senac — Testes de unidade (JUnit 5 + Mockito)

Projeto Java/Maven com as **regras de negócio** do sistema de chamados
(validações, numeração sequencial e transições de status do Suporte TI) e a
suíte de testes exigida na disciplina:

- **JUnit 5** — `ChamadoServiceTest`: testes de unidade com `@Nested`,
  `@DisplayName`, `@ParameterizedTest` e um repositório em memória.
- **Mockito** — `ChamadoServiceMockitoTest`: simulação (`@Mock`) do
  `ChamadoRepository`, verificação de interações (`verify`, `never`),
  respostas dinâmicas (`when...thenAnswer`) e captura de argumentos
  (`ArgumentCaptor`).

## Estrutura

```
backend-java/
├── pom.xml                                          # JUnit 5.10 + Mockito 5.11
└── src/
    ├── main/java/br/senac/conectati/
    │   ├── model/Chamado.java                       # entidade
    │   ├── repository/ChamadoRepository.java        # interface (porta de dados)
    │   └── service/ChamadoService.java              # regras de negócio
    └── test/java/br/senac/conectati/service/
        ├── ChamadoRepositorioEmMemoria.java         # fake para o JUnit
        ├── ChamadoServiceTest.java                  # JUnit 5 (20+ casos)
        └── ChamadoServiceMockitoTest.java           # Mockito (7 casos)
```

## Como executar

Requisitos: **JDK 21** e **Maven 3.9+**

```bash
cd backend-java
mvn test          # roda toda a suíte (JUnit + Mockito)
mvn clean test    # execução limpa
```

Saída esperada: todos os testes verdes (`Tests run: X, Failures: 0, Errors: 0`).

## Regras testadas

| Regra | Onde |
| --- | --- |
| Descrição mínima de 10 caracteres | abertura e edição |
| Solicitante obrigatório | abertura |
| Tipos válidos (Notebook, Projetor, Internet…) | abertura e edição |
| Prioridades válidas (Baixa, Média, Alta) | abertura e edição |
| Numeração sequencial (último + 1) | abertura |
| Aberto → Em atendimento → Resolvido | transições |
| Resolvido → Aberto (reabrir) | transições |
| Transições inválidas rejeitadas | transições |
