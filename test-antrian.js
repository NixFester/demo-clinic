const BRIDGE_URL = "http://apivercel.healthcenterindonesia.com";
const BRIDGE_SECRET = "simklinik-secret-key-2025-production";

fetch(BRIDGE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bridge-Secret": BRIDGE_SECRET,
  },
  body: JSON.stringify({ action: "antrian.hari_ini", data: {} }),
})
  .then((res) => res.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error(err));
