const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// Authentication

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), createEvent);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

// Function to Create Event

function createEvent(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  var event = {
  'summary': 'Test Event',
  'description': 'this is a test event',
  'start': {
    'dateTime': new Date(2021, 2, 3, 9, 0, 0), // example - from 3/Feb/2021 9AM
    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  'end': {
    'dateTime': new Date(2021, 2, 3, 10, 0, 0), // example - till 3/Feb/2021 10AM
    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  // Creating a new Meet Conference 
  'conferenceData': {
    'createRequest': {requestId: Math.random().toString(36).substring(7)} // create random request id
  },
  'attendees': [
    // {'email': 'abcd@example.com'},
  ],
  'reminders': {
    'useDefault': true,
  },
};

calendar.events.insert({
  auth: auth,
  calendarId: 'primary',
  resource: event,
  conferenceDataVersion: 1 // this is IMPORTANT. conferenceDataVersion 1 supports Meet Calls, not 0
}, function(err, event) {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
  // Calendar Link - event.data.htmlLink
  // Meet Link - event.data.hangoutLink
  console.log('Event created.\nLink: %s\nMeet Link: %s', event.data.htmlLink, event.data.hangoutLink);
});
}