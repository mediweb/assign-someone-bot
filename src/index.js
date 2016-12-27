'user strict'

const ENV = require('dotenv').config({silent: true});
const rp = require('request-promise');
var SlackWebhook = require('slack-webhook');

const authorizeURL = 'https://trello.com/1/OAuthAuthorizeToken'
const appName = 'Trello Slack Integration for MW'

exports.handler = (event, context, callback) => {
  var blockedCards = [];
  var pGetCards = new Promise( (resolve, reject) => {
    req(`/boards/${ENV.TRELLO_BOARD_ID}/cards`).then((cards) => {
      blockedCards = cards
        .filter( (c) => c.labels.find( (l) => l.name === 'Blocked' ) )
        .filter( (c) => c.idMembers.length === 0 );
      resolve();
    }).catch((e) => {
      reject(e);
    });
  });
  Promise.all([pGetCards]).then( () => {
    attachments = [];
    blockedCards.forEach( (c) => {
      attachments.push({
        "color": "#4D4D4D",
        "title": c.name,
        "title_link": c.url,
        "text": "This card is blocked but no one is assigned.",
      });
    });

    if (attachments.length === 0 ) return; // GOOD!
    var slack = new SlackWebhook( ENV.SLACK_INCOMING_WEBHOOK,
      {
        "defaults": {
          username: 'Assign Someone Bot',
          channel: '#goodmorning',
          icon_emoji: ':robot_face:'
        }
      }
    );

    slack.send({ attachments });
  }).catch( (e) => {
    console.error(e);
  });
}

function req(path, method) {
  var method  = method || 'GET';
  return rp({
    method,
    uri: 'https://api.trello.com/1' + path,
    qs: {
      key: ENV.TRELLO_KEY,
      token: ENV.TRELLO_TOKEN,
    },
    json: true,
  });
};
