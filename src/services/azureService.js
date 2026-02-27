/**
 * azureService.js
 * Busca o IP público da VM CS2 via Azure Management REST API
 *
 * Fluxo:
 * 1. Obtém token OAuth2 via client_credentials (Service Principal)
 * 2. Busca a VM para encontrar o NIC associado
 * 3. Busca o NIC para encontrar o publicIPAddress associado
 * 4. Busca o publicIPAddress para obter o IP
 */

const TENANT_ID        = import.meta.env.VITE_AZURE_TENANT_ID;
const CLIENT_ID        = import.meta.env.VITE_AZURE_CLIENT_ID;
const CLIENT_SECRET    = import.meta.env.VITE_AZURE_CLIENT_SECRET;
const SUBSCRIPTION_ID  = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
const RESOURCE_GROUP   = import.meta.env.VITE_RESOURCE_GROUP;
const VM_NAME          = import.meta.env.VITE_VM_NAME;
const API_VERSION_VM   = '2023-09-01';
const API_VERSION_NET  = '2023-09-01';

const BASE_URL = '/azure-api'; // proxy vite em dev; em prod usar URL direta

// ── 1. Obter token ──────────────────────────────────────────────────────────
async function getAccessToken() {
  const tokenUrl = `/azure-token/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope:         'https://management.azure.com/.default',
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token error: ${err.error_description || res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── 2. Buscar VM ────────────────────────────────────────────────────────────
async function getVM(token) {
  const url = `${BASE_URL}/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${VM_NAME}?api-version=${API_VERSION_VM}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`VM fetch error: ${res.statusText}`);
  return res.json();
}

// ── 3. Buscar NIC ───────────────────────────────────────────────────────────
async function getNIC(token, nicId) {
  const url = `${BASE_URL}${nicId}?api-version=${API_VERSION_NET}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`NIC fetch error: ${res.statusText}`);
  return res.json();
}

// ── 4. Buscar Public IP ─────────────────────────────────────────────────────
async function getPublicIP(token, pipId) {
  const url = `${BASE_URL}${pipId}?api-version=${API_VERSION_NET}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`PublicIP fetch error: ${res.statusText}`);
  return res.json();
}

// ── 5. Buscar status da VM (Running / Deallocated / etc) ────────────────────
async function getVMStatus(token) {
  const url = `${BASE_URL}/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${VM_NAME}/instanceView?api-version=${API_VERSION_VM}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`VM status error: ${res.statusText}`);
  const data = await res.json();

  // Pega o status mais relevante (ex: "PowerState/running")
  const statuses = data.statuses || [];
  const powerState = statuses.find(s => s.code?.startsWith('PowerState/'));
  return powerState ? powerState.displayStatus : 'Unknown';
}

// ── Main export ─────────────────────────────────────────────────────────────
export async function fetchServerInfo() {
  const token = await getAccessToken();

  // Busca VM e status em paralelo
  const [vm, vmStatus] = await Promise.all([
    getVM(token),
    getVMStatus(token),
  ]);

  // Pega o primeiro NIC
  const nicRef = vm.properties?.networkProfile?.networkInterfaces?.[0];
  if (!nicRef) throw new Error('Nenhum NIC encontrado na VM');

  // Remove subscription prefix para usar com proxy
  const nicIdClean = nicRef.id.replace('/subscriptions', '/subscriptions');
  const nic = await getNIC(token, nicRef.id.replace('https://management.azure.com', ''));

  // Pega o primeiro IP config com publicIPAddress
  const ipConfigs = nic.properties?.ipConfigurations || [];
  const pipRef = ipConfigs[0]?.properties?.publicIPAddress;

  let publicIP = null;
  if (pipRef) {
    const pip = await getPublicIP(token, pipRef.id.replace('https://management.azure.com', ''));
    publicIP = pip.properties?.ipAddress || null;
  }

  return {
    ip: publicIP,
    vmStatus,         // "VM running", "VM deallocated", etc.
    vmName: VM_NAME,
    location: vm.location,
    vmSize: vm.properties?.hardwareProfile?.vmSize,
  };
}
