const Slack = require('slack-node')
const request = require('axios')
const URI = process.env.ENV_SLACK_HOOK
const slack = new Slack()
slack.setWebhook(URI)

const employees = [
  'kyosuke',
  'soto',
  'nakajmg',
  'tacamy',
  '5509',
  'armorik83',
  'cancer',
  'cyokodog',
  'geckotang',
  'leader22',
  'myakura',
  'obara',
  'oosugi',
  'takazudo',
  'tomof',
  'y-maru',
  'ykhs',
  'yomotsu'
]

const token = proess.env.ENV_SLACK_TOKEN
const options = {
  url: 'https://slack.com/api/users.list',
  method: 'POST',
  params: {
    token: token
  },
}

request(options)
  .then(res => res.data)
  .then(body => {
    const status = body.members.reduce(function (ret, member) {
      if (employees.includes(member.name)) {
        ret[member.name] = {
          emoji: member.profile.status_emoji,
          text: member.profile.status_text,
        }
      }
      return ret
    }, {})
    const formatted = Object.keys(status).map(function (name) {
      const member = status[name]
      return `${member.emoji ? member.emoji : ':grey_question:'} *${name}* - ${member.text ? member.text : '?'}`
    }).join(`\n`)

    slack.webhook({
      channel: '#times-nakajmg',
      username: 'StatusNotifier',
      text: formatted,
      icon_emoji: ':robot_face:',
    }, (err, res) => {
      console.log(res)
    })
  })
