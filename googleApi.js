var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
// var fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const config = require('./config.js')
// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'credentials.json';

var getFile = async (filename) => {
  console.log('getFile', filename)
  return await fs.readFileAsync(filename, "utf8")
};

var getParsedCredentials = async (credentials) => {
  // console.log('getParsedCredentials',credentials)
  return new Promise((resolve, reject) => {
    resolve(JSON.parse(credentials))
  })
}
var getAuthClient = async (parced_credentials) => {
  console.log('getAuthClient' ,parced_credentials)
  const {client_secret, client_id, redirect_uris} = parced_credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  return new Promise((resolve, reject) => {
    getFile(TOKEN_PATH).then((token) => {
      console.log('in get',token)
      resolve({oAuth2Client, token})
    }).catch((err) => {
      console.log('errrrrr', err)
    })
  })
}
var setToken = function(one) {
  console.log('setToken', one)
  one.oAuth2Client.setCredentials(JSON.parse(one.token));
  return new Promise((resolve, reject) => {
    resolve(one.oAuth2Client)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

var listMajors = async (auth, user_key, target) => {
  // console.log('listMajors', auth, user_key)
  const sheets = google.sheets({version: 'v4', auth});
  let promisfyGet = Promise.promisify(sheets.spreadsheets.values.get);
  return await promisfyGet({
    spreadsheetId: config.spreadsheetId,
    // range: `${user_key}!E2:G2`,
    range: `${user_key}${target}`,
  })
}

var getData = async (userKey, target) => {
  try {       
    let file = await getFile('client_secret.json')
    let parsed_cred = await getParsedCredentials(file)
    let authClient = await getAuthClient(parsed_cred)
    let authentcated_token = await setToken(authClient)
    let response = await listMajors(authentcated_token, userKey, target)
    // console.log('list',response.data.values)
    return response.data.values
  } catch (err) {
    console.log('err',err)
  }
}

module.exports = {
  getFile,
  getParsedCredentials,
  getAuthClient,
  setToken,
  getNewToken,
  listMajors,
  getData
}