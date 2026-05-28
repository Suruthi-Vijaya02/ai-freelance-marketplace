const base = 'http://localhost:5001/api';

async function login(email) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo1234' }),
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  console.log('Client login:', await login('client@demo.com'));
  console.log('Freelancer login:', await login('freelancer@demo.com'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
