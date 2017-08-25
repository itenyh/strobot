
function A() {

    this.a = 1

    this.fuck = () => {
        enen()
    }

    function enen() {
        console.log(this.a)
    }

}

const AA = new A()
AA.fuck()