class Timer{
    /**
     * Timer constructor
     */
    constructor(){
        this.timers = {};
    }

    /**
     * Start a new timer
     *
     * @param name
     * @returns {Timer}
     */
    start(name){
        name = String(name);
        this.timers[name] = {
            start: Date.now(),
            stop: null
        };
        return this;
    }

    /**
     * Stop a timer
     *
     * @param name
     * @returns {Timer}
     */
    stop(name){
        name = String(name);
        if(!this.timers[name]){
            throw new Error(`Timer ${name.toUpperCase()} has not been started yet`);
        }
        if(this.timers[name].stop){
            console.warn(`Timer ${name.toUpperCase()} has already been stopped`);
        }
        this.timers[name].stop = Date.now();
        return this;
    }

    /**
     * Get current value of a timer
     *
     * @param name
     * @returns {number}
     */
    time(name){
        if(!this.timers[name]){
            throw new Error(`Timer ${name.toUpperCase()} has not been started yet`);
        }
        if(!this.timers[name].stop){
            return Date.now() - this.timers[name].start;
        }
        return this.timers[name].stop - this.timers[name].start;
    }

    /**
     * Get formatted debug getMessage for all timers
     *
     * @param info
     * @returns {string}
     */
    getMessage(info = null){
        let maxLength = 0;
        for(let name in this.timers){
            if(!this.timers.hasOwnProperty(name) || !this.timers[name].stop){
                continue;
            }
            maxLength = name.length > maxLength ? name.length : maxLength;
        }
        let msgs = [];
        msgs.push(`[TIMERS${info ? ` ${info}` : ''}]`);
        for(let name in this.timers){
            if(!this.timers.hasOwnProperty(name) || !this.timers[name].stop){
                continue;
            }
            let padding = (' ').repeat(maxLength - name.length);
            msgs.push(`[${padding}${name.toUpperCase()}] ${this.time(name) / 1000}s`)
        }
        return msgs.join('\n');
    }
    toString(){
        return this.getMessage();
    }
}

module.exports = Timer;
