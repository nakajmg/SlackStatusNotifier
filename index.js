const Slack = require('slack-node')
const request = require('axios')
const mongoose = require('mongoose')
const _ = require('lodash')
const slack = new Slack()
const URI = process.env.ENV_SLACK_HOOK || require('./.env').ENV_SLACK_HOOK
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

Status.findOne({}, (err, prev) => {
  const prevStatus = prev.status
  request(options)
    .then(res => res.data)
    .then(body => {
      const status = body.members.reduce(function (ret, member) {
        if (employees.includes(member.name)) {
          ret[member.name] = {
            status_emoji: member.profile.status_emoji,
            status_text: member.profile.status_text,
          }
        }
        return ret
      }, {})

      const statusDiff = _.reduce(status, (ret, {status_emoji, status_text}, key) => {
        if (!prevStatus[key] || _.isUndefined(status_emoji) || _.isUndefined(status_text)) return ret
        if (prevStatus[key].status_emoji !== status_emoji || prevStatus[key].status_text !== status_text) {
          ret[key] = {
            status_text,
            status_emoji
          }
        }
        return ret
      }, {})

      if (_.keys(statusDiff).length === 0) {
        mongoose.connection.close()
      }
      else {
        webhook(statusDiff)
        console.log(statusDiff)
        Status.remove({}, (err) => {
          if (err) throw err
          const _status = new Status()
          _status.status = status
          _status.save((err) => {
            if (err) throw err
            mongoose.connection.close()
          })
        })
      }
    })
    .catch(err => {
      mongoose.connection.close()
      throw err
    })

})

function webhook(statusDiff) {
  const formatted = Object.keys(statusDiff).map(function (name) {
    const member = statusDiff[name]
    return `${member.status_emoji ? member.status_emoji : ':grey_question:'} *${name}* - ${member.status_text ? member.status_text : '?'}`
  }).join(`\n`)

  slack.webhook({
    channel: '#test-pxgrid-bot',
    username: 'StatusNotifier',
    text: formatted,
    icon_emoji: ':robot_face:',
  }, (err, res) => {
    console.log(res)
  })
}

