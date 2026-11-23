package br.senac.conectati.model;

/**
 * Chamado do sistema de suporte técnico do Senac.
 * Espelha o modelo usado pela API web (Prisma/SQLite).
 */
public class Chamado {

  private Long id;
  private int numero;
  private String tipo;
  private String local;
  private String descricao;
  private String prioridade;
  private String status;
  private String solicitante;
  private String evidenciaNome;
  private String evidenciaTipo;
  private String evidenciaDados;

  public Chamado() {
  }

  public Chamado(int numero, String tipo, String local, String descricao,
                 String prioridade, String status, String solicitante) {
    this.numero = numero;
    this.tipo = tipo;
    this.local = local;
    this.descricao = descricao;
    this.prioridade = prioridade;
    this.status = status;
    this.solicitante = solicitante;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public int getNumero() {
    return numero;
  }

  public void setNumero(int numero) {
    this.numero = numero;
  }

  public String getTipo() {
    return tipo;
  }

  public void setTipo(String tipo) {
    this.tipo = tipo;
  }

  public String getLocal() {
    return local;
  }

  public void setLocal(String local) {
    this.local = local;
  }

  public String getDescricao() {
    return descricao;
  }

  public void setDescricao(String descricao) {
    this.descricao = descricao;
  }

  public String getPrioridade() {
    return prioridade;
  }

  public void setPrioridade(String prioridade) {
    this.prioridade = prioridade;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getSolicitante() {
    return solicitante;
  }

  public void setSolicitante(String solicitante) {
    this.solicitante = solicitante;
  }

  public String getEvidenciaNome() {
    return evidenciaNome;
  }

  public void setEvidenciaNome(String evidenciaNome) {
    this.evidenciaNome = evidenciaNome;
  }

  public String getEvidenciaTipo() {
    return evidenciaTipo;
  }

  public void setEvidenciaTipo(String evidenciaTipo) {
    this.evidenciaTipo = evidenciaTipo;
  }

  public String getEvidenciaDados() {
    return evidenciaDados;
  }

  public void setEvidenciaDados(String evidenciaDados) {
    this.evidenciaDados = evidenciaDados;
  }

  @Override
  public String toString() {
    return "#" + String.format("%03d", numero) + " · " + tipo + " · " + local
        + " · " + status;
  }
}
