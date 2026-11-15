# Moda Center Entregas

Crie um aplicativo mobile-first (PWA) de logística e entregas atacadistas para o Moda Center Santa Cruz (Santa Cruz do Capibaribe - PE). Design limpo, alto contraste para uso sob luz forte, botões grandes para operação com uma mão.

Conecte ao Supabase e crie as seguintes tabelas e regras:

1. "stores" (id, nome, cnpj, created_at)

2. "users" (id, store_id, nome, telefone, role: 'admin' | 'entregador', ativo)

3. "carriers" (id, nome, tipo: 'excursao_interna' | 'box_interno' | 'transportadora_externa', latitude, longitude, setor_vaga_texto, horario_saida_padrao, tempo_medio_fila_minutos, alerta_fila_ativo boolean)

4. "carrier_location_reports" (id, carrier_id, user_id, nova_latitude, nova_longitude, nova_vaga_texto, created_at)

5. "deliveries" (id, store_id, courier_id, carrier_id, nome_cliente, cidade_destino, qtd_volumes, tamanho_volume: 'P' | 'M' | 'G', horario_limite, observacao, status: 'pendente_carga' | 'em_rota' | 'entregue' | 'atrasado', foto_comprovante_url, entregue_em, ordem_rota)

6. "queue_telemetry" (id, carrier_id, courier_id, chegada_em, entrega_confirmada_em, duracao_segundos, dia_semana)

Crie nesta etapa as 3 primeiras telas:

- Tela 1 (Login / Seleção de Perfil): Permite entrar como Lojista/Admin ou Entregador da loja.

- Tela 2 (Entregas da Semana - Lojista): Formulário rápido para cadastrar entrega (Cliente, Cidade, Excursão/Transportadora com autopreenchimento de vaga e horário limite + opção de cadastrar nova transportadora, Quantidade de Volumes, Tamanho P/M/G, Horário Limite e Observação) e lista de pacotes cadastrados.

- Tela 3 (Montar Carga - Entregador): Lista todos os pacotes com status 'pendente_carga' da loja. O entregador vai marcando via toque/checkbox os volumes que colocou na carroça ou veículo. Ao clicar em "Iniciar Rota", os itens marcados mudam para 'em_rota', ficam vinculados ao courier_id dele (bloqueando para outros entregadores da loja) e abrem a tela de rota.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/703c8285-3062-43bd-a4dc-6895611d355a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
