const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/login', {username: 'admin', password: 'admin123'});
    const token = loginRes.data.token;
    console.log("Got token:", token);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const endpoints = [
      '/api/customers',
      '/api/vendors',
      '/api/items',
      '/api/delivery-challans',
      '/api/production',
      '/api/employees',
      '/api/attendance/today',
      '/api/advances',
      '/api/payouts?status=pending'
    ];
    
    for (const ep of endpoints) {
      try {
        const res = await axios.get(`http://localhost:3000${ep}`);
        console.log(`✅ ${ep}: ${res.status}`);
      } catch (err) {
        console.log(`❌ ${ep}: ${err.response ? err.response.status : err.message}`);
      }
    }
  } catch (err) {
    console.log("Login failed:", err.message);
  }
}

test();
