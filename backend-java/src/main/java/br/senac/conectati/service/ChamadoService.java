package br.senac.conectati.service;

import br.senac.conectati.model.Chamado;
import br.senac.conectati.repository.ChamadoRepository;

import java.util.List;
import java.util.Set;

/**
 * Regras de negócio dos chamados do ConectaTI Senac.
 * Espelham as validações da API web (src/app/api/chamados):
 * descrição mínima, solicitante obrigatório, tipos/locais/prioridades
 * válidos, numeração sequencial, transições de status do Suporte TI
 * e evidência obrigatória para fechar o chamado.
 */
public class ChamadoService {

  public static final String STATUS_ABERTO = "Aberto";
  public static final String STATUS_EM_ATENDIMENTO = "Em atendimento";
  public static final String STATUS_RESOLVIDO = "Resolvido";

  public static final Set<String> TIPOS_VALIDOS = Set.of(
      "Notebook", "Projetor", "Internet", "Impressora",
      "Computador", "Software", "Outro");

  public static final Set<String> PRIORIDADES_VALIDAS = Set.of(
      "Baixa", "Média", "Alta");

  private static final int DESCRICAO_MINIMA = 10;

  /** Limite do arquivo de evidência (5 MB) e do data URL base64 equivalente. */
  public static final long EVIDENCIA_LIMITE_BYTES = 5L * 1024 * 1024;
  private static final int EVIDENCIA_DADOS_MAX = 7_500_000;

  private final ChamadoRepository repository;

  public ChamadoService(ChamadoRepository repository) {
    this.repository = repository;
  }

  /** Abre um novo chamado com numeração sequencial e status inicial "Aberto". */
  public Chamado abrirChamado(Chamado novo) {
    validarDescricao(novo.getDescricao());
    validarSolicitante(novo.getSolicitante());
    validarTipo(novo.getTipo());
    validarPrioridade(novo.getPrioridade());

    int proximoNumero = repository.buscarUltimoNumero() + 1;
    novo.setNumero(proximoNumero);
    novo.setStatus(STATUS_ABERTO);

    return repository.salvar(novo);
  }

  /** Edita os dados de um chamado existente (mesmas validações da abertura). */
  public Chamado editarChamado(Chamado existente, String novoTipo,
                               String novoLocal, String novaDescricao,
                               String novaPrioridade) {
    if (existente == null) {
      throw new IllegalArgumentException("Chamado inexistente.");
    }
    validarTipo(novoTipo);
    validarPrioridade(novaPrioridade);
    validarDescricao(novaDescricao);

    existente.setTipo(novoTipo);
    existente.setLocal(novoLocal == null || novoLocal.isBlank()
        ? existente.getLocal() : novoLocal);
    existente.setDescricao(novaDescricao);
    existente.setPrioridade(novaPrioridade);

    return repository.atualizar(existente);
  }

  /** Transição de status executada pelo Suporte TI. */
  public Chamado alterarStatus(Chamado chamado, String novoStatus) {
    if (chamado == null) {
      throw new IllegalArgumentException("Chamado inexistente.");
    }
    if (!Set.of(STATUS_ABERTO, STATUS_EM_ATENDIMENTO, STATUS_RESOLVIDO)
        .contains(novoStatus)) {
      throw new IllegalArgumentException("Status inválido: " + novoStatus);
    }

    String atual = chamado.getStatus();
    boolean transicaoValida =
        (atual.equals(STATUS_ABERTO) && novoStatus.equals(STATUS_EM_ATENDIMENTO))
            || (atual.equals(STATUS_ABERTO) && novoStatus.equals(STATUS_RESOLVIDO))
            || (atual.equals(STATUS_EM_ATENDIMENTO) && novoStatus.equals(STATUS_RESOLVIDO))
            || (atual.equals(STATUS_RESOLVIDO) && novoStatus.equals(STATUS_ABERTO));

    if (!transicaoValida) {
      throw new IllegalStateException(
          "Transição de status não permitida: " + atual + " → " + novoStatus);
    }

    // Regra de negócio: só fecha como Resolvido com evidência anexada.
    if (STATUS_RESOLVIDO.equals(novoStatus)
        && !temEvidencia(chamado)) {
      throw new IllegalStateException(
          "Para fechar o chamado é obrigatório anexar uma evidência (imagem ou documento).");
    }

    chamado.setStatus(novoStatus);
    return repository.atualizar(chamado);
  }

  /** Inicia o atendimento (Somente de "Aberto"). */
  public Chamado iniciarAtendimento(Chamado chamado) {
    return alterarStatus(chamado, STATUS_EM_ATENDIMENTO);
  }

  /** Fecha o chamado como Resolvido (a partir de Aberto ou Em atendimento). Exige evidência já anexada. */
  public Chamado fecharChamado(Chamado chamado) {
    return alterarStatus(chamado, STATUS_RESOLVIDO);
  }

  /** Anexa a evidência do atendimento (imagem ou documento) e fecha o chamado como Resolvido. */
  public Chamado fecharChamadoComEvidencia(Chamado chamado, String nomeArquivo,
                                           String tipoArquivo, String dadosBase64) {
    validarEvidencia(nomeArquivo, dadosBase64);
    chamado.setEvidenciaNome(nomeArquivo.trim());
    chamado.setEvidenciaTipo(tipoArquivo == null || tipoArquivo.isBlank()
        ? "application/octet-stream" : tipoArquivo.trim());
    chamado.setEvidenciaDados(dadosBase64);
    return fecharChamado(chamado);
  }

  /** Reabre um chamado Resolvido. */
  public Chamado reabrirChamado(Chamado chamado) {
    return alterarStatus(chamado, STATUS_ABERTO);
  }

  public List<Chamado> listarTodos() {
    return repository.listarTodos();
  }

  public Chamado buscarPorId(Long id) {
    return repository.buscarPorId(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Chamado não encontrado: id " + id));
  }

  /* ---------- validações ---------- */

  private boolean temEvidencia(Chamado chamado) {
    return chamado.getEvidenciaDados() != null && !chamado.getEvidenciaDados().isBlank();
  }

  private void validarEvidencia(String nomeArquivo, String dadosBase64) {
    if (nomeArquivo == null || nomeArquivo.trim().isEmpty()) {
      throw new IllegalArgumentException("Informe o nome do arquivo de evidência.");
    }
    if (dadosBase64 == null || !dadosBase64.startsWith("data:")) {
      throw new IllegalArgumentException(
          "Evidência inválida: envie um arquivo de imagem ou documento.");
    }
    if (dadosBase64.length() > EVIDENCIA_DADOS_MAX) {
      throw new IllegalArgumentException("Arquivo muito grande: o limite é de 5 MB.");
    }
  }

  private void validarDescricao(String descricao) {
    if (descricao == null || descricao.trim().length() < DESCRICAO_MINIMA) {
      throw new IllegalArgumentException(
          "Descreva o problema com pelo menos " + DESCRICAO_MINIMA + " caracteres.");
    }
  }

  private void validarSolicitante(String solicitante) {
    if (solicitante == null || solicitante.trim().isEmpty()) {
      throw new IllegalArgumentException("Informe o nome do solicitante.");
    }
  }

  private void validarTipo(String tipo) {
    if (tipo == null || !TIPOS_VALIDOS.contains(tipo)) {
      throw new IllegalArgumentException("Tipo de problema inválido: " + tipo);
    }
  }

  private void validarPrioridade(String prioridade) {
    if (prioridade == null || !PRIORIDADES_VALIDAS.contains(prioridade)) {
      throw new IllegalArgumentException("Prioridade inválida: " + prioridade);
    }
  }
}
