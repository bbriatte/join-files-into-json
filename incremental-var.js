'use strict';

class IncrementalVar {
    static get matchingRegex() {
        return /{.*}/;
    };

    constructor(obj) {
        if(typeof obj === 'object') {
            this.initial = obj.initial;
            this.name = obj.name;
            this.fill = obj.fill;
            this.val = obj.val;
            this.key = obj.key;
        } else if(typeof obj === 'string') {
            const str = obj;
            let firstLetter = 1;
            for(; firstLetter < str.length - 1; firstLetter++) {
                if(str[firstLetter].toUpperCase() !== str[firstLetter].toLowerCase()) {
                    break;
                }
            }
            const equal = str.indexOf('=');
            if(equal >= 0) {
                this.initial = parseInt(str.substring(equal + 1, str.length - 1));
                this.name = str.substring(firstLetter, equal);
            } else {
                this.initial = 0;
                this.name = str.substring(firstLetter, str.length - 1);
            }
            if(firstLetter > 1) {
                this.fill = parseInt(str.substring(1,firstLetter));
            }
            this.val = this.initial;
            this.key = str;
        }
    }

    getPrettyVar() {
        if(this.fill !== undefined) {
            return ('0'.repeat(this.fill) + this.val).substr(-this.fill);
        }
        return this.val;
    }

    nextVar() {
        return new IncrementalVar({
            initial: this.initial,
            name: this.name,
            fill: this.fill,
            val: this.val + 1,
            key: this.key
        });
    }
}

module.exports = IncrementalVar;