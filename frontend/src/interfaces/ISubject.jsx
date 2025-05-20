/**
 * @interface ISubject
 * Interface for the Subject in the Observer pattern.
 * @description Interface for the Subject in the Observer pattern.
 * @property {(observer: IObserver) => void} subscribe - Adds an observer to the notification list.
 * @property {(observer: IObserver) => void} unsubscribe - Removes an observer from the notification list.
 * @property {(data: any) => void} notify - Notifies all registered observers.
 */
const ISubject = {
    subscribe: (observer) => {
    },
    unsubscribe: (observer) => {
    },
    notify: (data) => {
    }
};

export default ISubject;