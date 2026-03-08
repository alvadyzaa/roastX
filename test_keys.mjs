async function testKey(apiKey, name) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello, reply with OK" }] }]
    }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`[${name}] SUCCESS!`);
  } else {
    console.log(`[${name}] FAILED: ${res.status} - ${data.error?.message}`);
  }
}

async function main() {
  const keys = [
    { name: 'GEMINI_API_KEY_1', key: process.env.GEMINI_API_KEY_1 },
    { name: 'GEMINI_API_KEY_2', key: process.env.GEMINI_API_KEY_2 },
    { name: 'GEMINI_API_KEY_3', key: process.env.GEMINI_API_KEY_3 },
  ];
  for (const k of keys) {
    if (k.key) {
      await testKey(k.key, k.name);
    } else {
      console.log(`[${k.name}] NOT FOUND`);
    }
  }
}

main();
