const BASE_URL = "http://localhost:8080/api"; 
// later replace with Netlify + Render backend URL

export async function apiGetAllLinks() {
  const res = await fetch(`${BASE_URL}/links`);
  return await res.json();
}

export async function apiCreateLink(data) {
  const res = await fetch(`${BASE_URL}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function apiDeleteLink(id) {
  await fetch(`${BASE_URL}/links/${id}`, { method: "DELETE" });
}

export async function apiUpdateClicks(id) {
  const res = await fetch(`${BASE_URL}/links/${id}/click`, { method: "PUT" });
  return await res.json();
}
