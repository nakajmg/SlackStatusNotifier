const request = require('axios')
const mongoose = require('mongoose')
const Slack = require('slack-node')
const slack = new Slack()
const URI = process.env.ENV_SLACK_HOOK || require('./.env').ENV_SLACK_HOOK
slack.setWebhook(URI)
const {reduce, isUndefined, keys} = require('lodash')

const employees = [
  'kyosuke',
  'soto',
  'nakajmg',
  'tacamy',
  '5509',
  'cancer',
  'cyokodog',
  'geckotang',
  'myakura',
  'obara',
  'oosugi',
  'takazudo',
  'tomof',
  'y-maru',
  'ykhs',
  'yomotsu'
]

const token = process.env.ENV_SLACK_TOKEN || require('./.env').ENV_SLACK_TOKEN
const options = {
  url: 'https://slack.com/api/users.list',
  method: 'POST',
  params: {
    token: token
  },
}


mongoose.connect(process.env.MONGODB_URI || require('./.env').MONGODB_URI)

const StatusSchema = new mongoose.Schema({status: Object})
mongoose.model('Status', StatusSchema)
const Status = mongoose.model('Status')

const exit = () => {
  mongoose.connection.close()
//  process.exit()
}

!(async () => {
  const data = await Status.findOne({}).catch(err => err)
  if (!data || data instanceof Error) {
    return require('./fixture')
  }
  const prevStatus = data.status
  const body = await request(options).then(res => res.data).catch((err) => {
    exit()
  })
  if (body.ok === false) return exit()

  const status = body.members.reduce(function (ret, member) {
    if (employees.includes(member.name)) {
      ret[member.name] = {
        status_emoji: member.profile.status_emoji,
        status_text: member.profile.status_text,
      }
    }
    return ret
  }, {})

  const statusDiff = reduce(status, (ret, {status_emoji, status_text}, key) => {
    if (!prevStatus[key] || isUndefined(status_emoji) || isUndefined(status_text)) return ret
    if (prevStatus[key].status_emoji !== status_emoji || prevStatus[key].status_text !== status_text) {
      ret[key] = {
        status_text,
        status_emoji
      }
    }
    return ret
  }, {})

  if (keys(statusDiff).length === 0) return exit()

  webhook(statusDiff)

  await Status.remove({})
  const _status = new Status()
  _status.status = status
  _status.save((err) => {
    mongoose.connection.close()
    if (err) throw err
  })

})()

function webhook(statusDiff) {
  console.log(statusDiff)
  const formatted = Object.keys(statusDiff).map(function (name) {
    const member = statusDiff[name]
    return `${member.status_emoji ? member.status_emoji : ':grey_question:'} *${name}* - ${member.status_text ? member.status_text : '?'}`
  }).join(`\n`)

  slack.webhook({
    channel: '#pxgrid-status',
    username: 'StatusNotifier',
    text: formatted,
    icon_emoji: ':robot_face:',
  }, (err, res) => {
    console.log(res)
  })
}

