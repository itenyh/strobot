
function EggPush() {

    this.eggArray = [];

        this.egg={};
        this.egg.eggData=[];
        this.egg.bet=0;
        this.egg.eggGroup='';
        for(var i=0;i<3;i++){
            this.egg.eggData[i]={};
            this.egg.eggData[i].eggType=0;
            this.egg.eggData[i].eggNumber=0;
            this.egg.eggData[i].multiple=0;

        }

        this.egg.eggData[3]={};
        this.egg.eggData[4]={};

        this.egg.eggData[3].eggType=5;
        this.egg.eggData[3].eggNumber=0;
        this.egg.eggData[3].multiple=[];

        this.egg.eggData[4].eggType=6;
        this.egg.eggData[4].eggNumber=0;
        this.egg.eggData[4].multiple=[];

        this.dealWithEggs = function(eggList) {

            for (let i = 0;i < eggList.length;i++){

                if(eggList[i].eggType==1){
                    this.egg.eggData[0].eggType=1;
                    this.egg.eggData[0].eggNumber++;
                    this.egg.eggData[0].multiple=eggList[i].multiple;
                    this.egg.eggGroup=eggList[i].eggGroup;

                }else if(eggList[i].eggType==2){
                    this.egg.eggData[1].eggType=2;
                    this.egg.eggData[1].eggNumber++;
                    this.egg.eggData[1].multiple=eggList[i].multiple;
                    this.egg.eggGroup=eggList[i].eggGroup;

                }else if(eggList[i].eggType==3){
                    this.egg.eggData[2].eggType=3;
                    this.egg.eggData[2].eggNumber++;
                    this.egg.eggData[2].multiple=eggList[i].multiple;
                    this.egg.eggGroup=eggList[i].eggGroup;

                }else if(eggList[i].eggType==5){
                    this.egg.eggData[3].eggType=5;
                    this.egg.eggData[3].eggNumber++;

                    this.egg.eggData[3].multiple.push(eggList[i].multiple);
                    this.egg.eggGroup=eggList[i].eggGroup;

                }else if(eggList[i].eggType==6){
                    this.egg.eggData[4].eggType=6;
                    this.egg.eggData[4].eggNumber++;

                    this.egg.eggData[4].multiple.push(eggList[i].multiple);

                    this.egg.eggGroup=eggList[i].eggGroup;

                }

                // else{
                // console.log('..................something wrong!'+eggList[i].eggType);
                // }

            }

        }

}

EggPush.prototype.resetNetData = function () {

    this.egg.bet = 0;
    this.egg.eggGroup = '';
    for (var i = 0; i < 3; i++) {

        this.egg.eggData[i].eggType = 0;
        this.egg.eggData[i].eggNumber = 0;
        this.egg.eggData[i].multiple = 0;

    }

    this.egg.eggData[3].eggType = 5;
    this.egg.eggData[3].eggNumber = 0;
    this.egg.eggData[3].multiple.splice(0, this.egg.eggData[3].multiple.length);

    this.egg.eggData[4].eggType = 6;
    this.egg.eggData[4].eggNumber = 0;
    this.egg.eggData[4].multiple.splice(0, this.egg.eggData[4].multiple.length);

}

EggPush.prototype.addPushedEggs = function (eggs) {

    const that = this
    eggs.map(function (x) {

        const eggTypeAndGroup = x.eggType.split('-')
        if (eggTypeAndGroup.length === 2) {
            x.eggType = eggTypeAndGroup[0]
            x.eggGroup = eggTypeAndGroup[1]
        }
        else {
            x.eggGroup = ''
        }

        that.eggArray.push(x)

    })

}

EggPush.prototype.consumEggList = function(length) {

    if (length > this.eggArray.length) {
        console.log('没有这么多蛋供抓取')
        return false
    }

    this.resetNetData()

    //查看这个length中会不会存在被打断的情况
    const eggList = this.eggArray.slice(0, length);

    //打断处理
    let correctEggList = []
    eggList.some(function (x) {
        if (x.eggType != 7 && x.eggType != 4) {
            correctEggList.push(x)
        }
        else {
            return true
        }
    })

    if (correctEggList.length === length) {
        this.dealWithEggs(eggList)
        this.eggArray.splice(0, correctEggList.length)
    }
    else {
        //去除错误蛋所以 +1
        this.eggArray.splice(0, correctEggList.length + 1)
    }

    return (correctEggList.length === length)

}

module.exports = EggPush
