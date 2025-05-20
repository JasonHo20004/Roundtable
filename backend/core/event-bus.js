import {EventEmitter} from 'events';

class EventBus extends EventEmitter {
    emitEvent(event, payload) {
        this.emit(event, payload);
    }

    subscribe(event, listener) {
        this.on(event, listener);
    }

    unsubscribe(event, listener) {
        this.off(event, listener);
    }
}

const eventBusInstance = new EventBus();
EventBus.setMaxListeners(50);

export default eventBusInstance;
