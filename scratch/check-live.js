async function checkLive() {
  try {
    const res = await fetch('https://leadpureai.vercel.app');
    const html = await res.text();
    const matches = html.match(/\/assets\/[a-zA-Z0-9_\-\.]+\.js/g);
    console.log('Live JS files:', matches);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const jsRes = await fetch('https://leadpureai.vercel.app' + m);
        const js = await jsRes.text();
        const v13 = js.includes('v13') || js.includes('V13');
        const v14 = js.includes('v14') || js.includes('V14');
        console.log(`Asset ${m}: length=${js.length}, v13=${v13}, v14=${v14}`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
checkLive();
