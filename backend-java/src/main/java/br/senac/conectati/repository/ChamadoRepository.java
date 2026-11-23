package br.senac.conectati.repository;

import br.senac.conectati.model.Chamado;

import java.util.List;
import java.util.Optional;

/**
 * Porta de acesso aos dados de chamados.
 * A implementação real usa Prisma/SQLite (via API web); nos testes
 * de unidade essa interface é simulada com Mockito.
 */
public interface ChamadoRepository {

  /** Retorna o maior número de chamado já registrado (0 se não houver). */
  int buscarUltimoNumero();

  Optional<Chamado> buscarPorId(Long id);

  List<Chamado> listarTodos();

  Chamado salvar(Chamado chamado);

  Chamado atualizar(Chamado chamado);
}
