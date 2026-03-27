# Google Tag Manager, GA4 e Meta Pixel (Vite)

## Variáveis de ambiente (build do frontend)

Copie `.env.example` para `.env` e ajuste:

| Variável | Descrição |
|----------|-----------|
| `VITE_GTM_ID` | ID do container (ex.: `GTM-KBXVJPV3`). Padrão no código: `GTM-KBXVJPV3`. |
| `VITE_FB_PIXEL_ID` | ID numérico do Pixel Meta (opcional). |

O snippet **head** do GTM é injetado em `enableAnalytics()` (após o usuário aceitar cookies), via `src/utils/tagManager.js`.

O bloco **noscript** está em `index.html` com o mesmo ID `GTM-KBXVJPV3`. Se mudar o container, atualize **ambos** (env no build + iframe noscript).

## DataLayer (eventos úteis)

Após consentimento, o app envia:

- `page_view` — SPA (pathname + query); inclui `user_*` e `marketing_*` quando logado.
- `snaptap_user_context` — quando o perfil carrega ou dados de marketing mudam.
- `vip_page_view`, `vip_click_assinar`, `vip_click_beneficios`, etc.
- `profile_page_view`, `login_click`, …

Campos de usuário nos eventos (quando existirem):

- `user_steam_id`, `user_name`, `user_is_vip`, `user_level`
- `marketing_email`, `marketing_full_name`, `marketing_phone`

No **GTM**, crie acionadores do tipo **Evento personalizado** com estes nomes e use variáveis de camada de dados para GA4 / Ads / Meta.

## Meta Pixel

Se `VITE_FB_PIXEL_ID` estiver definido, o pixel base é carregado após cookies aceitos. O clique em **Assinar VIP** dispara também `InitiateCheckout` (além do evento no dataLayer).

## Backend — modal só para contas novas

Defina `MARKETING_GRANDFATHER_BEFORE` (ISO) no ambiente do **backend** na primeira publicação desta feature, para não obrigar jogadores antigos a preencher o modal. Contas criadas **depois** dessa data com `marketing_captured_at` nulo ainda verão o modal até enviarem o formulário.

Ver `deploy/.env.example`.
