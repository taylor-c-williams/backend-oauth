const { Router } = require('express');
const fetch = require('cross-fetch');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const GithubUser = require('../models/GithubUser');
const { exchangeCodeForToken, getGithubProfile } = require('../utils/github');

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

module.exports = Router()
  .get('/login', async (req, res) => {
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GH_CLIENT_ID}&redirect_uri=${process.env.GH_REDIRECT_URI}&scope=user`);
  })


  .get('/login/callback', async (req, res, next) => {    
    try{
      const { code } = req.query;
      const token = await exchangeCodeForToken(code);  
      const { login, email, avatar_url } = await getGithubProfile(token);

      let githubUser = await GithubUser.findByUsername(login);
      if (!githubUser){
        githubUser = await GithubUser.insert({ 
          username: login,
          avatar: avatar_url,
          email });
      }

      const sign = (payload) => {
        return jwt.sign({ ...payload }, process.env.JWT_SECRET, {
          expiresIn:'24h',
        });
      };
    
      res
        .cookie(process.env.COOKIE_NAME, sign(githubUser), {
          httpOnly: true,
          maxAge: ONE_DAY_IN_MS,
        })
        .redirect('/api/v1/github/dashboard');
    } catch (error){
      next(error);
    }
  })

  .get('/dashboard', authenticate, async (req, res) => {
    res.json(req.user);
  })
  .delete('/sessions', (req, res) => {
    res
      .clearCookie(process.env.COOKIE_NAME)
      .json({ success: true, message: 'Signed out successfully!' });
  });
