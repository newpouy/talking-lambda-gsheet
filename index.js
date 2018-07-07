var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
const readline = require('readline');
const {google} = require('googleapis');
const config = require('./config.js')
// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'credentials.json';

var getFile = function (filename) {
  // console.log('getFile', filename)
  return fs.readFileAsync(filename, "utf8")
};

var getParsedCredentials = function(credentials) {
  // console.log('getParsedCredentials',credentials)
  return new Promise((resolve, reject) => {
    resolve(JSON.parse(credentials))
  })
}
var getAuthClient = function(parced_credentials) {
  // console.log('getAuthClient' ,parced_credentials)
  const {client_secret, client_id, redirect_uris} = parced_credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  return new Promise((resolve, reject) => {
    getFile(TOKEN_PATH).then((token) => {
      // console.log(token)
      resolve({oAuth2Client, token})
    }).catch((err) => {
      console.log('errrrrr', err)
    })
  })
}
var setToken = function(one) {
  // console.log('setToken', one)
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

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth, user_key) {
  // console.log('listMajors', auth, user_key)
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    // spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    spreadsheetId: config.spreadsheetId,
    range: `${user_key}!A2:P`,
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:',user_key);
      // Print columns A and E, which corres
        return new Promise((resolve, reject) => {
          console.log('rows',rows)
          resolve(rows)
        })
    } else {
      console.log('No data found.');
    }
  });
}

function makeData(wordData) {
  console.log('rows', wordData)
  var data = {
    "message": {
      "text": wordData,
      
    //   "photo": {
    //     "url": "https://photo.src",
    //     "width": 640,
    //     "height": 480
    //   },
    //   "message_button": {
    //     "label": "주유 쿠폰받기",
    //     "url": "https://coupon/url"
    //   }
    },
    "keyboard": {
      "type": "buttons",
      "buttons": [
        "복습",
        "리뷰",
        "hot"
      ]
    }
  }
   
  // });  // rows.map((row) => {
 
  console.log('data', data)
  return data
}

exports.handler = (event) => {
  // console.log(event)
  getFile('client_secret.json')
  .then(getParsedCredentials)
  .then(getAuthClient)
  .then(setToken)
  .then((auth) => {
    listMajors(auth, event.user_key)
      .then((sheet_data) => {
        console.log(sheet_data)
        return makeData(sheet_data.join(", "));
      })    
  })
};