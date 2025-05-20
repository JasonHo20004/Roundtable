/**
 * @interface IObserver - Interface for an observer in the Observer pattern.
 * @description Interface for an observer in the Observer pattern.
 * @property {(data: any) => void} update - Method called by the Subject to notify the observer.
 */
const IObserver = {
    update: (data) => {
    }
};

export default IObserver;