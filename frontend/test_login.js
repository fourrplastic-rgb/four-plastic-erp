const axios = require('axios');
axios.post('http://localhost:3000/api/login', {username: 'admin', password: 'admin123'}, {
  headers: {
    'Authorization': 'Bearer undefined'
  }
})
  .then(res => console.log("SUCCESS:", res.status))
  .catch(err => console.log("ERROR:", err.response ? err.response.status : err.message));
