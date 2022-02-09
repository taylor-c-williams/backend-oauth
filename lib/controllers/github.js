const { loadPartialConfigAsync } = require('@babel/core');
const { Router } = require('express');
const fetch = require(cross - fetch);
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const GithubUser = require('../models/GithubUser');
const { exchangeCodeForToken, getGithubProfile } = require('../utils/github');

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

module.exports = Router()
  .get('/login', async (req, res) => {
    // TODO: Kick-off the github oauth flow
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GH_CLIENT_ID}&redirect_uri=${process.env.GH_REDIRECT_URI}&scope=user} `);
  })

  .get('/login/callback', async (req, res) => {    
    // TODO:
    //  * get code
    const { code } = req.query;
    //  * exchange code for token
    const tokenReq = await fetch ('https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GH_CLIENT_ID,
          client_secret: process.env.GH_CLIENT_SECRET,
          code
        })
      });

    const { access_token } = await tokenReq.json();

    //  * get info from github about user with token
    const profileReq = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/json',
        Authorization: `token${access_token}` 
      },
    });
    const { login, avatar_url } = await profileReq.json();

    //  * get existing user if there is one
    let githubUser = await GithubUser.findByUsername(login);

    //  * if not, create one
    if (!githubUser){
      githubUser = await GithubUser.insert({ username: login, photoUrl: avatar_url });
    }

    //  * create jwt
    //  * set cookie and redirect
    res
      .cookie('session', sign(githubUser), {
        httpOnly: true,
        maxAge: ONE_DAY_IN_MS,
      })
      .redirect('/dashboard');  
  })

  .get('/dashboard', authenticate, async (req, res) => {
    // require req.user
    // get data about user and send it as json
    res.json(req.user);
  })
  .delete('/sessions', (req, res) => {
    res
      .clearCookie(process.env.COOKIE_NAME)
      .json({ success: true, message: 'Signed out successfully!' });
  });
