const request = require('axios')


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

request(options)
  .then(res => res.data)
  .then(body => {
    const status = body.members.reduce(function (ret, member) {
      if (employees.includes(member.name)) {
        ret[member.name] = {
          status_emoji: member.profile.status_emoji || '',
          status_text: member.profile.status_text || '',
        }
      }
      return ret
    }, {})

    const mongoose = require('mongoose')
    mongoose.connect(process.env.MONGODB_URI || require('./.env').MONGODB_URI)
    const Status = mongoose.model('Status')

    Status.remove({}, (err) => {
      if (err) throw err
      const _status = new Status()
      _status.status = status
      _status.save((err) => {
        if (err) throw err
        mongoose.connection.close()
      })
    })
  })
