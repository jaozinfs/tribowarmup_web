# CS2 Server Browser

Interface React que busca o IP público da VM Azure dinamicamente e exibe os servidores CS2.

## Pré-requisitos

- Node.js 18+
- Uma VM Azure rodando o servidor CS2
- Um Service Principal Azure com permissão de leitura

---

## 1. Criar Service Principal no Azure

Execute no PowerShell:

```powershell
# Criar o App Registration (Service Principal)
az ad sp create-for-rbac `
  --name "cs2-browser-sp" `
  --role "Reader" `
  --scopes "/subscriptions/a0e27fb4-2280-4240-99f2-5122ef3266fd/resourceGroups/cs2-rg"
```

O output vai trazer:
```json
{
  "appId":       "→ VITE_AZURE_CLIENT_ID",
  "password":    "→ VITE_AZURE_CLIENT_SECRET",
  "tenant":      "→ VITE_AZURE_TENANT_ID"
}
```

---

## 2. Configurar o .env

```bash
cp .env.example .env
```

Edite `.env` com os valores acima:

```env
VITE_AZURE_TENANT_ID=...
VITE_AZURE_CLIENT_ID=...
VITE_AZURE_CLIENT_SECRET=...
VITE_AZURE_SUBSCRIPTION_ID=a0e27fb4-2280-4240-99f2-5122ef3266fd
VITE_RESOURCE_GROUP=cs2-rg
VITE_VM_NAME=cs2-vm
VITE_CS2_PORT=27015
VITE_GOTV_PORT=27020
```

---

## 3. Instalar e rodar

```bash
npm install
npm run dev
```

Abra: http://localhost:5173

---

## 4. Build para produção

```bash
npm run build
```

Os arquivos ficam em `dist/` — pode hospedar no Azure Static Web Apps, Vercel, Netlify, etc.

---

## Estrutura

```
src/
├── services/
│   └── azureService.js   ← chama Azure Management API
├── hooks/
│   └── useServerInfo.js  ← lógica de estado e polling
├── App.jsx               ← interface principal
└── index.css             ← tema CS2 dark/gold
```

## Observação de segurança

O `client_secret` fica exposto no bundle do frontend (variáveis `VITE_`).
Para produção, crie um backend simples (Azure Function, por exemplo) que expõe
apenas o IP público, sem expor as credenciais.
