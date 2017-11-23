/**
 * Created by HJ on 2017/8/23.
 */

function Memory() {

    this.id = ''
    this.nid = -1
    this.gold = 0
    this.type = 0
    this.addedMoney = false
    this.profit = 0
    this.round = 0
    this.roomCode = -1
    this.entertime = -1
    this.lifelong = -1

    this.teaseTimerRef = null
    this.playTimerRef = null
    this.lifeCheckTimerRef = null

    this.playerrorTime = 0
    this.stoped = false

    this.tease = ['想把机器砸了',
        '早知道爆完就闪了，砍手呀',
        '......',
        '换机器',
        '换鸡',
        '怎么就是停不下来',
        '五连出了，爆不爆嘛',
        '差不多了',
        '疯了，今天机器疯了',
        '有朋友一起换机爆不',
        '拼了，今天非要爆出来',
        '兄弟们，怎么样呀',
        '其他人如何嘛',
        '你们爆没有，爆了就换了',
        '已爆，换',
        '这么多把了，爆不啦',
        '老板多上几台机器嘛..',
        '有没有爆的，喊一声',
        '有没有兄弟约起爆机，分',
        '日起火，小奖没完了',
        '输安逸了，哪个赢了',
        '丢',
        '呀呀呀',
        '打不爆，老子不姓..',
        '哪个给个VIP码',
        '求VIP码',
        '给码',
        '机器多的，拿个码',
        '机多出码，少勿扰']

}

module.exports = Memory
