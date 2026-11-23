"use client";

/**
 * Biometria no navegador:
 * - Tenta a API WebAuthn (impressão digital / reconhecimento facial do
 *   dispositivo, via autenticador de plataforma).
 * - Se o dispositivo/navegador não tiver sensor (ou o navegador bloquear),
 *   cai para um modo simulado para que o fluxo continue funcionando.
 */

export type MetodoBiometria = "digital" | "facial";

export interface ResultadoBiometria {
  ok: boolean;
  simulado: boolean;
  erro?: string;
}

async function autenticadorPlataformaDisponivel(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    if (!window.PublicKeyCredential) return false;
    if (typeof window.PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
      return false;
    }
    const disponivel =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(disponivel);
  } catch {
    return false;
  }
}

function desafio(): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bufferParaHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function simularBiometria(ms = 1600): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, ms));
}

const CHAVE_CREDENCIAL = "hd_credencial_id";

export async function autenticarBiometria(
  metodo: MetodoBiometria,
): Promise<ResultadoBiometria> {
  const disponivel = await autenticadorPlataformaDisponivel();

  if (!disponivel) {
    await simularBiometria();
    return { ok: true, simulado: true };
  }

  try {
    const idSalvo =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(CHAVE_CREDENCIAL)
        : null;

    if (idSalvo) {
      // Já existe credencial cadastrada: apenas verificar (get).
      await navigator.credentials.get({
        publicKey: {
          challenge: desafio(),
          userVerification: "required",
          timeout: 45000,
        },
      });
    } else {
      // Primeiro uso: cadastra a biometria (create) com verificação de usuário.
      const credencial = await navigator.credentials.create({
        publicKey: {
          challenge: desafio(),
          rp: { name: "Sistema de Chamados" },
          user: {
            id: desafio(),
            name: `usuario-${Date.now()}`,
            displayName: "Usuário do Sistema de Chamados",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      });
      if (credencial && "rawId" in credencial) {
        try {
          localStorage.setItem(
            CHAVE_CREDENCIAL,
            bufferParaHex(credencial.rawId as ArrayBuffer),
          );
        } catch {
          /* ignora falha de armazenamento */
        }
      }
    }
    return { ok: true, simulado: false };
  } catch (erro) {
    // Sensor presente mas falhou (permissão, iframe, cancelamento): cai
    // para o modo simulado para o usuário não ficar sem acesso.
    await simularBiometria();
    const mensagem =
      erro instanceof Error && erro.message
        ? erro.message
        : "Sensor indisponível neste ambiente";
    return { ok: true, simulado: true, erro: mensagem };
  }
}
