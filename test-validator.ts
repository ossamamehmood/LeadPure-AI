import { validateEmailFull } from './src/lib/validator.js'; // Note .js extension may be needed for pure Node without ts-node/vite? Or we can just run a curl against the express server.

async function test() {
  try {
    const res = await validateEmailFull("test@gmail.com", {
      excludeDisposable: true,
      excludeRoleBased: true,
      excludeCatchAll: true,
      excludeSpamTraps: true
    });
    console.log(res);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
