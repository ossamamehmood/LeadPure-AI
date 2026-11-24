async function checkApi() {
  try {
    const res = await fetch('https://leadpureai.vercel.app/api/validate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: ['kristina@beautifulmedspa.com', 'bellanacosta1@gmail.com', 'katie@studio-esthetics.com']
      })
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Result:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}
checkApi();
