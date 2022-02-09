const fetch = require('cross-fetch');

const exchangeCodeForToken = async (code) => {
  const tokenReq = await fetch ('https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GH_CLIENT_ID,
        client_secret: process.env.GH_CLIENT_SECRET,
        code
      })
    });
  const { access_token } = await tokenReq.json();
  return access_token;
};

const getGithubProfile = async (token) => {
  const profileRes = await fetch('https://api.github.com/user', {
    headers: {
      accept: 'application/json',
      Authorization: `token ${token}` 
    },
  });
  return profileRes.json();
};

module.exports = { exchangeCodeForToken, getGithubProfile };
